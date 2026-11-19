from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Coordinates(BaseModel):
    lng: float
    lat: float

class LocationResult(BaseModel):
    text: Optional[str] = Field(None, description="Raw text snippet representing location")
    name: Optional[str] = Field(None, description="Canonical name of extracted or provided location")
    coordinates: Optional[List[float]] = Field(None, description="[longitude, latitude] coordinates")
    source: str = Field("unresolved", description="'gps', 'extracted', or 'unresolved'")
    resolved: bool = Field(False, description="True if coordinates are known and verified")

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw user report text to analyze")
    coordinates: Optional[List[float]] = Field(
        None,
        description="Optional GPS coordinates provided by user [longitude, latitude] or [lat, lng]"
    )
    locationName: Optional[str] = Field(None, description="Optional user-provided location name")

class HazardClassification(BaseModel):
    category: str = Field(..., description="Canonical category: abnormal_waves, storm_surge, coastal_flooding, coastal_erosion, marine_incident, other")
    label: str = Field(..., description="Human readable title from synopsis")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Classification confidence score")
    secondary_categories: List[str] = Field(default_factory=list, description="Secondary related hazard categories")
    similarity_scores: Dict[str, float] = Field(default_factory=dict, description="Cosine similarity scores across categories")
    is_uncertain: bool = Field(False, description="True if text was insufficient or similarity fell below threshold")

class SeverityAssessment(BaseModel):
    level: str = Field(..., description="Calculated base severity: low, medium, high, critical")
    rationale: List[str] = Field(default_factory=list, description="Reasons triggering severity level")
    impact_keywords: List[str] = Field(default_factory=list, description="Matched urgency/damage keywords")

class AnalysisMetadata(BaseModel):
    tokens_count: int
    lemmas: List[str]
    entities: List[Dict[str, str]]
    processing_time_ms: float

class AnalyzeResponse(BaseModel):
    success: bool = True
    hazard_type: str = Field(..., description="Matches backend schema enum")
    hazard_label: str
    confidence: float
    severity: str
    secondary_hazard_types: List[str] = Field(default_factory=list)
    location: LocationResult
    classification: HazardClassification
    severity_assessment: SeverityAssessment
    metadata: AnalysisMetadata

class HealthResponse(BaseModel):
    status: str
    service: str
    spacy_model: str
    sklearn_ready: bool
    version: str
