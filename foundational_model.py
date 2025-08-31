#!/usr/bin/env python3
# Foundational Matching Model for Fast, Fair Hiring
# -------------------------------------------------
# RUN:
#   pip install pandas numpy scikit-learn sentence-transformers --quiet
#   python foundational_model.py --applicants applicants.csv --jobs jobs.csv --out top_matches.csv
#
# What it does (today, on one laptop):
# - Loads applicants.csv and jobs.csv
# - Builds text embeddings with sentence-transformers MiniLM (fallback to TF‑IDF if transformers unavailable)
# - Computes interpretable sub-scores:
#     SemScore  : semantic cosine similarity between applicant and job
#     ReqScore  : fraction of required skills satisfied
#     PayScore  : job mid pay vs applicant floor
#     FastReply : employer fast-response prior (≤1h) or derived from median reply hours
#     LoadPen   : soft penalty if a job is currently overloaded with applicants
#     Interview : lightweight proxy using SemScore & ReqScore (can be replaced by a trained logistic model later)
# - Combines into a final Score with transparent weights
# - Outputs one top match per applicant with a plain-English explanation
#
# Columns required:
#   applicants.csv:
#     id,name,email,city,target_pay_min,skills_text,skills_tags,certs,resume_text
#     (skills_tags, certs can be semicolon-separated; resume_text optional)
#
#   jobs.csv:
#     id,employer_name,title,city,pay_min,pay_max,must_have_skills,nice_to_have,description,
#     response_fast_prob,response_median_reply_hours,active_apps_last_24h,capacity_per_day
#     (skills lists are semicolon-separated; response_* may be blank; capacity used later)
#
# Notes:
# - Keep everything simple & transparent for now. You can swap in trained models later.
# - This file is intentionally compact and dependency-light.


import argparse
import math
import sys
from typing import List, Tuple

import numpy as np
import pandas as pd

# Try sentence-transformers; if missing, we'll fallback to TF-IDF
_USE_ST = True
try:
    from sentence_transformers import SentenceTransformer
except Exception:
    _USE_ST = False
    from sklearn.feature_extraction.text import TfidfVectorizer

# K-means clustering
try:
    from sklearn.cluster import KMeans
    from sklearn.metrics.pairwise import cosine_similarity
    _USE_KMEANS = True
except Exception:
    _USE_KMEANS = False


def _norm_text(x: str) -> str:
    return (x or "").strip().lower()


def _list_from_field(x: str) -> List[str]:
    if pd.isna(x) or not str(x).strip():
        return []
    return [t.strip().lower() for t in str(x).split(";") if t.strip()]


def embed_corpus(corpus: List[str]) -> np.ndarray:
    """Return (N, D) embeddings for a list of strings.
    Uses MiniLM if available; otherwise TF‑IDF.
    """
    global _USE_ST
    if _USE_ST:
        try:
            model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            embs = model.encode(corpus, normalize_embeddings=True, show_progress_bar=False)
            return np.array(embs, dtype=np.float32)
        except Exception:
            _USE_ST = False  # fallback
    # TF‑IDF fallback
    tfidf = TfidfVectorizer(min_df=1, max_df=0.95, ngram_range=(1,2))
    X = tfidf.fit_transform(corpus)
    # L2 normalize rows
    X = X / (np.sqrt((X.power(2)).sum(axis=1)) + 1e-9)
    return X.astype(np.float32)


def make_pair_embeddings(app_texts, job_texts):
    """Create embeddings for applicants and jobs with compatible dimensions."""
    global _USE_ST
    if _USE_ST:
        try:
            model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            A = np.asarray(model.encode(app_texts, normalize_embeddings=True, show_progress_bar=False), dtype=np.float32)
            J = np.asarray(model.encode(job_texts, normalize_embeddings=True, show_progress_bar=False), dtype=np.float32)
            return A, J
        except Exception:
            _USE_ST = False  # fallback
    # TF‑IDF fallback - fit on combined corpus for compatible dimensions
    tfidf = TfidfVectorizer(min_df=1, max_df=0.95, ngram_range=(1,2))
    all_texts = app_texts + job_texts
    X = tfidf.fit_transform(all_texts)
    # L2 normalize rows
    # Normalize each row - handle both sparse and matrix types
    norms = np.sqrt(np.array((X.multiply(X)).sum(axis=1))).flatten() + 1e-9
    X = X / norms[:, np.newaxis]
    # Convert to dense array for slicing
    if hasattr(X, 'toarray'):
        X = X.toarray()
    elif hasattr(X, 'A'):
        X = X.A
    else:
        X = np.array(X)
    n_app = len(app_texts)
    A = X[:n_app].astype(np.float32)
    J = X[n_app:].astype(np.float32)
    return A, J


