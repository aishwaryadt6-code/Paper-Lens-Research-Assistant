import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Paper } from '../models/Paper';
import { PaperRelationship } from '../modules/ai-knowledge-graph/relationship.model';
import { PaperAIResult } from '../models/PaperAIResult';
import { autoAIPipelineService } from '../services/AutoAIPipelineService';

const OWNER = { name: 'Graph Owner', email: 'graphowner@paperlens.dev', password: 'SecurePass123' };
const GUEST = { name: 'Graph Guest', email: 'graphguest@paperlens.dev', password: 'SecurePass123' };

let ownerToken: string;
let guestToken: string;
let workspaceId: string;
let paper1Id: string;
let paper2Id: string;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/paperlens_test';
  await mongoose.connect(uri);

  // Register users
  await request(app).post('/api/auth/register').send(OWNER);
  await request(app).post('/api/auth/register').send(GUEST);

  // Login owner
  const ownerLogin = await request(app).post('/api/auth/login').send({
    email: OWNER.email,
    password: OWNER.password,
  });
  ownerToken = ownerLogin.body.data.accessToken;

  // Login guest
  const guestLogin = await request(app).post('/api/auth/login').send({
    email: GUEST.email,
    password: GUEST.password,
  });
  guestToken = guestLogin.body.data.accessToken;

  // Create workspace for owner
  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Test Graph Workspace', description: 'Testing knowledge graph integration' });
  workspaceId = wsRes.body.data.workspace._id;

  // Mock owner user ObjectId
  const ownerUser = await User.findOne({ email: OWNER.email });
  const ownerOid = ownerUser!._id;

  // Manually create two mock papers inside the workspace in MongoDB to simulate parsed papers
  const paper1 = await Paper.create({
    title: 'Paper on Deep Neural Networks',
    originalFileName: 'deep_learning.pdf',
    fileId: new mongoose.Types.ObjectId(),
    fileSize: 1024,
    checksum: 'checksum1',
    workspace: new mongoose.Types.ObjectId(workspaceId),
    uploadedBy: ownerOid,
    status: 'ready',
    extractedMetadata: {
      abstract: 'This paper studies neural networks and deep architecture optimizer controls.',
      keywords: 'deep learning, neural networks, optimizer',
      conclusion: 'We conclude that deeper networks lead to better generalization outcomes.',
    },
  });
  paper1Id = paper1._id.toString();

  const paper2 = await Paper.create({
    title: 'Methodology of Optimization in CNNs',
    originalFileName: 'cnn_optimization.pdf',
    fileId: new mongoose.Types.ObjectId(),
    fileSize: 2048,
    checksum: 'checksum2',
    workspace: new mongoose.Types.ObjectId(workspaceId),
    uploadedBy: ownerOid,
    status: 'ready',
    extractedMetadata: {
      abstract: 'We discuss convolutional neural networks and optimization techniques using deep networks.',
      keywords: 'cnn, optimization, deep learning',
      conclusion: 'Deeper convolutional networks underperform if learning rates are too high.',
    },
  });
  paper2Id = paper2._id.toString();

  // Create a mock relationship in MongoDB
  await PaperRelationship.create({
    sourcePaperId: paper1._id,
    targetPaperId: paper2._id,
    relationType: 'similarity',
    similarityScore: 0.82,
    contradictionScore: 0.25,
    confidenceScore: 0.90,
    reasoningSummary: 'Both papers study neural network optimization parameters.',
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
  });
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: [OWNER.email, GUEST.email] } });
  await Workspace.deleteMany({ _id: workspaceId });
  await Paper.deleteMany({ workspace: workspaceId });
  await PaperRelationship.deleteMany({ workspaceId });
  await PaperAIResult.deleteMany({ workspaceId });
  await mongoose.disconnect();
});

describe('GET /api/ai-knowledge-graph/workspace/:id/graph', () => {
  it('returns graph data with nodes and edges for authorized workspace members', async () => {
    const res = await request(app)
      .get(`/api/ai-knowledge-graph/workspace/${workspaceId}/graph`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('nodes');
    expect(res.body.data).toHaveProperty('edges');
    expect(Array.isArray(res.body.data.nodes)).toBe(true);
    expect(Array.isArray(res.body.data.edges)).toBe(true);
    
    // Node check
    expect(res.body.data.nodes.length).toBeGreaterThan(0);
    // Edge check
    expect(res.body.data.edges.length).toBe(1);
    expect(res.body.data.edges[0].source).toBe(paper1Id);
    expect(res.body.data.edges[0].target).toBe(paper2Id);
    expect(res.body.data.edges[0].relationType).toBe('similarity');
  });

  it('rejects guest user with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/ai-knowledge-graph/workspace/${workspaceId}/graph`)
      .set('Authorization', `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });

  it('rejects request without authentication token with 401', async () => {
    const res = await request(app).get(`/api/ai-knowledge-graph/workspace/${workspaceId}/graph`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/ai-knowledge-graph/paper/:id/relations', () => {
  it('returns list of related papers for a given paper', async () => {
    const res = await request(app)
      .get(`/api/ai-knowledge-graph/paper/${paper1Id}/relations`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.relations)).toBe(true);
    expect(res.body.data.relations.length).toBe(1);
    expect(res.body.data.relations[0].paperId).toBe(paper2Id);
    expect(res.body.data.relations[0].relationType).toBe('similarity');
  });

  it('rejects guest user from querying paper relations', async () => {
    const res = await request(app)
      .get(`/api/ai-knowledge-graph/paper/${paper1Id}/relations`)
      .set('Authorization', `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/ai-knowledge-graph/workspace/:id/recompute-graph', () => {
  it('triggers asynchronous graph recomputation', async () => {
    const res = await request(app)
      .post(`/api/ai-knowledge-graph/workspace/${workspaceId}/recompute-graph`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('triggered successfully');
  });

  it('rejects guest user with 403', async () => {
    const res = await request(app)
      .post(`/api/ai-knowledge-graph/workspace/${workspaceId}/recompute-graph`)
      .set('Authorization', `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/ai-knowledge-graph/paper/:id/ai-status', () => {
  it('returns AI status and initializes pending entry if not exists', async () => {
    const res = await request(app)
      .get(`/api/ai-knowledge-graph/paper/${paper1Id}/ai-status`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('jobStatus');
    expect(res.body.data.paperId).toBe(paper1Id);
    expect(res.body.data.jobStatus).toBe('pending');
  });

  it('rejects guest user with 403', async () => {
    const res = await request(app)
      .get(`/api/ai-knowledge-graph/paper/${paper1Id}/ai-status`)
      .set('Authorization', `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });
});

describe('AutoAIPipelineService Background Processing', () => {
  it('initializes pending job correctly', async () => {
    await autoAIPipelineService.initializeJob(paper2Id, workspaceId);
    const job = await PaperAIResult.findOne({ paperId: paper2Id });
    expect(job).not.toBeNull();
    expect(job!.jobStatus).toBe('pending');
  });

  it('runs pipeline and handles fallbacks gracefully when ML service is offline', async () => {
    await autoAIPipelineService.runPipelineForPaper(paper1Id, workspaceId);
    const job = await PaperAIResult.findOne({ paperId: paper1Id });
    expect(job).not.toBeNull();
    expect(job!.jobStatus).toBe('failed'); // fails safely since uvicorn is offline during tests
  });
});
