"""
ML Model Registry and Experiment Tracking Models
"""

import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from backend.app.database import Base

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), index=True, nullable=False)
    version = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    metrics = Column(Text, default="{}")          # JSON string: rmse, mae, precision, recall
    hyperparameters = Column(Text, default="{}")  # JSON string
    artifact_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExperimentLog(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    dataset_version = Column(String(50), default="movielens-100k+tmdb-5000")
    parameters = Column(Text, default="{}")
    results = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

