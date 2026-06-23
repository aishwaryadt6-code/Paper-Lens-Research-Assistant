import os

class Settings:
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Models
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    NLI_MODEL_NAME: str = os.getenv("NLI_MODEL_NAME", "cross-encoder/nli-deberta-v3-small")
    
    # Cache / Thresholds
    SIMILARITY_THRESHOLD_STRONG: float = 0.75
    SIMILARITY_THRESHOLD_WEAK: float = 0.50
    CONTRADICTION_THRESHOLD: float = 0.60
    
    # Force cpu execution for local environment safety
    DEVICE: str = os.getenv("DEVICE", "cpu")

settings = Settings()
