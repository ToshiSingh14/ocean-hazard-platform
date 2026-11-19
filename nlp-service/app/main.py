import logging
import os
import spacy
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.services.classifier import HazardClassifier
from app.services.location_extractor import LocationExtractor
from app.routes.nlp_routes import router as nlp_router, init_services

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("nlp-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load spaCy model and train scikit-learn TF-IDF reference matrix once
    logger.info("Initializing NLP Service: loading spaCy model 'en_core_web_sm'...")
    try:
        spacy_nlp = spacy.load("en_core_web_sm")
    except Exception as e:
        logger.warning(f"Could not load installed spacy model directly ({e}), attempting fallback load...")
        import en_core_web_sm
        spacy_nlp = en_core_web_sm.load()

    logger.info("Building Scikit-Learn TF-IDF Vectorizer and reference hazard corpus...")
    classifier = HazardClassifier(spacy_nlp)
    
    logger.info("Building Location Extractor and coastal gazetteer index...")
    location_extractor = LocationExtractor(spacy_nlp)

    # Inject initialized services into routes
    init_services(classifier, location_extractor)
    logger.info("NLP Service ready to accept incoming hazard reports!")

    yield

    logger.info("Shutting down NLP Service.")

app = FastAPI(
    title="AquaPulse NLP & Coastal Incident Intelligence Microservice",
    description="Hazard text classification, spaCy NER, coastal gazetteer location extraction, and rule-based severity scoring.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for backend (port 5000) and frontend (port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount routes
app.include_router(nlp_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
