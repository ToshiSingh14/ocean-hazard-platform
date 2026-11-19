import time
from fastapi import APIRouter, HTTPException, status
from app.schemas.prediction import (
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse,
    LocationResult,
    HazardClassification,
    SeverityAssessment,
    AnalysisMetadata
)

router = APIRouter()

# Global engine references populated at startup
classifier_service = None
location_service = None

def init_services(classifier, location_extractor):
    global classifier_service, location_service
    classifier_service = classifier
    location_service = location_extractor

@router.get("/health", response_model=HealthResponse)
async def health_check():
    ready = classifier_service is not None and location_service is not None
    return HealthResponse(
        status="healthy" if ready else "initializing",
        service="AquaPulse NLP & Incident Intelligence Microservice",
        spacy_model="en_core_web_sm",
        sklearn_ready=ready,
        version="1.0.0"
    )

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_report(payload: AnalyzeRequest):
    if not classifier_service or not location_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NLP engines are not initialized"
        )

    start_time = time.time()
    raw_text = payload.text.strip()
    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report text cannot be empty"
        )

    # 1. Hazard Classification using spaCy + Scikit-learn TF-IDF & Cosine Similarity
    class_res = classifier_service.classify(raw_text)

    # 2. Rule-based Severity Assessment
    sev_res = classifier_service.assess_severity(raw_text, class_res["category"])

    # 3. Location Extraction with GPS priority
    loc_res = location_service.extract_location(
        text=raw_text,
        user_coords=payload.coordinates,
        user_location_name=payload.locationName
    )

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return AnalyzeResponse(
        success=True,
        hazard_type=class_res["category"],
        hazard_label=class_res["label"],
        confidence=class_res["confidence"],
        severity=sev_res["level"],
        secondary_hazard_types=class_res["secondary_categories"],
        location=LocationResult(
            text=loc_res.get("text"),
            name=loc_res.get("name"),
            coordinates=loc_res.get("coordinates"),
            source=loc_res.get("source", "unresolved"),
            resolved=loc_res.get("resolved", False)
        ),
        classification=HazardClassification(
            category=class_res["category"],
            label=class_res["label"],
            confidence=class_res["confidence"],
            secondary_categories=class_res["secondary_categories"],
            similarity_scores=class_res["similarity_scores"],
            is_uncertain=class_res["is_uncertain"]
        ),
        severity_assessment=SeverityAssessment(
            level=sev_res["level"],
            rationale=sev_res["rationale"],
            impact_keywords=sev_res["impact_keywords"]
        ),
        metadata=AnalysisMetadata(
            tokens_count=len(class_res["lemmas"]),
            lemmas=class_res["lemmas"],
            entities=class_res["entities"],
            processing_time_ms=elapsed_ms
        )
    )