def cosine_sim_matrix(A, B) -> np.ndarray:
    """Return cosine similarity between all rows of A and B.
    Works with dense np arrays or scipy sparse matrices.
    """
    if hasattr(A, "dot"):
        sims = A.dot(B.T)
        return np.array(sims.todense() if hasattr(sims, "todense") else sims)
    # dense
    A = A / (np.linalg.norm(A, axis=1, keepdims=True) + 1e-9)
    B = B / (np.linalg.norm(B, axis=1, keepdims=True) + 1e-9)
    return A @ B.T


def req_score(applicant_text: str, must_haves: List[str]) -> float:
    """Fuzzy must-have matching using cosine similarity ≥ 0.6 threshold."""
    if not must_haves:
        return 1.0
    
    at = _norm_text(applicant_text)
    if not at:
        return 0.0
    
    # Try fuzzy matching first
    global _USE_ST
    if _USE_ST:
        try:
            model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            # Create embeddings for applicant text and each must-have skill
            app_emb = model.encode([at], normalize_embeddings=True)
            must_have_embs = model.encode(must_haves, normalize_embeddings=True)
            
            # Calculate cosine similarities
            similarities = cosine_similarity(app_emb, must_have_embs)[0]
            
            # Count matches with cosine >= 0.6
            hits = sum(1 for sim in similarities if sim >= 0.6)
            return hits / max(len(must_haves), 1)
        except Exception:
            _USE_ST = False  # fallback to exact matching
    
    # Fallback to exact substring matching
    hits = 0
    for m in must_haves:
        if not m:
            continue
        if m in at:
            hits += 1
    return hits / max(len(must_haves), 1)


def pay_score(pay_min: float, pay_max: float, target_floor: float) -> float:
    try:
        pmid = (float(pay_min) + float(pay_max)) / 2.0
        floor = max(0.0, float(target_floor))
        if floor <= 0:
            return 1.0
        val = pmid / floor
        return float(max(0.0, min(1.0, val)))
    except Exception:
        return 0.5


def fast_reply_score(response_fast_prob, median_hours) -> float:
    """Derive a fast-reply score. Prefer given probability; else transform median hours."""
    try:
        if pd.notna(response_fast_prob) and str(response_fast_prob).strip() != "":
            p = float(response_fast_prob)
            return float(max(0.0, min(1.0, p)))
    except Exception:
        pass
    # transform median reply hours to (0,1], shorter is better; 12h half-life
    try:
        h = float(median_hours)
        if h < 0:
            return 0.5
        return float(math.exp(-h / 12.0))
    except Exception:
        return 0.5


def market_load_penalty(active_apps_last_24h) -> float:
    """Soft penalty for overloaded postings. Higher is worse; we subtract lambda*penalty."""
    try:
        x = float(active_apps_last_24h)
        return float(math.log1p(max(0.0, x)))  # log(1+x)
    except Exception:
        return 0.0


def cluster_jobs_and_find_nearest(A, J, n_clusters=None):
    """
    Cluster jobs using K-means and find nearest cluster for each applicant.
    Returns: (job_clusters, applicant_nearest_clusters, cluster_distances)
    """
    global _USE_KMEANS
    if not _USE_KMEANS:
        # Fallback: no clustering, return empty arrays
        return np.zeros(len(J)), np.zeros(len(A)), np.zeros(len(A))
    
    try:
        n_jobs = len(J)
        if n_jobs < 2:
            return np.zeros(n_jobs), np.zeros(len(A)), np.zeros(len(A))
        
        # Determine number of clusters (default to sqrt(n_jobs), min 2, max 20)
        if n_clusters is None:
            n_clusters = max(2, min(20, int(np.sqrt(n_jobs))))
        
        # Cluster jobs
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        job_clusters = kmeans.fit_predict(J)
        
        # Find nearest cluster for each applicant
        cluster_centers = kmeans.cluster_centers_
        similarities = cosine_similarity(A, cluster_centers)
        applicant_nearest_clusters = np.argmax(similarities, axis=1)
        cluster_distances = np.max(similarities, axis=1)
        
        return job_clusters, applicant_nearest_clusters, cluster_distances
        
    except Exception as e:
        print(f"Warning: K-means clustering failed: {e}")
        return np.zeros(len(J)), np.zeros(len(A)), np.zeros(len(A))


