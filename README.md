# Ocean Hazard Reporting & Coastal Incident Intelligence Platform

> A centralized platform for collecting, processing, correlating, and visualizing coastal hazard reports as meaningful incident-level information.

## 📌 Overview

The **Ocean Hazard Reporting & Coastal Incident Intelligence Platform** is a full-stack prototype designed to organize fragmented coastal hazard reports from citizens and simulated social-media-style sources.

Multiple reports may describe the same real-world coastal event using different wording, locations, and reporting times. The platform processes these reports and consolidates related reports into a single **incident record**.

Each incident provides a centralized view of:

* Hazard type
* Location
* Severity
* Confidence
* Number of related reports
* Reporting time range
* Associated reports
* Spatial and temporal activity

The resulting information is presented through an interactive dashboard with maps, filters, charts, hotspot analysis, and timeline visualization.

---

## 🎯 Objective

The primary objective is to transform scattered and unstructured coastal hazard reports into structured, consolidated, and useful incident-level information.

The platform aims to:

1. Collect citizen and simulated social-media-style hazard reports.
2. Process report text and location information.
3. Classify reports into predefined coastal hazard categories.
4. Detect duplicate or related reports.
5. Group related reports into common incidents.
6. Assign severity and confidence scores.
7. Analyze the spatial distribution of incidents.
8. Identify potential coastal hotspots.
9. Visualize incident activity over time.
10. Provide a centralized interactive dashboard.

---

## ✨ Key Features

### 1. Citizen Hazard Reporting

Users can submit coastal hazard reports containing:

* Description
* Location
* Date and time
* Hazard information
* Optional supporting image

### 2. Hazard Classification

Reports are classified into predefined categories:

* Abnormal / High Waves
* Storm Surge
* Coastal Flooding
* Coastal Erosion
* Marine Incident
* Other Ocean Hazards

### 3. Location Extraction

The platform supports location information obtained through:

* Map-selected coordinates
* GPS information where available
* Location information extracted from report text

### 4. Related Report Detection

Reports are compared using multiple factors:

* Text similarity
* Geographical distance
* Time difference
* Hazard category

These factors are combined into a predefined **relatedness score** to determine whether reports may describe the same or related event.

### 5. Incident Grouping

Related reports are consolidated into a common incident.

An incident can contain:

* Associated reports
* Location
* Hazard category
* Report count
* Time range

### 6. Severity Scoring

Each incident receives a rule-based severity level:

| Level    | Description                          |
| -------- | ------------------------------------ |
| Low      | Low-impact reported hazard           |
| Medium   | Moderate reported impact             |
| High     | Significant hazard activity          |
| Critical | Extremely serious reported situation |

Severity is determined using factors such as hazard type, reported impact, keywords, and the number of related reports.

### 7. Confidence Scoring

A separate confidence score represents the system's confidence in:

* Hazard classification
* Location analysis
* Incident correlation

### 8. Interactive Geospatial Map

The platform uses **Leaflet** and **OpenStreetMap** to visualize:

* Reports
* Incidents
* Locations
* Concentrated activity areas

### 9. Hotspot Analysis

Areas containing a high concentration of reports or incidents can be identified as potential coastal hotspots using defined spatial thresholds.

### 10. Timeline Analysis

Incident and report activity can be analyzed over time to understand how reported events develop.

### 11. Interactive Dashboard

The dashboard provides a centralized interface containing:

* Incident information
* Interactive maps
* Statistics
* Charts
* Filters
* Hotspot visualization
* Timeline analysis

---

## 🏗️ System Architecture

The platform follows an end-to-end processing pipeline:

```text
                    ┌─────────────────────────┐
                    │   Citizen Reporting     │
                    │        Interface        │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       REST APIs          │
                    │    Node.js / Express     │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │        MongoDB           │
                    │   Reports & Incidents    │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Python NLP Service   │
                    │  Classification / NLP    │
                    └────────────┬────────────┘
                                 │
                                 ▼
              ┌─────────────────────────────────────┐
              │      Report Correlation Engine      │
              │                                     │
              │  • Text Similarity                  │
              │  • Geographic Distance              │
              │  • Time Difference                  │
              │  • Hazard Category                  │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    Incident Grouping    │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Severity & Confidence   │
                    │        Scoring           │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     React Dashboard     │
                    │                         │
                    │ • Map                   │
                    │ • Charts                │
                    │ • Filters               │
                    │ • Hotspots              │
                    │ • Timeline              │
                    └─────────────────────────┘
```

---

## 🔄 Data Processing Workflow

```text
Report Submission
       ↓
Data Ingestion
       ↓
Report Storage
       ↓
NLP Processing
       ↓
Hazard Classification
       ↓
Location Extraction
       ↓
Report Structuring
       ↓
Duplicate / Related Report Detection
       ↓
Incident Grouping
       ↓
Severity & Confidence Scoring
       ↓
Geospatial Analysis
       ↓
Hotspot & Timeline Analysis
       ↓
Interactive Dashboard
```

