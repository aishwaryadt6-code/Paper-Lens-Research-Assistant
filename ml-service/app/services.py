import numpy as np
import re
import warnings
from typing import List, Tuple, Dict, Any, Optional
from pydantic import BaseModel
from app.config import settings


# Attempt to import machine learning libraries
try:
    from sentence_transformers import SentenceTransformer, CrossEncoder
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    warnings.warn("sentence-transformers not installed. Falling back to TF-IDF & Heuristic similarity.")

class MLService:
    def __init__(self):
        self._embedding_model = None
        self._nli_model = None
        self._ml_enabled = ML_AVAILABLE

    @property
    def embedding_model(self):
        if not self._ml_enabled:
            return None
        if self._embedding_model is None:
            try:
                # Load embedding model on demand to speed up FastAPI startup
                self._embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, device=settings.DEVICE)
            except Exception as e:
                print(f"Error loading embedding model {settings.EMBEDDING_MODEL_NAME}: {e}. Disabling ML models.")
                self._ml_enabled = False
        return self._embedding_model

    @property
    def nli_model(self):
        if not self._ml_enabled:
            return None
        if self._nli_model is None:
            try:
                # Load NLI model on demand
                self._nli_model = CrossEncoder(settings.NLI_MODEL_NAME, device=settings.DEVICE)
            except Exception as e:
                print(f"Error loading NLI model {settings.NLI_MODEL_NAME}: {e}. NLI calculations will use fallbacks.")
                # We do not disable ML completely since embeddings might still work
        return self._nli_model

    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for a given text.
        Falls back to a deterministic 384-dimensional hashed representation if ML is disabled.
        """
        model = self.embedding_model
        if model is not None:
            try:
                vector = model.encode(text, convert_to_numpy=True)
                return vector.tolist()
            except Exception as e:
                print(f"Failed to generate embedding: {e}. Falling back.")
        
        # Fallback embedding generation: 384-dim pseudo-vector using hash of words
        return self._generate_fallback_embedding(text)

    def calculate_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        """
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm_v1 * norm_v2))

    def detect_contradiction(self, text1: str, text2: str) -> Tuple[float, float, str]:
        """
        Determine if there is a contradiction between text1 and text2.
        Returns: (contradiction_score, confidence_score, label)
        """
        model = self.nli_model
        if model is not None:
            try:
                # Run cross-encoder model
                # Returns scores for each class
                scores = model.predict([text1, text2])
                
                # Softmax conversion
                exp_scores = np.exp(scores - np.max(scores))
                probs = exp_scores / np.sum(exp_scores)
                
                # Identify label indexes dynamically if available
                # Default mapping for cross-encoder/nli-deberta-v3-small:
                # 0: contradiction, 1: entailment, 2: neutral
                label_mapping = {0: "contradiction", 1: "entailment", 2: "neutral"}
                
                if hasattr(model.model, "config") and hasattr(model.model.config, "id2label"):
                    id2label = model.model.config.id2label
                    label_mapping = {i: label.lower() for i, label in id2label.items()}
                
                # Find contradiction class
                contra_idx = -1
                for idx, label in label_mapping.items():
                    if "contradict" in label:
                        contra_idx = idx
                        break
                
                if contra_idx != -1:
                    contra_prob = float(probs[contra_idx])
                    max_prob = float(np.max(probs))
                    pred_label = label_mapping[int(np.argmax(probs))]
                    
                    # If contradiction is the predicted class, confidence is high.
                    # Otherwise, the contradiction score is just its probability.
                    confidence = max_prob
                    return contra_prob, confidence, pred_label
            except Exception as e:
                print(f"NLI model inference failed: {e}. Using heuristic NLI fallback.")

        # Heuristic NLI fallback
        return self._detect_contradiction_heuristic(text1, text2)

    def generate_clusters(self, embeddings: List[List[float]], papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate clusters for paper embeddings using sklearn's KMeans.
        Reduces dimensionality with PCA if features are > 50 dimensions.
        Assigns smart cluster labels, top keywords, and cluster confidence score.
        """
        num_papers = len(papers)
        if num_papers == 0:
            return []

        # Fallback values
        fallback_clusters = [{
            "cluster_id": 0,
            "cluster_label": "Technical Research Cluster",
            "top_keywords": [],
            "confidence": 1.0
        } for _ in range(num_papers)]

        try:
            from sklearn.cluster import KMeans
            from sklearn.decomposition import PCA
            import string

            X = np.array(embeddings)
            
            # If embeddings are high dimensional, reduce dimension before clustering
            if X.shape[1] > 50:
                n_components = min(30, X.shape[0], X.shape[1])
                if n_components >= 2:
                    pca = PCA(n_components=n_components, random_state=42)
                    X_reduced = pca.fit_transform(X)
                else:
                    X_reduced = X
            else:
                X_reduced = X

            # Run KMeans
            k = min(5, X_reduced.shape[0])
            if k < 1:
                k = 1

            kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
            cluster_labels_ids = kmeans.fit_predict(X_reduced).tolist()

            # Group papers by cluster_id
            cluster_to_papers = {}
            for paper, cid in zip(papers, cluster_labels_ids):
                if cid not in cluster_to_papers:
                    cluster_to_papers[cid] = []
                cluster_to_papers[cid].append(paper)

            # Define noise words and stopwords
            NOISE_WORDS = [
                "cost", "seller", "revenue", "national", "plan",
                "system", "data", "analysis", "approach", "method",
                "based", "using", "study", "paper"
            ]
            STOPWORDS = {
                "the", "and", "for", "in", "of", "a", "an", "on", "to", "is", "are", 
                "with", "that", "this", "from", "their", "about", "other", "model",
                "we", "our", "us", "it", "its", "by", "as", "at", "be", "was", "were",
                "or", "which", "but", "not", "have", "has", "can", "could"
            }
            NOISE_SET = set(NOISE_WORDS).union(STOPWORDS)

            # ML / Tech domain terms to boost
            ML_TERMS_BOOST = {
                "neural": 5.0,
                "transformer": 5.0,
                "classification": 4.0,
                "clustering": 4.0,
                "embedding": 5.0,
                "deep": 4.0,
                "learning": 3.0,
                "nlp": 5.0,
                "vision": 5.0,
                "transformer-based": 5.0,
                "attention": 4.0,
                "optimization": 4.0,
                "reinforcement": 5.0,
                "regression": 3.0,
                "detection": 3.0,
                "segmentation": 4.0,
                "prediction": 2.0,
                "generative": 4.0,
                "gan": 5.0,
                "llm": 5.0,
                "gpt": 5.0,
                "networks": 2.0,
                "artificial": 2.0,
                "intelligence": 2.0,
            }

            cluster_labels = {}
            cluster_top_kws = {}
            cluster_confidences = {}

            for cid, cluster_papers in cluster_to_papers.items():
                # 1. Scored keyword extraction
                vocab = {}
                for p in cluster_papers:
                    text = f"{p.get('title', '')} {p.get('abstract', '')} {p.get('keywords', '')}"
                    text_cleaned = text.translate(str.maketrans('', '', string.punctuation)).lower()
                    words = [w.strip() for w in text_cleaned.split() if w.strip()]
                    
                    filtered_words = [w for w in words if w not in NOISE_SET and len(w) > 2]
                    
                    # Unigram counts
                    for w in filtered_words:
                        vocab[w] = vocab.get(w, 0.0) + 1.0
                        
                    # Bigram counts
                    for i in range(len(filtered_words) - 1):
                        bigram = f"{filtered_words[i]} {filtered_words[i+1]}"
                        vocab[bigram] = vocab.get(bigram, 0.0) + 1.5

                # Apply semantic weight boosts
                for phrase in list(vocab.keys()):
                    boost = 0.0
                    for term, weight in ML_TERMS_BOOST.items():
                        if term in phrase:
                            boost += weight
                    vocab[phrase] += boost

                # Get sorted keywords
                sorted_vocab = sorted(vocab.items(), key=lambda x: x[1], reverse=True)
                top_kws = [item[0] for item in sorted_vocab[:3]]
                cluster_top_kws[cid] = top_kws

                # 2. Final Cluster Label Generation Mapping
                joined = " ".join(top_kws).lower()
                if any(x in joined for x in ["nlp", "language", "translation", "transformer", "attention", "text"]):
                    label = "Natural Language Processing Cluster"
                elif any(x in joined for x in ["vision", "image", "detection", "cnn", "segmentation", "pixels"]):
                    label = "Computer Vision Cluster"
                elif any(x in joined for x in ["deep", "neural", "gan", "llm", "gpt"]):
                    label = "Deep Learning Cluster"
                elif any(x in joined for x in ["optimization", "pricing", "cost", "seller", "revenue", "linear"]):
                    label = "Optimization Systems Cluster"
                elif any(x in joined for x in ["reinforcement", "policy", "agent"]):
                    label = "Reinforcement Learning Cluster"
                elif len(top_kws) >= 2:
                    label = f"{top_kws[0].title()} & {top_kws[1].title()} Cluster"
                elif len(top_kws) == 1:
                    label = f"{top_kws[0].title()} Cluster"
                else:
                    label = "Technical Research Cluster"

                # Apply final cleaning rules (max 4 words, capitalize)
                label_words = label.split()
                if len(label_words) > 4:
                    label = " ".join(label_words[:4])
                cluster_labels[cid] = label

                # 3. Calculate Cluster Confidence (cohesion based)
                cluster_paper_indices = [papers.index(p) for p in cluster_papers]
                cluster_embeddings = np.array([embeddings[idx] for idx in cluster_paper_indices])
                mean_vector = np.mean(cluster_embeddings, axis=0)
                mean_norm = np.linalg.norm(mean_vector)
                
                if mean_norm > 0:
                    sims = []
                    for emb in cluster_embeddings:
                        emb_norm = np.linalg.norm(emb)
                        if emb_norm > 0:
                            sims.append(np.dot(emb, mean_vector) / (emb_norm * mean_norm))
                    confidence = float(np.mean(sims)) if sims else 1.0
                else:
                    confidence = 1.0
                cluster_confidences[cid] = max(0.5, min(1.0, confidence))

            # Build result list for each paper
            result = []
            for paper, cid in zip(papers, cluster_labels_ids):
                result.append({
                    "cluster_id": cid,
                    "cluster_label": cluster_labels[cid],
                    "top_keywords": cluster_top_kws[cid],
                    "confidence": cluster_confidences[cid]
                })
            return result

        except Exception as e:
            print(f"Clustering failed: {e}. Using fallback labeling.")
            return fallback_clusters

    def _generate_similarity_reason(self, p1: Dict[str, Any], p2: Dict[str, Any], sim: float) -> Tuple[str, float]:
        try:
            w1 = set([k.strip().lower() for k in re.split(r'[,;]+', p1.get("keywords", "")) if k.strip()])
            w2 = set([k.strip().lower() for k in re.split(r'[,;]+', p2.get("keywords", "")) if k.strip()])
            shared = [kw for kw in w1.intersection(w2) if kw]
            
            if not shared:
                t1_words = set(re.findall(r'\b[a-z]{4,}\b', p1.get("title", "").lower()))
                t2_words = set(re.findall(r'\b[a-z]{4,}\b', p2.get("title", "").lower()))
                stop = {"paper", "study", "analysis", "using", "based", "system", "model"}
                shared = list((t1_words.intersection(t2_words)) - stop)
                
            if shared:
                topic = shared[0].title()
                kws = ", ".join([k.title() for k in shared[:3]])
                reason = f"Both papers focus on {topic} and share concepts like {kws}."
            else:
                reason = "Both papers focus on related methodologies with semantic overlap."
                
            confidence = float(0.5 + 0.5 * sim)
            return reason, confidence
        except Exception:
            return "Semantic similarity based on embeddings", 0.0

    def _generate_contradiction_reason(self, p1: Dict[str, Any], p2: Dict[str, Any], contra_score: float) -> Tuple[str, float]:
        try:
            t1 = f"{p1.get('abstract', '')} {p1.get('conclusion', '')}".lower()
            t2 = f"{p2.get('abstract', '')} {p2.get('conclusion', '')}".lower()
            
            conflicts = []
            if "increase" in t1 and "decrease" in t2:
                conflicts.append("reported direction of effect (increase vs decrease)")
            elif "decrease" in t1 and "increase" in t2:
                conflicts.append("reported direction of effect (decrease vs increase)")
            if "positive" in t1 and "negative" in t2:
                conflicts.append("correlation direction (positive vs negative)")
            elif "negative" in t1 and "positive" in t2:
                conflicts.append("correlation direction (negative vs positive)")
                
            if conflicts:
                reason = f"These papers differ because they report conflicting outcomes regarding {', and '.join(conflicts)}."
            else:
                reason = "These papers conflict because they present methodological disagreements or opposing conclusions."
                
            confidence = float(contra_score)
            return reason, confidence
        except Exception:
            return "Detected opposing semantic patterns", 0.0

    def _generate_edge_explanation(self, relation_type: str, sim_score: float, contra_score: float, sim_reason: str, contra_reason: str) -> str:
        try:
            if relation_type == "contradiction":
                return f"Conflict detected (Index: {contra_score:.2f}): {contra_reason}"
            elif relation_type == "similarity":
                return f"Strong relationship (Similarity: {sim_score:.2f}): {sim_reason}"
            else:
                return "Relation inferred from vector similarity: limited or indirect overlap."
        except Exception:
            return "Relation inferred from vector similarity"

    def _generate_cluster_reason(self, label: str, top_kws: List[str], confidence: float) -> str:
        try:
            topic = label.replace("Cluster", "").strip()
            kws = ", ".join([k.title() for k in top_kws]) if top_kws else "shared technical terms"
            return f"This cluster contains papers related to {topic} because they share {kws}."
        except Exception:
            return "Grouped based on embedding similarity"

    def get_similarity_explanation(self, text1: str, text2: str, sim: float) -> Tuple[str, float]:
        return self._generate_similarity_reason({"abstract": text1}, {"abstract": text2}, sim)

    def get_contradiction_explanation(self, text1: str, text2: str, contra_score: float) -> Tuple[str, float]:
        return self._generate_contradiction_reason({"abstract": text1}, {"abstract": text2}, contra_score)

    def generate_graph(self, papers: List[Dict[str, Any]], similarity_threshold: float = 0.50) -> Dict[str, Any]:
        """
        Process a list of papers in batch to compute nodes and edges.
        Reuses existing embeddings if provided.
        """
        num_papers = len(papers)
        
        # 1. Generate or retrieve embeddings for all papers
        embeddings = []
        for paper in papers:
            emb = paper.get("embedding")
            if emb is None:
                # Combine title, abstract, keywords, conclusion for semantic context
                text = f"Title: {paper.get('title', '')}\nAbstract: {paper.get('abstract', '')}\nKeywords: {paper.get('keywords', '')}\nConclusion: {paper.get('conclusion', '')}"
                emb = self.get_embedding(text)
            embeddings.append(emb)

        # 1b. Run semantic clustering and assign IDs/labels
        clusters = self.generate_clusters(embeddings, papers)
        for idx, c_info in enumerate(clusters):
            papers[idx]["cluster_id"] = c_info["cluster_id"]
            papers[idx]["cluster_label"] = c_info["cluster_label"]
            papers[idx]["top_keywords"] = c_info["top_keywords"]
            papers[idx]["confidence"] = c_info["confidence"]
            papers[idx]["cluster_reason"] = self._generate_cluster_reason(
                c_info["cluster_label"], c_info["top_keywords"], c_info["confidence"]
            )

        # 2. Compute pairwise relationships
        edges = []
        for i in range(num_papers):
            for j in range(i + 1, num_papers):
                p1, p2 = papers[i], papers[j]
                emb1, emb2 = embeddings[i], embeddings[j]
                
                # Calculate similarity
                sim = self.calculate_similarity(emb1, emb2)
                
                if sim >= similarity_threshold:
                    # Run contradiction detection
                    text_p1 = f"{p1.get('abstract', '')} {p1.get('conclusion', '')}"
                    text_p2 = f"{p2.get('abstract', '')} {p2.get('conclusion', '')}"
                    
                    contra_score, confidence, label = self.detect_contradiction(text_p1, text_p2)
                    
                    # Decide relationType
                    if contra_score >= settings.CONTRADICTION_THRESHOLD:
                        rel_type = "contradiction"
                    elif sim >= settings.SIMILARITY_THRESHOLD_STRONG:
                        rel_type = "similarity"
                    else:
                        rel_type = "weak"

                    # Generate similarity and contradiction explanations
                    sim_reason, sim_conf = self._generate_similarity_reason(p1, p2, sim)
                    contra_reason, contra_conf = self._generate_contradiction_reason(p1, p2, contra_score)
                    edge_expl = self._generate_edge_explanation(rel_type, sim, contra_score, sim_reason, contra_reason)

                    # Generate reasoning summary
                    reason = self._generate_reasoning_summary(p1, p2, sim, contra_score, rel_type)
                    
                    edges.append({
                        "sourcePaperId": p1["id"],
                        "targetPaperId": p2["id"],
                        "relationType": rel_type,
                        "similarityScore": sim,
                        "contradictionScore": contra_score,
                        "confidenceScore": confidence,
                        "reasoningSummary": reason,
                        "similarity_reason": sim_reason,
                        "contradiction_reason": contra_reason,
                        "edge_explanation": edge_expl,
                        "confidence": float(0.5 * sim_conf + 0.5 * contra_conf)
                    })

        # Format nodes
        nodes = []
        for p in papers:
            nodes.append({
                "id": p["id"],
                "title": p.get("title", "Untitled"),
                "authors": p.get("authors", ""),
                "abstract": p.get("abstract", ""),
                "cluster_id": p.get("cluster_id", 0),
                "cluster_label": p.get("cluster_label", "Technical Research Cluster"),
                "top_keywords": p.get("top_keywords", []),
                "confidence": p.get("confidence", 1.0),
                "cluster_reason": p.get("cluster_reason", "Grouped based on embedding similarity")
            })

        return {"nodes": nodes, "edges": edges}

    def _generate_fallback_embedding(self, text: str) -> List[float]:
        """
        Creates a deterministic 384-dimensional vector from input text using hashing
        to act as a fallback when sentence-transformers is offline/unavailable.
        """
        words = re.findall(r'\w+', text.lower())
        vector = np.zeros(384)
        
        if not words:
            return vector.tolist()
            
        for i, word in enumerate(words):
            # Compute a hash of the word to determine vector indices
            h = hash(word)
            idx1 = abs(h) % 384
            idx2 = abs(h * 31) % 384
            
            # Populate vector elements
            vector[idx1] += 1.0 / (i + 1.0)**0.5
            vector[idx2] -= 0.5 / (i + 1.0)**0.5
            
        # Normalize the vector
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
            
        return vector.tolist()

    def _detect_contradiction_heuristic(self, text1: str, text2: str) -> Tuple[float, float, str]:
        """
        Pure-Python fallback to check for semantic contradictions.
        Looks for negation keywords, opposite terms, or conflicting markers.
        """
        t1, t2 = text1.lower(), text2.lower()
        
        # List of terms that indicate contrast or opposition
        contrast_words = ["however", "but", "contradict", "conflict", "refute", "differ", "disagree", "contrast", "on the other hand"]
        
        # Find overlap of meaningful words (simple Jaccard)
        w1 = set(re.findall(r'\b[a-z]{4,}\b', t1))
        w2 = set(re.findall(r'\b[a-z]{4,}\b', t2))
        
        # Stopwords to filter out
        stopwords = {"with", "that", "this", "from", "their", "about", "other", "study", "paper", "results", "analysis", "using"}
        w1 = w1 - stopwords
        w2 = w2 - stopwords
        
        overlap = w1.intersection(w2)
        
        # If there is very little overlap, they likely talk about different topics, so no contradiction
        if not overlap:
            return 0.0, 0.9, "neutral"
            
        # Check if either paper contains contrasting words
        has_contrast = any(cw in t1 or cw in t2 for cw in contrast_words)
        
        # Check for direct numerical or quantitative conflicts if possible
        # e.g., "increases" vs "decreases", "positive" vs "negative"
        conflicting_pairs = [
            ("increase", "decrease"),
            ("positive", "negative"),
            ("higher", "lower"),
            ("improve", "worsen"),
            ("significant", "insignificant"),
            ("supported", "rejected")
        ]
        
        direct_conflict = False
        for p_a, p_b in conflicting_pairs:
            if (p_a in t1 and p_b in t2) or (p_b in t1 and p_a in t2):
                # Ensure they occur near overlapping terms
                direct_conflict = True
                break
                
        if direct_conflict:
            return 0.75, 0.70, "contradiction"
        elif has_contrast and len(overlap) >= 3:
            return 0.55, 0.60, "contradiction"
        else:
            return 0.15, 0.85, "neutral"

    def _generate_reasoning_summary(self, p1: Dict[str, Any], p2: Dict[str, Any], sim: float, contra: float, rel_type: str) -> str:
        """
        Constructs a readable academic summary explaining the detected relationship.
        """
        # Exclude generic terms, extract overlapping key phrases
        w1 = set(p1.get("keywords", "").lower().split(","))
        w2 = set(p2.get("keywords", "").lower().split(","))
        shared_kw = [kw.strip() for kw in w1.intersection(w2) if kw.strip()]
        
        if rel_type == "contradiction":
            summary = "Potential contradiction detected. "
            if shared_kw:
                summary += f"While both papers study '{shared_kw[0]}', they report conflicting results or opposing conclusions. "
            else:
                summary += "The papers present methodological disagreements or conflicting outcomes on similar subject matter. "
            summary += f"(Contradiction Index: {contra:.2f})"
        elif rel_type == "similarity":
            summary = "Strong semantic relationship. "
            if shared_kw:
                summary += f"Both publications share core concepts related to '{', '.join(shared_kw[:3])}'. "
            summary += "They have highly aligned methodologies and overlapping research objectives."
        else:
            summary = "Weak semantic relationship. "
            if shared_kw:
                summary += f"They share minor thematic keywords like '{shared_kw[0]}'."
            else:
                summary += "There is a small degree of topic overlap in their introductions or methodologies."
                
        return summary

ml_service = MLService()