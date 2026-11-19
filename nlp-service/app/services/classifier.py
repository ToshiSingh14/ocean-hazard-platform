import re
import numpy as np
from typing import Dict, List, Tuple, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Exact predefined categories from project synopsis
CATEGORY_MAP = {
    "abnormal_waves": "Abnormal/High Waves",
    "storm_surge": "Storm Surge",
    "coastal_flooding": "Coastal Flooding",
    "coastal_erosion": "Coastal Erosion",
    "marine_incident": "Marine Incident",
    "other": "Other Ocean Hazards"
}

# Domain reference corpus for TF-IDF vectorization and similarity comparison
HAZARD_CORPUS: Dict[str, List[str]] = {
    "abnormal_waves": [
        "abnormal high waves rogue wave huge sea swells breaking violently near shoreline",
        "massive destructive breaker waves high tide swells crashing against beach promenade",
        "extreme sea wave action sudden surge of giant ocean swells sweeping over shore",
        "dangerous turbulent sea conditions towering swells engulfing beachgoers and coastal barrier",
        "abnormally large waves cresting near coast strong backwash dragging sand into sea"
    ],
    "storm_surge": [
        "storm surge severe cyclone rising sea water level inundating coastal plains",
        "cyclonic storm water surge tidal flooding driven by extreme gale winds",
        "sea level dramatically rising due to deep sea depression and approaching tropical cyclone",
        "ocean water surging inland ahead of cyclone eye wall storm surge warning",
        "high velocity wind pushing seawater deep into coastal villages storm surge warning"
    ],
    "coastal_flooding": [
        "coastal flooding seawater overflowing embankments and entering homes and streets",
        "waterlogging near beach houses submerged in sea water following high tide",
        "drainage backup coastal inundation saltwater flooding residential shoreline neighborhoods",
        "low lying coastal areas completely inundated with seawater knee deep flood tidal water submerged beachfront market pathways",
        "ocean water breaching barrier walls and flooding coastal road market and settlements"
    ],
    "coastal_erosion": [
        "severe coastal erosion collapse of shoreline sand dunes and seawall damage",
        "beach wash away land receding into the sea collapsing concrete embankment",
        "sea eating away shoreline roads cracking and falling into the ocean",
        "beachfront land degradation heavy soil erosion along coast foundation washed away sandy bluff slid",
        "loss of beach area rocks shifting barrier degradation due to continuous tidal action sea wall cracked"
    ],
    "marine_incident": [
        "fishing boat capsized fishermen missing rescue operation in deep sea",
        "trawler engine failure stranded at sea distress call vessel collision",
        "cargo ship adrift leaking fuel oil spill slick in marine waters near harbor",
        "capsized boat in rough seas coast guard deployment crew evacuation life jacket",
        "maritime accident vessel sinking submerged wreckage stranded sailors offshore"
    ],
    "other": [
        "general ocean disturbance unknown marine phenomenon water discoloration unusual odor",
        "jellyfish bloom dead fish wash up on shore coastal pollution marine debris",
        "unidentified marine hazard foam accumulation on beach surface sea froth",
        "general shoreline environmental anomaly offshore disturbance not classified elsewhere"
    ]
}

# High-priority keyword anchors for domain refinement (including common spelling variants / phrases)
CATEGORY_KEYWORDS = {
    "abnormal_waves": ["wave", "waves", "swell", "swells", "breaker", "breakers", "surf", "rough sea", "roque wave"],
    "storm_surge": ["storm surge", "cyclone", "cyclonic", "gale", "depression", "sea level rise", "water surge", "super cyclone"],
    "coastal_flooding": ["flood", "flooded", "flooding", "waterlogging", "inundated", "inundation", "overflow", "water enter", "submerged", "submerging"],
    "coastal_erosion": ["erosion", "eroded", "eroding", "erozion", "seawall", "sea wall", "sea-wall", "collapse", "collapsing", "wash away", "washed away", "dune", "bluff", "sand wash"],
    "marine_incident": ["boat", "trawler", "vessel", "ship", "fisherman", "fishermen", "capsized", "capsize", "sank", "sunk", "oil spill", "spill", "sailor"]
}

