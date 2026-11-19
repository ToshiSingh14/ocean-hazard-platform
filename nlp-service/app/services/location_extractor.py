import re
from typing import Optional, List, Tuple, Dict, Any
import spacy

# Coastal gazetteer mapping normalized place names to [longitude, latitude] coordinates (GeoJSON standard)
COASTAL_GAZETTEER: Dict[str, Dict[str, Any]] = {
    # Odisha
    "puri": {
        "name": "Puri",
        "state": "Odisha",
        "coordinates": [85.8312, 19.8135],
        "aliases": ["puri beach", "puri coastline", "golden beach", "puri sea beach"]
    },
    "paradip": {
        "name": "Paradip",
        "state": "Odisha",
        "coordinates": [86.6085, 20.3165],
        "aliases": ["paradeep", "paradip port", "paradip beach"]
    },
    "gopalpur": {
        "name": "Gopalpur",
        "state": "Odisha",
        "coordinates": [84.9075, 19.2608],
        "aliases": ["gopalpur sea beach", "gopalpur-on-sea", "gopalpur port"]
    },
    "chandipur": {
        "name": "Chandipur",
        "state": "Odisha",
        "coordinates": [87.0222, 21.4682],
        "aliases": ["chandipur beach", "chandipur coast", "balasore coast"]
    },
    "astarang": {
        "name": "Astarang",
        "state": "Odisha",
        "coordinates": [86.2625, 19.9822],
        "aliases": ["astarang beach", "jahania beach"]
    },
    "dhamra": {
        "name": "Dhamra",
        "state": "Odisha",
        "coordinates": [86.9744, 20.7953],
        "aliases": ["dhamra port"]
    },
    # Andhra Pradesh
    "visakhapatnam": {
        "name": "Visakhapatnam",
        "state": "Andhra Pradesh",
        "coordinates": [83.2185, 17.6868],
        "aliases": ["vizag", "rk beach", "ramakrishna beach", "rushikonda", "vizag port"]
    },
    "kakinada": {
        "name": "Kakinada",
        "state": "Andhra Pradesh",
        "coordinates": [82.2475, 16.9891],
        "aliases": ["kakinada port", "kakinada coast", "hope island"]
    },
    "machilipatnam": {
        "name": "Machilipatnam",
        "state": "Andhra Pradesh",
        "coordinates": [81.1389, 16.1875],
        "aliases": ["machilipatnam port", "manginapudi"]
    },
    # Tamil Nadu
    "chennai": {
        "name": "Chennai",
        "state": "Tamil Nadu",
        "coordinates": [80.2707, 13.0827],
        "aliases": ["marina beach", "elliot beach", "besant nagar beach", "ennore", "chennai port"]
    },
    "cuddalore": {
        "name": "Cuddalore",
        "state": "Tamil Nadu",
        "coordinates": [79.7681, 11.7480],
        "aliases": ["silver beach cuddalore", "cuddalore port"]
    },
    "nagapattinam": {
        "name": "Nagapattinam",
        "state": "Tamil Nadu",
        "coordinates": [79.8449, 10.7672],
        "aliases": ["nagapattinam port", "velankanni beach"]
    },
    "rameswaram": {
        "name": "Rameswaram",
        "state": "Tamil Nadu",
        "coordinates": [79.3129, 9.2876],
        "aliases": ["dhanushkodi", "pamban"]
    },
    "kanyakumari": {
        "name": "Kanyakumari",
        "state": "Tamil Nadu",
        "coordinates": [77.5385, 8.0883],
        "aliases": ["cape comorin", "kanyakumari beach"]
    },
    # Kerala
    "kochi": {
        "name": "Kochi",
        "state": "Kerala",
        "coordinates": [76.2673, 9.9312],
        "aliases": ["cochin", "fort kochi", "marine drive kochi", "cochin port", "cherai beach"]
    },
    "alappuzha": {
        "name": "Alappuzha",
        "state": "Kerala",
        "coordinates": [76.3264, 9.4981],
        "aliases": ["alleppey", "alappuzha beach"]
    },
    "kozhikode": {
        "name": "Kozhikode",
        "state": "Kerala",
        "coordinates": [75.7804, 11.2588],
        "aliases": ["calicut", "kozhikode beach", "kappad beach"]
    },
    "thiruvananthapuram": {
        "name": "Thiruvananthapuram",
        "state": "Kerala",
        "coordinates": [76.9366, 8.5241],
        "aliases": ["trivandrum", "kovalam", "shanghumukham", "varkala"]
    },
    # Maharashtra & Goa
    "mumbai": {
        "name": "Mumbai",
        "state": "Maharashtra",
        "coordinates": [72.8777, 19.0760],
        "aliases": ["juhu beach", "marine drive", "colaba", "bandra bandstand", "mumbai port", "dadar chowpatty", "girgaon chowpatty"]
    },
    "alibaug": {
        "name": "Alibaug",
        "state": "Maharashtra",
        "coordinates": [72.8748, 18.6414],
        "aliases": ["alibaug beach", "varsoli"]
    },
    "panaji": {
        "name": "Panaji",
        "state": "Goa",
        "coordinates": [73.8278, 15.4909],
        "aliases": ["goa", "miramar beach", "calangute", "baga beach", "anjuna", "mormugao"]
    },
    # Gujarat
    "surat": {
        "name": "Surat",
        "state": "Gujarat",
        "coordinates": [72.8311, 21.1702],
        "aliases": ["dumas beach", "suvali beach", "hazira"]
    },
    "porbandar": {
        "name": "Porbandar",
        "state": "Gujarat",
        "coordinates": [69.6293, 21.6417],
        "aliases": ["porbandar port", "porbandar beach"]
    },
    "dwarka": {
        "name": "Dwarka",
        "state": "Gujarat",
        "coordinates": [68.9685, 22.2442],
        "aliases": ["shivrajpur beach", "dwarka coast"]
    },
    # West Bengal
    "digha": {
        "name": "Digha",
        "state": "West Bengal",
        "coordinates": [87.5113, 21.6266],
        "aliases": ["new digha", "old digha", "digha beach"]
    },
    "bakkhali": {
        "name": "Bakkhali",
        "state": "West Bengal",
        "coordinates": [88.2497, 21.5647],
        "aliases": ["bakkhali beach", "frazerganj"]
    },
    "sagar_island": {
        "name": "Sagar Island",
        "state": "West Bengal",
        "coordinates": [88.1130, 21.6500],
        "aliases": ["gangasagar"]
    }
}

