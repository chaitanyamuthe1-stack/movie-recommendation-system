"""
Admin and Experiment Tuning Routes
Allows dynamic tuning of hybrid model weights and experiment parameter logs.
"""

import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.experiment import ExperimentLog
from backend.app.recommendation.engine import RecommendationEngine

router = APIRouter(prefix="/admin", tags=["Admin & Experiments"])

@router.get("/weights")
def get_hybrid_weights():
    """Retrieve currently active hybrid recommendation weights."""
    weights_path = os.path.join(settings.CONFIGS_DIR, "hybrid_weights.json")
    if os.path.exists(weights_path):
        with open(weights_path, "r") as f:
            return json.load(f)
    return {}

@router.post("/weights")
def update_hybrid_weights(new_weights: dict):
    """Dynamically update hybrid recommendation weights without restarting server."""
    weights_path = os.path.join(settings.CONFIGS_DIR, "hybrid_weights.json")
    with open(weights_path, "w") as f:
        json.dump(new_weights, f, indent=2)

    # Reload in engine
    engine = RecommendationEngine.get_instance()
    engine.hybrid_model.load_config()
    return {"message": "Hybrid weights updated successfully", "weights": new_weights}

@router.get("/experiments")
def list_experiments(db: Session = Depends(get_db)):
    """List tracked experiments."""
    return db.query(ExperimentLog).order_by(ExperimentLog.created_at.desc()).all()