def targeting_boost(applicant_row, job_row) -> float:
    """Calculate targeting boost if applicant specified target employer/job/city.
    Returns +0.10 boost (capped) for matching jobs, preferring fast-reply certified.
    """
    boost = 0.0
    
    # Check if applicant has targeting data from apply.html
    target_employer = applicant_row.get("target_employer", "")
    target_job_title = applicant_row.get("target_job_title", "")
    target_job_city = applicant_row.get("target_job_city", "")
    
    if not any([target_employer, target_job_title, target_job_city]):
        return 0.0  # No targeting data
    
    # Check for matches (case-insensitive)
    matches = 0
    
    if target_employer:
        job_employer = str(job_row.get("employer_name", "")).lower()
        if target_employer.lower() in job_employer or job_employer in target_employer.lower():
            matches += 1
    
    if target_job_title:
        job_title = str(job_row.get("title", "")).lower()
        # More flexible matching for job titles
        target_words = set(target_job_title.lower().split())
        job_words = set(job_title.split())
        if target_words & job_words:  # Any word overlap
            matches += 1
    
    if target_job_city:
        job_city = str(job_row.get("city", "")).lower()
        if target_job_city.lower() in job_city or job_city in target_job_city.lower():
            matches += 1
    
    # Calculate base boost based on number of matches
    if matches > 0:
        boost = min(0.10, matches * 0.035)  # Up to 0.10, increasing with more matches
        
        # Additional boost for fast-reply certified jobs
        if job_row.get("fast_reply_certified", False):
            boost += 0.02  # Extra boost for certified employers
            boost = min(0.10, boost)  # Still cap at 0.10
    
    return boost


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--applicants", required=True)
    ap.add_argument("--jobs", required=True)
    ap.add_argument("--out", default="top_matches.csv")
    args = ap.parse_args()

    apps = pd.read_csv(args.applicants)
    jobs = pd.read_csv(args.jobs)

    # Build applicant text (resume_text preferred, else skills_text + tags + certs)
    app_texts = []
    for _, r in apps.iterrows():
        parts = []
        if isinstance(r.get("resume_text"), str) and r.get("resume_text").strip():
            parts.append(r["resume_text"])
        if isinstance(r.get("skills_text"), str): parts.append(r["skills_text"])
        if isinstance(r.get("skills_tags"), str): parts.append(r["skills_tags"].replace(";", " "))
        if isinstance(r.get("certs"), str): parts.append(r["certs"].replace(";", " "))
        app_texts.append(" ".join(parts).strip())

    # Build job text (description + skills)
    job_texts = []
    job_must_lists = []
    for _, r in jobs.iterrows():
        parts = []
        if isinstance(r.get("description"), str): parts.append(r["description"])
        if isinstance(r.get("must_have_skills"), str): parts.append(r["must_have_skills"].replace(";", " "))
        if isinstance(r.get("nice_to_have"), str): parts.append(r["nice_to_have"].replace(";", " "))
        job_texts.append(" ".join(parts).strip())
        job_must_lists.append(_list_from_field(r.get("must_have_skills")))

    # Embeddings (or TF‑IDF) + cosine
    A, J = make_pair_embeddings(app_texts, job_texts)
    COS = cosine_sim_matrix(A, J)  # shape: (n_applicants, n_jobs)

    # K-means clustering for job matching
    job_clusters, applicant_nearest_clusters, cluster_distances = cluster_jobs_and_find_nearest(A, J)

    rows = []
    detailed_rows = []  # For top_matches_detailed.csv
    for ai, arow in apps.iterrows():
        # applicant base fields
        a_id = arow.get("id")
        a_name = arow.get("name")
        a_email = arow.get("email")
        target_floor = arow.get("target_pay_min", 0.0)
        a_text = app_texts[ai]

        best = None
        best_score = -1e9
        best_expl = None
        best_j = None
        best_ji = None

        # Get applicant's nearest cluster
        nearest_cluster = applicant_nearest_clusters[ai] if len(applicant_nearest_clusters) > ai else -1
        cluster_distance = cluster_distances[ai] if len(cluster_distances) > ai else 0.0

        for ji, jrow in jobs.iterrows():
            # Subscores
            sem = float(COS[ai, ji])
            req = req_score(a_text, job_must_lists[ji])
            pay = pay_score(jrow.get("pay_min", 0.0), jrow.get("pay_max", 0.0), target_floor)
            fast = fast_reply_score(jrow.get("response_fast_prob", np.nan),
                                    jrow.get("response_median_reply_hours", np.nan))
            load_pen = market_load_penalty(jrow.get("active_apps_last_24h", 0.0))

            # Simple Interview proxy (replace later with trained model)
            # Prioritize must-haves over semantic similarity
            interview = max(0.0, min(1.0, 0.8 * req + 0.2 * sem))

            # Final score (transparent weights) - apply base scoring first
            # Prioritize skills + must-haves over title matching (semantic similarity as soft signal)
            base_score = (
                0.35 * fast +
                0.25 * interview +
                0.30 * req +     # Increased from 0.20 - prioritize must-have skills
                0.05 * sem +     # Decreased from 0.10 - title as soft signal only
                0.05 * pay -
                0.05 * load_pen
            )
            
            # Apply targeting boost after calibration (additive)
            target_boost = targeting_boost(arow, jrow)
            
            # Add cluster-based boost
            job_cluster = job_clusters[ji] if len(job_clusters) > ji else -1
            cluster_boost = 0.0
            if nearest_cluster >= 0 and job_cluster == nearest_cluster:
                cluster_boost = min(0.05, cluster_distance * 0.05)  # Small boost for same cluster
            
            score = base_score + target_boost + cluster_boost

            # Store detailed information for all matches
            detailed_rows.append({
                "applicant_id": a_id,
                "applicant_name": a_name,
                "applicant_email": a_email,
                "job_id": jrow.get("id"),
                "employer": jrow.get("employer_name"),
                "job_title": jrow.get("title"),
                "job_city": jrow.get("city"),
                "job_pay_min": jrow.get("pay_min"),
                "job_pay_max": jrow.get("pay_max"),
                "score": round(float(score), 4),
                "sem_score": round(float(sem), 4),
                "req_score": round(float(req), 4),
                "pay_score": round(float(pay), 4),
                "fast_reply_score": round(float(fast), 4),
                "load_penalty": round(float(load_pen), 4),
                "interview_score": round(float(interview), 4),
                "target_boost": round(float(target_boost), 4),
                "cluster_boost": round(float(cluster_boost), 4),
                "job_cluster": int(job_cluster),
                "applicant_nearest_cluster": int(nearest_cluster),
                "cluster_distance": round(float(cluster_distance), 4)
            })

            if score > best_score:
                best_score = score
                best_j = jrow
                # Plain-English explanation
                must_text = jrow.get("must_have_skills", "")
                met_pct = f"{int(round(req * 100))}%"
                try:
                    med_h = float(jrow.get("response_median_reply_hours"))
                    med_txt = f"{med_h:.1f}h"
                except Exception:
                    med_txt = "n/a"
                fast_txt = f"{fast:.2f}"
                sem_txt = f"{sem:.2f}"
                pay_txt = f"{pay:.2f}"
                
                # Build explanation with optional targeting info
                expl_parts = [
                    f"Skills fit: {int(round((0.30*req + 0.05*sem)*100))}%",
                    f"Must-haves met: {met_pct} ({must_text})",
                    f"Fast-reply prior: {fast_txt} (median {med_txt})",
                    f"Pay fit: {pay_txt}",
                    "Crowd penalty applied."
                ]
                
                # Add targeting boost explanation if applicable
                if target_boost > 0:
                    boost_pct = f"+{int(round(target_boost * 100))}%"
                    if jrow.get("fast_reply_certified", False):
                        expl_parts.insert(-1, f"Targeting boost: {boost_pct} (certified)")
                    else:
                        expl_parts.insert(-1, f"Targeting boost: {boost_pct}")
                
                best_expl = " • ".join(expl_parts)

        if best_j is not None:
            rows.append({
                "applicant_id": a_id,
                "applicant_name": a_name,
                "applicant_email": a_email,
                "job_id": best_j.get("id"),
                "employer": best_j.get("employer_name"),
                "job_title": best_j.get("title"),
                "job_city": best_j.get("city"),
                "job_pay_min": best_j.get("pay_min"),
                "job_pay_max": best_j.get("pay_max"),
                "score": round(float(best_score), 4),
                "explanation": best_expl
            })

    out_df = pd.DataFrame(rows).sort_values("score", ascending=False)
    out_df.to_csv(args.out, index=False)
    print(f"Wrote {args.out} with {len(out_df)} matches.")
    
    # Write detailed subscores CSV
    detailed_df = pd.DataFrame(detailed_rows).sort_values(["applicant_id", "score"], ascending=[True, False])
    detailed_out = "top_matches_detailed.csv"
    detailed_df.to_csv(detailed_out, index=False)
    print(f"Wrote {detailed_out} with {len(detailed_df)} detailed matches.")
    
    if len(out_df) > 0:
        print(out_df.head(10).to_string(index=False))


if __name__ == "__main__":
    main()
