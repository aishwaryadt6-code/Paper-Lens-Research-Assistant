import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  MiniMap,
} from 'reactflow';
import * as d3Force from 'd3-force';
import { aiService } from './aiService';
import { Button } from '../../components/ui/Button';
import { AlertCircle, Network } from 'lucide-react';

// Import CSS
import 'reactflow/dist/style.css';

interface GraphPanelProps {
  currentPaper: any;
  allPapers: any[];
  aiStatus?: any;
}

// Upgraded Custom Node Component
const MiniPaperNode = ({ data, selected }: NodeProps) => {
  const isCurrent = data.isCurrent;
  const title = data.title || 'Untitled';
  
  // Truncate title to 25-35 characters
  const truncatedTitle = title.length > 30 ? title.substring(0, 27) + '...' : title;
  
  // Dynamic color based on cluster_id
  const cluster_id = typeof data.cluster_id === 'number' ? data.cluster_id : 0;
  
  const clusterColors = [
    { border: 'border-purple-300 dark:border-purple-800 hover:border-purple-500', bg: 'bg-purple-50/70 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
    { border: 'border-blue-300 dark:border-blue-800 hover:border-blue-500', bg: 'bg-blue-50/70 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    { border: 'border-emerald-300 dark:border-emerald-800 hover:border-emerald-500', bg: 'bg-emerald-50/70 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    { border: 'border-amber-300 dark:border-amber-800 hover:border-amber-500', bg: 'bg-amber-50/70 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    { border: 'border-rose-300 dark:border-rose-800 hover:border-rose-500', bg: 'bg-rose-50/70 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' }
  ];
  
  const style = clusterColors[cluster_id % 5];
  
  return (
    <div
      className={`group relative px-4 py-3 rounded-xl border text-left transition-all text-xs font-semibold max-w-[200px] shadow-sm ${style.bg} ${style.border} ${
        isCurrent
          ? 'ring-2 ring-brand-500 scale-[1.04] border-brand-500 z-50 shadow-md'
          : selected
          ? 'border-slate-500 ring-1 ring-slate-400'
          : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      
      <div className="flex flex-col gap-1 select-none">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${isCurrent ? 'bg-brand-500 animate-pulse' : style.dot}`} />
          <span className={`font-extrabold truncate ${style.text}`}>{truncatedTitle}</span>
        </div>
        
        {data.authors && (
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate">
            {data.authors}
          </span>
        )}
      </div>
      
      {/* Tooltip on Hover */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] p-3 rounded-lg shadow-xl max-w-[240px] pointer-events-none border border-slate-850">
        <p className="font-bold text-xs mb-1 text-slate-100">{title}</p>
        {data.authors && <p className="text-slate-350 font-semibold mb-1">Authors: {data.authors}</p>}
        {data.cluster_reason && <p className="text-slate-300 font-semibold mb-1 italic">Reason: {data.cluster_reason}</p>}
        {data.abstract && (
          <p className="text-slate-400 font-medium leading-relaxed line-clamp-3">
            {data.abstract}
          </p>
        )}
      </div>
    </div>
  );
};

// Non-clickable Cluster Label Node
const ClusterHeaderNode = ({ data }: any) => {
  return (
    <div className="px-4 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 shadow-sm pointer-events-none select-none">
      {data.label}
    </div>
  );
};

const nodeTypes = {
  miniPaper: MiniPaperNode,
  clusterHeader: ClusterHeaderNode,
};

export default function GraphPanel({ currentPaper, allPapers, aiStatus }: GraphPanelProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  // Filters & State
  const [threshold, setThreshold] = useState(0.50);
  const [showContradictions, setShowContradictions] = useState(false);
  const [strongOnly, setStrongOnly] = useState(false);
  const [showClusterView, setShowClusterView] = useState(true);

  // Keep copy of raw results
  const [rawGraph, setRawGraph] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setIsOffline(false);
    try {
      const res = await aiService.generateGraph(allPapers);
      
      if (res.nodes.length === 0 && allPapers.length > 1) {
        setIsOffline(true);
        setLoading(false);
        return;
      }

      setRawGraph(res);
      layoutAndSet(res.nodes, res.edges);
    } catch (e) {
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, [allPapers]);

  // Run layout
  const layoutAndSet = (rawNodes: any[], rawEdges: any[]) => {
    if (rawNodes.length === 0) return;

    // Filter edges
    const filteredEdges = rawEdges.filter((e) => {
      const score = Math.max(e.similarityScore || 0, e.contradictionScore || 0);
      if (score < threshold) return false;
      if (strongOnly && score < 0.75) return false;
      if (showContradictions && e.relationType !== 'contradiction') return false;
      return true;
    });

    // Extract connected node IDs
    const connectedIds = new Set<string>();
    filteredEdges.forEach((e) => {
      connectedIds.add(e.sourcePaperId || e.source);
      connectedIds.add(e.targetPaperId || e.target);
    });

    // Always include current paper if available
    if (currentPaper?._id) {
      connectedIds.add(currentPaper._id);
    }

    // Filter nodes list
    const visibleNodes = rawNodes.filter((n) => connectedIds.has(n.id) || rawNodes.length <= 10);

    // Dynamic Cluster Centers Layout
    const clusterCenters: Record<number, { x: number; y: number }> = {
      0: { x: 150, y: 150 },
      1: { x: 650, y: 150 },
      2: { x: 150, y: 550 },
      3: { x: 650, y: 550 },
      4: { x: 400, y: 350 },
    };

    // Perform force layout
    const simNodes = visibleNodes.map((n) => ({
      ...n,
      x: n.x || Math.random() * 500,
      y: n.y || Math.random() * 400,
    }));
    const simLinks = filteredEdges.map((e) => ({
      source: e.sourcePaperId || e.source,
      target: e.targetPaperId || e.target,
    }));

    const simulation = d3Force
      .forceSimulation(simNodes)
      .force(
        'link',
        d3Force
          .forceLink(simLinks)
          .id((d: any) => d.id)
          .distance((link: any) => {
            const edge = filteredEdges.find(
              (e) =>
                ((e.sourcePaperId || e.source) === link.source.id && (e.targetPaperId || e.target) === link.target.id) ||
                ((e.sourcePaperId || e.source) === link.target.id && (e.targetPaperId || e.target) === link.source.id)
            );
            if (edge) {
              if (edge.relationType === 'similarity') {
                return edge.similarityScore >= 0.75 ? 90 : 140;
              }
              if (edge.relationType === 'contradiction') {
                return 160;
              }
            }
            return 180;
          })
      )
      .force('charge', d3Force.forceManyBody().strength(-500))
      .force(
        'x',
        d3Force
          .forceX()
          .x((d: any) => {
            const c_id = typeof d.cluster_id === 'number' ? d.cluster_id : 0;
            return clusterCenters[c_id % 5].x;
          })
          .strength(showClusterView ? 0.35 : 0.05)
      )
      .force(
        'y',
        d3Force
          .forceY()
          .y((d: any) => {
            const c_id = typeof d.cluster_id === 'number' ? d.cluster_id : 0;
            return clusterCenters[c_id % 5].y;
          })
          .strength(showClusterView ? 0.35 : 0.05)
      )
      .force('collide', d3Force.forceCollide().radius(80))
      .force('center', d3Force.forceCenter(400, 350))
      .stop();

    // Warm-up force simulation
    for (let i = 0; i < 150; i++) simulation.tick();

    // Map to ReactFlow node representation
    let rfNodes = simNodes.map((n) => ({
      id: n.id,
      type: 'miniPaper',
      position: { x: n.x, y: n.y },
      data: {
        title: n.title,
        isCurrent: currentPaper ? n.id === currentPaper._id : false,
        cluster_id: n.cluster_id,
        cluster_label: n.cluster_label,
        authors: n.authors,
        abstract: n.abstract,
        cluster_reason: n.cluster_reason,
      },
    }));

    // Inject visual header nodes for clusters
    if (showClusterView) {
      const activeClusters = new Set<number>();
      simNodes.forEach((n) => {
        if (typeof n.cluster_id === 'number') {
          activeClusters.add(n.cluster_id);
        }
      });

      const headerNodes = Array.from(activeClusters).map((cid) => {
        const center = clusterCenters[cid % 5];
        const paperInCluster = simNodes.find((n) => n.cluster_id === cid);
        const label = paperInCluster?.cluster_label || `Cluster ${cid + 1}`;
        return {
          id: `cluster-header-${cid}`,
          type: 'clusterHeader',
          position: { x: center.x - 70, y: center.y - 140 },
          data: { label },
          draggable: false,
          selectable: false,
          style: { pointerEvents: 'none' as const },
        };
      });

      rfNodes = [...rfNodes, ...headerNodes];
    }

    // Custom Edge Styling & Labeling
    const rfEdges = filteredEdges.map((e) => {
      let strokeColor = '#CBD5E1'; // light gray
      let strokeWidth = 1.0;
      let isDashed = false;
      let isDotted = false;
      
      const similarity = e.similarityScore || 0;
      const contradiction = e.contradictionScore || 0;
      const scorePercentage = Math.round(Math.max(similarity, contradiction) * 100);

      let labelText = '';

      if (e.relationType === 'similarity') {
        if (similarity >= 0.75) {
          strokeColor = '#10B981'; // vibrant green
          strokeWidth = 3.0;
          labelText = `Sim: ${scorePercentage}%`;
        } else {
          strokeColor = '#94A3B8'; // thin gray
          strokeWidth = 1.5;
          labelText = `Sim: ${scorePercentage}%`;
        }
      } else if (e.relationType === 'contradiction') {
        strokeColor = '#EF4444'; // red
        strokeWidth = 2.5;
        isDashed = true;
        labelText = `Conflict: ${scorePercentage}%`;
      } else {
        isDotted = true;
        labelText = 'Weak';
      }

      return {
        id: `${e.sourcePaperId || e.source}-${e.targetPaperId || e.target}`,
        source: e.sourcePaperId || e.source,
        target: e.targetPaperId || e.target,
        animated: e.relationType === 'contradiction',
        label: labelText,
        labelStyle: { fill: strokeColor, fontSize: 8, fontWeight: 700 },
        style: {
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: isDashed ? '6,6' : isDotted ? '1,4' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 10,
          height: 10,
        },
      };
    });

    setNodes(rfNodes);
    setEdges(rfEdges);
  };

  // Re-run layout on threshold/filter changes
  useEffect(() => {
    if (rawGraph.nodes.length > 0) {
      layoutAndSet(rawGraph.nodes, rawGraph.edges);
    }
  }, [threshold, showContradictions, strongOnly, showClusterView, rawGraph]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Re-fetch graph when background job completes
  useEffect(() => {
    if (aiStatus?.jobStatus === 'completed') {
      fetchGraph();
    }
  }, [aiStatus?.jobStatus, fetchGraph]);

  return (
    <div className="space-y-4 pt-3 select-text">
      {/* Controls */}
      <div className="grid sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-150 dark:border-slate-850 rounded-2xl">
        {/* Similarity Threshold slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Similarity Threshold</span>
            <span className="text-brand-500">{threshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 mt-2"
          />
        </div>

        {/* Show Strong Connections toggle */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Connection Filter</label>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setStrongOnly(!strongOnly)}
              className={`h-5.5 w-10 rounded-full transition-colors relative focus:outline-none border border-transparent ${
                strongOnly ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${strongOnly ? 'translate-x-4.5' : ''}`} />
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Strong Only</span>
          </div>
        </div>

        {/* Show Contradictions toggle */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contradictions Only</label>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowContradictions(!showContradictions)}
              className={`h-5.5 w-10 rounded-full transition-colors relative focus:outline-none border border-transparent ${
                showContradictions ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-800'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showContradictions ? 'translate-x-4.5' : ''}`} />
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Show Conflicts Only</span>
          </div>
        </div>

        {/* Show Cluster View toggle */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visualization Layout</label>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowClusterView(!showClusterView)}
              className={`h-5.5 w-10 rounded-full transition-colors relative focus:outline-none border border-transparent ${
                showClusterView ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-800'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showClusterView ? 'translate-x-4.5' : ''}`} />
            </button>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Cluster View</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="h-[480px] border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 rounded-2xl overflow-hidden relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
            <p className="text-xs text-slate-500">Calculating relationships...</p>
          </div>
        ) : isOffline ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4.5 space-y-3">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">AI Relationship Service Offline</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 max-w-xs leading-relaxed">
              We couldn't connect to the local ML service (localhost:8000). To visualize workspace connections, start uvicorn:
            </p>
            <code className="text-2xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-2 rounded font-mono text-left">
              python app/main.py --port 8000
            </code>
            <Button size="sm" onClick={fetchGraph} className="h-8 text-2xs font-bold bg-brand-500 text-white">
              Retry Connection
            </Button>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Network className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-xs text-slate-500">No relationships exceed the {threshold.toFixed(2)} threshold.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="h-full"
          >
            <Background gap={14} size={1} />
            <Controls className="!bg-white dark:!bg-slate-900 !border-slate-250 dark:!border-slate-800 shadow-sm rounded-lg overflow-hidden !m-2" />
            <MiniMap style={{ borderRadius: '12px' }} />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
