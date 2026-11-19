import sys
import os
sys.path.insert(0, os.path.abspath('nlp-service'))

import spacy
from app.services.classifier import HazardClassifier
from app.services.location_extractor import LocationExtractor

nlp = spacy.load('en_core_web_sm')
clf = HazardClassifier(nlp)
loc = LocationExtractor(nlp)

print("=================================================================")
print("           NLP HARDENING & EDGE CASE AUDIT SUITE                 ")
print("=================================================================")

# Test 1: Variations, spelling mistakes, short text, mixed keywords, unrelated text
test_cases = [
    # Short descriptions
    ("Short 1", "Huge waves", "abnormal_waves"),
    ("Short 2", "Erosion here", "coastal_erosion"),
    ("Short 3", "Boat sank", "marine_incident"),
    
    # Minor typos / spelling variations
    ("Typo 1", "Massive roque wave crashing into shore", "abnormal_waves"),
    ("Typo 2", "Costal erozion breaking sea-wall", "coastal_erosion"),
    ("Typo 3", "Trawler capsize in deap sea", "marine_incident"),
    
    # Paraphrased / alternate phrasing
    ("Paraphrase 1", "Tidal water has completely submerged the beachfront market and pathways", "coastal_flooding"),
    ("Paraphrase 2", "Approaching super cyclone pushing enormous ocean wall of water inland", "storm_surge"),
    ("Paraphrase 3", "The sandy bluff has slid into the ocean and the concrete embankment is falling", "coastal_erosion"),
    
    # Multi-keyword / compound hazard (flooding caused by waves)
    ("Multi-keyword 1", "High tidal waves caused severe coastal flooding in coastal streets", ["coastal_flooding", "abnormal_waves"]),
    ("Multi-keyword 2", "Cyclonic storm surge damaged fishing boats and inundated beachfront", ["storm_surge", "marine_incident", "coastal_flooding"]),
    
    # Unrelated / benign descriptions
    ("Unrelated 1", "Bought fresh fish from the local market stall", "other"),
    ("Unrelated 2", "Enjoying the sunset and having tea with family", "other"),
    ("Unrelated 3", "Traffic jam on the highway near the hotel", "other"),
    
    # Extreme edge cases
    ("Single word", "Help", "other"),
    ("Punctuation / Gibberish", "!@#$ %^&* ???", "other"),
    ("Empty whitespace", "    ", "other")
]

passed_count = 0
for tag, text, expected in test_cases:
    c = clf.classify(text)
    s = clf.assess_severity(text, c['category'])
    
    if isinstance(expected, list):
        matched = c['category'] in expected or any(sec in expected for sec in c['secondary_categories'])
    else:
        matched = (c['category'] == expected)
        
    status = "PASS" if matched else "FAIL"
    if matched:
        passed_count += 1
    
    print(f"[{status}] {tag}: '{text[:45]}'")
    print(f"       -> Got: {c['category']} (conf: {c['confidence']}), Sev: {s['level']}, Uncertain: {c['is_uncertain']}")
    if not matched:
        print(f"       !! Expected: {expected}")

print(f"\nAudit 1 Results: {passed_count}/{len(test_cases)} tests passed.\n")

print("=================================================================")
print("           LOCATION EXTRACTION HARDENING AUDIT                   ")
print("=================================================================")

loc_tests = [
    # 1. GPS priority over conflicting text
    {
        "name": "GPS Priority (Puri in text, Mumbai coords in GPS)",
        "text": "Huge waves observed near Puri beach",
        "coords": [72.8777, 19.0760],
        "expected_coords": [72.8777, 19.0760],
        "expected_source": "gps",
        "expected_resolved": True
    },
    # 2. Reverse order [lat, lng] normalization
    {
        "name": "Reverse Coords [lat, lng] Auto-Standardization",
        "text": "Report from coast",
        "coords": [19.0760, 72.8777], # sent as [lat, lng]
        "expected_coords": [72.8777, 19.0760],
        "expected_source": "gps",
        "expected_resolved": True
    },
    # 3. Text NER + Gazetteer (Paradip)
    {
        "name": "NER Gazetteer: Paradip",
        "text": "Severe waterlogging near Paradip port area",
        "coords": None,
        "expected_coords": [86.6085, 20.3165],
        "expected_source": "extracted",
        "expected_resolved": True
    },
    # 4. Text NER + Gazetteer alias (Marina beach -> Chennai)
    {
        "name": "NER Gazetteer Alias: Marina beach -> Chennai",
        "text": "High swells witnessed across marina beach promenade",
        "coords": None,
        "expected_coords": [80.2707, 13.0827],
        "expected_source": "extracted",
        "expected_resolved": True
    },
    # 5. Missing / Unknown location - Never invent coords
    {
        "name": "Unknown / Unresolved location",
        "text": "Seawater entered my living room this morning",
        "coords": None,
        "expected_coords": None,
        "expected_source": "unresolved",
        "expected_resolved": False
    },
    # 6. Completely invalid coordinates
    {
        "name": "Invalid coordinates format",
        "text": "Flooding observed",
        "coords": "not_an_array",
        "expected_coords": None,
        "expected_source": "unresolved",
        "expected_resolved": False
    }
]

loc_passed = 0
for lt in loc_tests:
    res = loc.extract_location(lt["text"], user_coords=lt["coords"] if isinstance(lt["coords"], list) else None)
    
    coords_match = (res["coordinates"] == lt["expected_coords"])
    source_match = (res["source"] == lt["expected_source"])
    resolved_match = (res["resolved"] == lt["expected_resolved"])
    
    ok = coords_match and source_match and resolved_match
    status = "PASS" if ok else "FAIL"
    if ok:
        loc_passed += 1
    print(f"[{status}] {lt['name']}")
    print(f"       -> Coords: {res['coordinates']}, Source: {res['source']}, Resolved: {res['resolved']}")
    if not ok:
        print(f"       !! Expected: Coords={lt['expected_coords']}, Source={lt['expected_source']}")

print(f"\nAudit 2 Results: {loc_passed}/{len(loc_tests)} location tests passed.\n")
