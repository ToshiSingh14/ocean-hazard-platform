import sys
import os
sys.path.insert(0, os.path.abspath('nlp-service'))

import spacy
from app.services.classifier import HazardClassifier
from app.services.location_extractor import LocationExtractor

nlp = spacy.load('en_core_web_sm')
clf = HazardClassifier(nlp)
loc = LocationExtractor(nlp)

test_cases = [
    ("Abnormal waves", "Massive high waves and abnormal ocean swells breaking over Puri beach shore.", None),
    ("Storm surge", "Deep cyclonic depression causing severe storm surge and rising water in Paradip.", None),
    ("Coastal flooding", "Seawater breached embankments flooding streets and residential houses in Gopalpur.", None),
    ("Coastal erosion", "Severe coastal erosion collapsing concrete seawall and dunes near Visakhapatnam.", None),
    ("Marine incident", "Fishing boat capsized offshore near Chennai port two fishermen missing rescue operation.", None),
    ("Unclear/Other", "Just took a stroll around the marketplace and had coconut water.", None),
    ("GPS Priority", "Water entering houses near Puri, but user marked Mumbai GPS coordinates.", [72.8777, 19.0760])
]

print("=== Running NLP Unit Tests ===")
for label, text, coords in test_cases:
    c = clf.classify(text)
    s = clf.assess_severity(text, c['category'])
    l = loc.extract_location(text, user_coords=coords)
    print(f"[{label}]")
    print(f"  Input: {text}")
    print(f"  Predicted Category: {c['category']} ({c['label']}) | Conf: {c['confidence']}")
    print(f"  Severity: {s['level']} | Rationale: {s['rationale']}")
    print(f"  Location: {l['name']} | Coords: {l['coordinates']} | Source: {l['source']} | Resolved: {l['resolved']}")
    print("-" * 60)