class LocationExtractor:
    """
    Extracts coastal location information using spaCy NER and an Indian coastal gazetteer.
    Ensures user-provided GPS coordinates strictly take priority.
    """

    def __init__(self, spacy_nlp):
        self.nlp = spacy_nlp
        self._build_lookup_index()

    def _build_lookup_index(self):
        self.lookup = {}
        for key, entry in COASTAL_GAZETTEER.items():
            canonical_name = entry["name"]
            coords = entry["coordinates"]
            
            # Key itself
            self.lookup[key.lower()] = (canonical_name, coords)
            self.lookup[canonical_name.lower()] = (canonical_name, coords)
            
            # Aliases
            for alias in entry.get("aliases", []):
                self.lookup[alias.lower()] = (canonical_name, coords)

    def _match_gazetteer(self, text_candidate: str) -> Optional[Tuple[str, List[float]]]:
        cand = text_candidate.strip().lower()
        if cand in self.lookup:
            return self.lookup[cand]
        
        # Substring/word-boundary check for exact known places
        for place_key, (canonical_name, coords) in self.lookup.items():
            pattern = r'\b' + re.escape(place_key) + r'\b'
            if re.search(pattern, cand):
                return (canonical_name, coords)
        return None

    def extract_location(
        self,
        text: str,
        user_coords: Optional[List[float]] = None,
        user_location_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extract location details.
        Rule 1: User-selected or GPS coordinates have strict priority.
        Rule 2: If no coordinates provided, use spaCy NER + gazetteer.
        Rule 3: If no valid match, return unresolved without inventing coordinates.
        """
        # 1. User provided coordinates (GPS priority)
        if user_coords and isinstance(user_coords, (list, tuple)) and len(user_coords) == 2:
            c1, c2 = float(user_coords[0]), float(user_coords[1])
            
            # Standardize GeoJSON [lng, lat]
            # India bounds: Longitude ~ 68 to 97, Latitude ~ 6 to 37
            if (68.0 <= c1 <= 98.0) and (6.0 <= c2 <= 38.0):
                final_coords = [c1, c2]
            elif (6.0 <= c1 <= 38.0) and (68.0 <= c2 <= 98.0):
                final_coords = [c2, c1]
            else:
                final_coords = [c1, c2]

            name = user_location_name.strip() if user_location_name and user_location_name.strip() else None
            
            # If name not given, check if text mentions a known coastal place to assign a label
            if not name:
                doc = self.nlp(text)
                for ent in doc.ents:
                    if ent.label_ in ("GPE", "LOC", "FAC"):
                        match = self._match_gazetteer(ent.text)
                        if match:
                            name = match[0]
                            break
                if not name:
                    text_match = self._match_gazetteer(text)
                    if text_match:
                        name = text_match[0]

            return {
                "text": user_location_name or text[:60],
                "name": name or "GPS Recorded Location",
                "coordinates": final_coords,
                "source": "gps",
                "resolved": True
            }

        # 2. Text-based location extraction using spaCy NER + Gazetteer
        doc = self.nlp(text)
        extracted_entities = []
        for ent in doc.ents:
            if ent.label_ in ("GPE", "LOC", "FAC"):
                extracted_entities.append(ent.text)
                match = self._match_gazetteer(ent.text)
                if match:
                    canonical_name, coords = match
                    return {
                        "text": ent.text,
                        "name": canonical_name,
                        "coordinates": coords,
                        "source": "extracted",
                        "resolved": True
                    }

        # Fallback 2b: direct search in gazetteer against full text in case NER missed informal coastal phrasing
        text_match = self._match_gazetteer(text)
        if text_match:
            canonical_name, coords = text_match
            return {
                "text": canonical_name,
                "name": canonical_name,
                "coordinates": coords,
                "source": "extracted",
                "resolved": True
            }

        # 3. Unresolved: Do NOT invent coordinates
        return {
            "text": extracted_entities[0] if extracted_entities else None,
            "name": None,
            "coordinates": None,
            "source": "unresolved",
            "resolved": False
        }