---

## 🛠️ Technology Stack

| Category      | Technology          |
| ------------- | ------------------- |
| Frontend      | React.js            |
| Backend       | Node.js             |
| API Framework | Express.js          |
| Database      | MongoDB             |
| NLP / AI      | Python              |
| NLP Libraries | Scikit-learn, spaCy |
| Mapping       | Leaflet             |
| Map Data      | OpenStreetMap       |
| Communication | REST APIs           |

---

## 📂 Project Structure

The exact folder structure may vary depending on the implementation. A recommended structure is:

```text
ocean-hazard-platform/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   └── package.json
│
├── nlp-service/
│   ├── services/
│   ├── models/
│   ├── requirements.txt
│   └── ...
│
├── dataset/
│   └── sample-coastal-reports/
│
├── docs/
│
├── .gitignore
└── README.md
```

> **Note:** Update this section if the actual repository structure differs.

---

## ⚙️ Prerequisites

Before running the project, make sure the following are installed:

* **Node.js**
* **npm**
* **MongoDB**
* **Python 3.x**
* **Git**

The NLP service requires the Python dependencies used by the implemented NLP functionality, including libraries such as:

* Scikit-learn
* spaCy

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies

```bash
cd ../backend
npm install
```

### 4. Set Up the NLP Service

```bash
cd ../nlp-service
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Activate it on Linux/macOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 🔐 Environment Variables

Create the required `.env` files according to the backend/frontend implementation.

Example backend configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ocean_hazard
```

If additional environment variables are required by the implementation, add them to the appropriate `.env` file.

> **Important:** Never commit `.env` files containing passwords, API keys, tokens, or other secrets.

---

## 🗄️ Database

The project uses **MongoDB** for storing coastal hazard reports and related incident information.

A report may contain information such as:

```text
Report ID
Description
Latitude
Longitude
Timestamp
Source
Hazard Type
```

The database is also used for location-based queries and geospatial analysis.

---

## 🔌 API Communication

The frontend communicates with the Node.js/Express backend through REST APIs.

The backend is responsible for:

* Receiving reports
* Validating request data
* Storing reports
* Retrieving reports
* Communicating with processing services
* Providing incident information to the frontend

> Add the actual API endpoint table here as endpoints are finalized.

### Example API Documentation Format

| Method | Endpoint             | Purpose                      |
| ------ | -------------------- | ---------------------------- |
| `POST` | `/api/reports`       | Submit a hazard report       |
| `GET`  | `/api/reports`       | Retrieve reports             |
| `GET`  | `/api/incidents`     | Retrieve incidents           |
| `GET`  | `/api/incidents/:id` | Retrieve a specific incident |

> **Note:** The endpoints above are documentation placeholders and should be updated to match the actual implemented routes.

---

## 🧠 NLP & Incident Intelligence

The NLP component processes the textual content of hazard reports.

The current prototype uses predefined hazard categories and NLP/text-processing techniques.

The processing pipeline may include:

```text
Raw Report
    ↓
Text Processing
    ↓
Hazard Classification
    ↓
Location Extraction
    ↓
Structured Report
    ↓
Similarity Analysis
```

### Relatedness Calculation

Reports are evaluated using multiple similarity factors:

```text
Text Similarity
       +
Geographical Proximity
       +
Time Difference
       +
Hazard Category
       ↓
Relatedness Score
       ↓
Related / Duplicate Reports
```

Related reports are then grouped into a common incident.

---

## 🗺️ Geospatial Analysis

The platform uses MongoDB's geospatial capabilities for location-based operations.

**Leaflet** and **OpenStreetMap** are used to visualize geographic information.

The map can be used to:

* View reported hazards
* View consolidated incidents
* Identify concentrated activity
* Explore incident locations

---

## 📊 Hotspot & Timeline Analysis

### Hotspot Analysis

Areas with a high concentration of reports or incidents are identified as potential hotspots using predefined spatial thresholds.

### Timeline Analysis

Report and incident activity is analyzed over time to visualize:

* When reports were submitted
* How incident activity changes
* The time range of related reports
* Development of reported incidents

---

## 🖥️ Dashboard

The React-based dashboard provides a centralized view of the processed information.

The dashboard is intended to provide:

```text
┌───────────────────────────────────────────────┐
│              INCIDENT DASHBOARD               │
├───────────────────────────────────────────────┤
│                                               │
│  Statistics        Filters       Hazard Type  │
│                                               │
├───────────────────────────┬───────────────────┤
│                           │                   │
│                           │   Incident Info   │
│        MAP                │                   │
│                           │   Severity        │
│                           │   Confidence      │
│                           │   Reports         │
│                           │                   │
├───────────────────────────┴───────────────────┤
│              Timeline / Charts                │
└───────────────────────────────────────────────┘
```

---

## 📈 Development Phases

The project is planned across three major phases.

