#!/usr/bin/env python3
"""
Learn optimal weights for matching score by training on outcome data.
Joins events.csv with top_matches_detailed.csv to train a logistic model.
"""

import pandas as pd
import numpy as np
import json
import os
import sys
from datetime import datetime
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score

def load_and_join_data():
    """Load and join events.csv with top_matches_detailed.csv"""
    
    # Load events.csv
    if not os.path.exists('events.csv'):
        print("Error: events.csv not found")
        return None
    
    events_df = pd.read_csv('events.csv')
    
    # Load top_matches_detailed.csv
    if not os.path.exists('top_matches_detailed.csv'):
        print("Error: top_matches_detailed.csv not found")
        return None
    
    matches_df = pd.read_csv('top_matches_detailed.csv')
    
    # Join on applicant_id and job_id
    joined_df = events_df.merge(
        matches_df, 
        on=['applicant_id', 'job_id'], 
        how='inner',
        suffixes=('_event', '_match')
    )
    
    print(f"Joined {len(events_df)} events with {len(matches_df)} matches")
    print(f"Result: {len(joined_df)} matching records")
    
    return joined_df

def create_target_variable(df):
    """Create target variable: 1 if interviewed OR hired, 0 otherwise"""
    
    # Handle missing values by filling with 0
    df['interview'] = df['interview'].fillna(0)
    df['hired'] = df['hired'].fillna(0)
    
    # Create binary target: success if interviewed OR hired
    df['success'] = ((df['interview'] == 1) | (df['hired'] == 1)).astype(int)
    
    return df

def prepare_features(df):
    """Prepare feature matrix from detailed match data"""
    
    feature_columns = [
        'sem_score',      # SemScore: semantic similarity
        'req_score',      # ReqScore: required skills match
        'pay_score',      # PayScore: pay alignment
        'fast_reply_score', # FastReply: employer response speed
        'load_penalty',   # LoadPenalty: job overload penalty
        'interview_score' # InterviewProxy: interview likelihood
    ]
    
    # Check if all feature columns exist
    missing_cols = [col for col in feature_columns if col not in df.columns]
    if missing_cols:
        print(f"Error: Missing feature columns: {missing_cols}")
        return None, None
    
    # Extract features
    X = df[feature_columns].copy()
    
    # Handle missing values by filling with 0
    X = X.fillna(0)
    
    print(f"Feature matrix shape: {X.shape}")
    print(f"Feature columns: {feature_columns}")
    
    return X, feature_columns

def train_logistic_model(X, y):
    """Train logistic regression model and return coefficients"""
    
    print(f"Training on {len(X)} samples")
    print(f"Success rate: {y.mean():.1%} ({y.sum()}/{len(y)})")
    
    # Check if we have enough positive examples
    if y.sum() < 2:
        print("Warning: Too few positive examples for training")
        return None, None, None
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train logistic regression
    model = LogisticRegression(
        random_state=42,
        max_iter=1000,
        class_weight='balanced'  # Handle class imbalance
    )
    
    model.fit(X_scaled, y)
    
    # Get cross-validation score if we have enough data
    cv_score = None
    if len(X) >= 10:  # Need at least 10 samples for CV
        cv_scores = cross_val_score(model, X_scaled, y, cv=min(5, len(X)//2))
        cv_score = cv_scores.mean()
        print(f"Cross-validation accuracy: {cv_score:.3f} ± {cv_scores.std():.3f}")
    
    return model, scaler, cv_score

def normalize_coefficients(coefficients, feature_names):
    """Normalize coefficients to sum to 1.0 (maintaining relative importance)"""
    
    # Take absolute values and normalize
    abs_coefs = np.abs(coefficients)
    normalized = abs_coefs / abs_coefs.sum()
    
    # Create weights dictionary
    weights = {}
    for name, weight in zip(feature_names, normalized):
        # Map to weight names used in foundational_model.py
        weight_name = {
            'sem_score': 'sem_weight',
            'req_score': 'req_weight', 
            'pay_score': 'pay_weight',
            'fast_reply_score': 'fast_reply_weight',
            'load_penalty': 'load_penalty_weight',
            'interview_score': 'interview_weight'
        }.get(name, name)
        
        weights[weight_name] = float(weight)
    
    return weights

def get_default_weights():
    """Return default weights if training fails"""
    return {
        'sem_weight': 0.25,
        'req_weight': 0.30,
        'pay_weight': 0.15,
        'fast_reply_weight': 0.15,
        'load_penalty_weight': 0.05,
        'interview_weight': 0.10
    }

def save_weights(weights, metadata=None):
    """Save weights to weights.json"""
    
    output = {
        'weights': weights,
        'metadata': metadata or {},
        'last_updated': datetime.now().isoformat(),
        'version': '1.0'
    }
    
    with open('weights.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"Saved weights to weights.json:")
    for name, weight in weights.items():
        print(f"  {name}: {weight:.4f}")

def main():
    """Main learning function"""
    print("Starting weight learning from outcome data...")
    
    # Load and join data
    df = load_and_join_data()
    if df is None:
        print("Failed to load and join data")
        return False
    
    # Create target variable
    df = create_target_variable(df)
    
    # Check if we have enough labeled data
    total_events = len(df)
    labeled_events = df['success'].sum()
    
    print(f"Total events: {total_events}")
    print(f"Labeled positive outcomes: {labeled_events}")
    
    # Use default weights if insufficient data
    if total_events < 20:
        print(f"Insufficient data for training (need >=20 events, have {total_events})")
        print("Using default weights...")
        
        weights = get_default_weights()
        metadata = {
            'training_method': 'default',
            'reason': f'insufficient_data_{total_events}_events',
            'total_events': total_events,
            'labeled_events': int(labeled_events)
        }
        
        save_weights(weights, metadata)
        return True
    
    # Prepare features
    X, feature_names = prepare_features(df)
    if X is None:
        print("Failed to prepare features")
        return False
    
    # Create target
    y = df['success'].values
    
    # Train model
    model, scaler, cv_score = train_logistic_model(X, y)
    if model is None:
        print("Training failed, using default weights...")
        
        weights = get_default_weights()
        metadata = {
            'training_method': 'default',
            'reason': 'training_failed',
            'total_events': total_events,
            'labeled_events': int(labeled_events)
        }
        
        save_weights(weights, metadata)
        return True
    
    # Extract and normalize coefficients
    coefficients = model.coef_[0]
    weights = normalize_coefficients(coefficients, feature_names)
    
    # Prepare metadata
    metadata = {
        'training_method': 'logistic_regression',
        'total_events': total_events,
        'labeled_events': int(labeled_events),
        'success_rate': float(y.mean()),
        'cv_accuracy': float(cv_score) if cv_score else None,
        'feature_names': feature_names,
        'raw_coefficients': coefficients.tolist()
    }
    
    # Save weights
    save_weights(weights, metadata)
    
    print("Weight learning completed successfully!")
    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Fatal error in weight learning: {e}")
        sys.exit(1)