class HazardClassifier:
    """
    Lightweight, transparent hazard classification using:
    1. spaCy: tokenization, lemmatization, stop-word removal.
    2. Scikit-learn: TfidfVectorizer + cosine_similarity against reference hazard corpus.
    3. Rule-based thresholding to handle unclear, ambiguous, or out-of-domain descriptions.
    """

    def __init__(self, spacy_nlp):
        self.nlp = spacy_nlp
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            sublinear_tf=True
        )
        self.category_names = list(HAZARD_CORPUS.keys())
        self._train_reference_vectors()

    def _train_reference_vectors(self):
        # Build composite document representation for each category
        corpus_docs = []
        for cat in self.category_names:
            combined = " ".join(HAZARD_CORPUS[cat])
            # Preprocess reference corpus with spaCy lemmatization
            doc = self.nlp(combined)
            lemmas = [
                t.lemma_.lower() for t in doc
                if not t.is_stop and not t.is_punct and len(t.text) > 1
            ]
            corpus_docs.append(" ".join(lemmas))

        # Fit vectorizer once at startup
        self.reference_matrix = self.vectorizer.fit_transform(corpus_docs)

    def preprocess_text(self, text: str) -> Tuple[str, List[str], List[Dict[str, str]]]:
        """
        Use spaCy for text preprocessing, tokenization, lemmatization, and stop-word filtering.
        """
        doc = self.nlp(text)
        lemmas = []
        for token in doc:
            if not token.is_stop and not token.is_punct and not token.like_num and len(token.text.strip()) > 1:
                lemmas.append(token.lemma_.lower())

        entities = [
            {"text": ent.text, "label": ent.label_}
            for ent in doc.ents
        ]

        cleaned_text = " ".join(lemmas)
        return cleaned_text, lemmas, entities

    def classify(self, raw_text: str) -> Dict[str, Any]:
        """
        Classifies report description into predefined synopsis categories.
        """
        if not raw_text or not isinstance(raw_text, str) or not raw_text.strip():
            return {
                "category": "other",
                "label": CATEGORY_MAP["other"],
                "confidence": 0.20,
                "secondary_categories": [],
                "similarity_scores": {cat: 0.0 for cat in self.category_names},
                "is_uncertain": True,
                "lemmas": [],
                "entities": []
            }

        cleaned_text, lemmas, entities = self.preprocess_text(raw_text)

        # Quick check for clear domain anchor keywords in raw text even if single lemma
        raw_lower = raw_text.lower()
        matched_category_by_direct_kw = None
        for cat, kws in CATEGORY_KEYWORDS.items():
            if any(re.search(r'\b' + re.escape(kw) + r'\b', raw_lower) for kw in kws):
                matched_category_by_direct_kw = cat
                break

        # Check for insufficient content (< 2 lemmas) UNLESS an exact coastal hazard keyword is present
        if (not cleaned_text or len(lemmas) < 2) and not matched_category_by_direct_kw:
            return {
                "category": "other",
                "label": CATEGORY_MAP["other"],
                "confidence": 0.20,
                "secondary_categories": [],
                "similarity_scores": {cat: 0.0 for cat in self.category_names},
                "is_uncertain": True,
                "lemmas": lemmas,
                "entities": entities
            }

        # 1. Scikit-learn TF-IDF transform & cosine_similarity
        query_text = cleaned_text if cleaned_text else raw_lower
        query_vec = self.vectorizer.transform([query_text])
        similarities = cosine_similarity(query_vec, self.reference_matrix)[0]

        scores = {}
        for idx, cat in enumerate(self.category_names):
            base_sim = float(similarities[idx])
            # Refine similarity with keyword presence
            keyword_bonus = 0.0
            if cat in CATEGORY_KEYWORDS:
                for kw in CATEGORY_KEYWORDS[cat]:
                    if re.search(r'\b' + re.escape(kw) + r'\b', raw_lower):
                        keyword_bonus += 0.12
            scores[cat] = round(min(1.0, base_sim + keyword_bonus), 4)

        # Sort categories by score
        sorted_cats = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        top_cat, top_score = sorted_cats[0]
        second_cat, second_score = sorted_cats[1]

        # Uncertainty check: if maximum score is below threshold (0.15)
        is_uncertain = False
        if top_score < 0.15:
            is_uncertain = True
            chosen_cat = "other"
            confidence = round(max(0.20, top_score), 2)
            secondary = []
        else:
            chosen_cat = top_cat
            # Similarity-based heuristic confidence score (not a calibrated probability)
            margin = top_score - second_score
            calc_conf = 0.60 + (top_score * 0.25) + (max(0.0, margin) * 0.15)
            confidence = round(min(0.96, max(0.40, calc_conf)), 2)

            secondary = []
            if second_score >= 0.20 and second_cat != "other":
                secondary.append(second_cat)

        return {
            "category": chosen_cat,
            "label": CATEGORY_MAP[chosen_cat],
            "confidence": confidence,
            "secondary_categories": secondary,
            "similarity_scores": scores,
            "is_uncertain": is_uncertain,
            "lemmas": lemmas,
            "entities": entities
        }

    def assess_severity(self, raw_text: str, category: str) -> Dict[str, Any]:
        """
        Rule-based severity scoring with 4 levels (low, medium, high, critical)
        evaluating reported impact, urgency keywords, and hazard category.
        """
        text_lower = (raw_text or '').lower()
        rationale = []
        impact_keywords = []

        # Keywords indicative of critical danger / emergency
        critical_kw = ["evacuate", "evacuation", "emergency", "fatal", "death", "missing", "capsized", "submerged houses", "tsunami", "catastrophic", "trapped"]
        high_kw = ["severe", "heavy damage", "breached", "destroyed", "overflowing", "huge wave", "high tide", "cracked wall", "stranded", "oil slick", "gale", "submerged", "sank", "sunk"]
        medium_kw = ["flooded", "waterlogging", "strong wave", "erosion", "damaged", "rough", "advisory", "warning"]

        for kw in critical_kw:
            if kw in text_lower:
                impact_keywords.append(kw)
        for kw in high_kw:
            if kw in text_lower and kw not in impact_keywords:
                impact_keywords.append(kw)
        for kw in medium_kw:
            if kw in text_lower and kw not in impact_keywords:
                impact_keywords.append(kw)

        level = "low"
        if any(kw in impact_keywords for kw in critical_kw):
            level = "critical"
            rationale.append("Direct human threat, structural submergence, or missing persons reported")
        elif any(kw in impact_keywords for kw in high_kw) or category in ("storm_surge", "marine_incident"):
            level = "high"
            rationale.append("Significant structural impact, active breach, or severe maritime risk")
        elif any(kw in impact_keywords for kw in medium_kw) or category in ("coastal_flooding", "abnormal_waves", "coastal_erosion"):
            level = "medium"
            rationale.append("Noticeable waterlogging, coastal erosion, or anomalous wave action")
        else:
            level = "low"
            rationale.append("Standard advisory or minor localized disturbance")

        return {
            "level": level,
            "rationale": rationale,
            "impact_keywords": impact_keywords
        }
