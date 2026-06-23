from pydantic import BaseModel, Field
from typing import List, Optional

class EmbeddingRequest(BaseModel):
    text: str = Field(..., description="Text to encode into embedding")

class EmbeddingResponse(BaseModel):
    embedding: List[float] = Field(..., description="Vector embedding representation")

class SimilarityRequest(BaseModel):
    text1: str = Field(..., description="First text to compare")
    text2: str = Field(..., description="Second text to compare")

class SimilarityResponse(BaseModel):
    similarity: float
    similarity_reason: Optional[str] = None
    confidence: Optional[float] = None

class ContradictionRequest(BaseModel):
    text1: str = Field(..., description="First claim or abstract text")
    text2: str = Field(..., description="Second claim or abstract text")

class ContradictionResponse(BaseModel):
    contradiction_score: float
    confidence_score: float
    label: str
    contradiction_reason: Optional[str] = None

class PaperInput(BaseModel):
    id: str
    title: str
    abstract: str
    keywords: str
    authors: Optional[str] = ""
    conclusion: Optional[str] = ""
    embedding: Optional[List[float]] = None

class GraphRequest(BaseModel):
    papers: List[PaperInput]
    similarity_threshold: Optional[float] = 0.50

class GraphEdge(BaseModel):
    sourcePaperId: str
    targetPaperId: str
    relationType: str
    similarityScore: float
    contradictionScore: float
    confidenceScore: float
    reasoningSummary: str
    similarity_reason: Optional[str] = None
    contradiction_reason: Optional[str] = None
    edge_explanation: Optional[str] = None
    confidence: Optional[float] = None

class GraphNode(BaseModel):
    id: str
    title: str
    authors: Optional[str] = ""
    abstract: Optional[str] = ""
    cluster_id: Optional[int] = 0
    cluster_label: Optional[str] = "Technical Research Cluster"
    top_keywords: Optional[List[str]] = []
    confidence: Optional[float] = 1.0
    cluster_reason: Optional[str] = None

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