### Phase 1 — Basic Platform & Data Pipeline

Deliverables:

* React frontend
* Node.js/Express backend
* MongoDB setup
* Citizen report submission
* REST APIs
* Report storage and retrieval
* Basic dashboard
* Basic map

### Phase 2 — NLP & Incident Intelligence

Deliverables:

* Hazard classification
* Location extraction
* Structured reports
* Related/duplicate report detection
* Incident grouping
* Severity scoring
* Confidence scoring

### Phase 3 — Analytics & Complete System

Deliverables:

* Interactive geospatial dashboard
* Hotspot analysis
* Timeline analysis
* Charts
* Filters
* Incident statistics
* Testing
* Error handling
* Deployment
* Finalized authentication/moderation if implemented

---

## 📸 Screenshots

Add project screenshots here as the UI is completed.

### Dashboard

```text
[ Add Dashboard Screenshot Here ]
```

### Hazard Reporting

```text
[ Add Reporting Interface Screenshot Here ]
```

### Interactive Map

```text
[ Add Map Screenshot Here ]
```

### Incident Details

```text
[ Add Incident Details Screenshot Here ]
```

---

## 🧪 Testing

Testing will cover the major components of the platform, including:

* Report submission
* API request/response handling
* Database operations
* Hazard classification
* Location extraction
* Related-report detection
* Incident grouping
* Severity scoring
* Confidence scoring
* Geospatial operations
* Dashboard functionality
* Error handling

---

## 🔒 Scope & Limitations

The current prototype does **not** include:

* Live ingestion from social-media platforms
* Automated image-based hazard detection
* Real-time push notifications
* Satellite data integration
* Weather data-feed integration
* Advanced machine-learning models for classification/scoring
* Predictive hazard analysis

Images may be attached as supporting evidence, but automated image analysis is outside the current prototype scope.

These capabilities may be considered as future extensions.

---

## 🔮 Future Scope

Potential future improvements include:

* Live social-media data ingestion
* Automated image-based hazard detection
* Integration with satellite imagery
* Weather and environmental data integration
* Advanced machine-learning models
* Predictive hazard analysis
* Real-time notifications
* Improved location intelligence
* More advanced incident correlation
* Production-scale deployment

---

## 👥 Team Members

| Name              | Role                 |
| ----------------- | -------------------- |
| **Kartik Gupta**  | Backend & Database   |
| **Kesar Agrawal** | NLP / AI             |
| **Tanya Agrawal** | Frontend & UI        |
| **Toshi Singh**   | Geospatial Analytics |

---

## 👨‍🏫 Project Supervisor

**Mr. Ankit Gaur**
Assistant Professor
CEA Department

---

## 📚 Resources & References

### Technical References

* React — Official Documentation
* Express.js — Official Documentation
* Node.js — Official Documentation
* MongoDB — Official Documentation
* Scikit-learn — Official Documentation
* spaCy — Official Documentation
* Leaflet — Official Documentation
* OpenStreetMap

### Research / Domain References

1. Singh, J. P., Dwivedi, Y. K., Rana, N. P., Kumar, A., & Kapoor, K. K. (2019). *Event classification and location prediction from tweets during disasters*. Annals of Operations Research, 283, 737–757.

2. *Similarity-based emergency event detection in social media*. (2021). Journal of Safety Science and Resilience, 2(1), 11–19.

3. *Online indexing and clustering of social media data for emergency management*. (2015). Neurocomputing.

4. *When a disaster happens, we are ready: Location mention recognition from crisis tweets*. (2022). International Journal of Disaster Risk Reduction, 78, 103107.

5. *Examining Community Vulnerabilities through multi-scale geospatial analysis of social media activity during Hurricane Irma*. (2022). International Journal of Disaster Risk Reduction, 68, 102701.

---

## 📋 Expected Outcome

The final prototype is expected to:

1. Accept citizen and simulated social-media-style coastal hazard reports.
2. Convert unstructured reports into structured records.
3. Consolidate related reports into incident records.
4. Assign severity and confidence information.
5. Display incidents and locations on an interactive map.
6. Identify potential coastal hotspots.
7. Visualize incident activity over time.
8. Provide a centralized dashboard for analyzing coastal incidents.

---

## 📄 Project Information

**Project:** Ocean Hazard Reporting & Coastal Incident Intelligence Platform

**Type:** Mini Project / Academic Prototype

**Primary Technologies:** React.js, Node.js, Express.js, MongoDB, Python, Scikit-learn, spaCy, Leaflet, OpenStreetMap

**Status:** 🚧 Under Development

---

## ⭐ Acknowledgement

This project is developed as an academic prototype to demonstrate how fragmented coastal hazard reports can be transformed into structured incident intelligence using NLP, report correlation, database technologies, and geospatial analysis.

---

## 📜 License

This project is developed for academic and educational purposes.

Add the appropriate license here if a formal open-source license is selected for the repository.
