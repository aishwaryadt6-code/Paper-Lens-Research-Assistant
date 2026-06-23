from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.models import (
    EmbeddingRequest, EmbeddingResponse,
    SimilarityRequest, SimilarityResponse,
    ContradictionRequest, ContradictionResponse,
    GraphRequest, GraphResponse, GraphNode, GraphEdge
)
from app.services import ml_service
from app.config import settings

app = FastAPI(
    title="Paper Lens ML Microservice",
    description="Microservice for research paper embeddings, similarities, and contradictions.",
    version="1.0.0"
)

# Enable CORS for convenience
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "ml_available": ml_service._ml_enabled,
        "embedding_loaded": ml_service._embedding_model is not None,
        "nli_loaded": ml_service._nli_model is not None
    }

@app.post("/embeddings", response_model=EmbeddingResponse)
def get_embeddings(request: EmbeddingRequest):
    try:
        vector = ml_service.get_embedding(request.text)
        return EmbeddingResponse(embedding=vector)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similarity", response_model=SimilarityResponse)
def get_similarity(request: SimilarityRequest):
    try:
        vec1 = ml_service.get_embedding(request.text1)
        vec2 = ml_service.get_embedding(request.text2)
        score = ml_service.calculate_similarity(vec1, vec2)
        reason, confidence = ml_service.get_similarity_explanation(request.text1, request.text2, score)
        return SimilarityResponse(
            similarity=score,
            similarity_reason=reason,
            confidence=confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/contradiction", response_model=ContradictionResponse)
def detect_contradiction(request: ContradictionRequest):
    try:
        score, confidence, label = ml_service.detect_contradiction(request.text1, request.text2)
        reason, _ = ml_service.get_contradiction_explanation(request.text1, request.text2, score)
        return ContradictionResponse(
            contradiction_score=score,
            confidence_score=confidence,
            label=label,
            contradiction_reason=reason
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/graph", response_model=GraphResponse)
def generate_graph(request: GraphRequest):
    try:
        # Convert Pydantic models to dict for services
        papers_dict = [paper.model_dump() for paper in request.papers]
        graph_data = ml_service.generate_graph(papers_dict, request.similarity_threshold)
        
        # Structure response
        nodes = [GraphNode(**n) for n in graph_data["nodes"]]
        edges = [GraphEdge(**e) for e in graph_data["edges"]]
        
        return GraphResponse(nodes=nodes, edges=edges)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)