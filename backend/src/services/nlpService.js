const axios = require('axios');
const { NLP_SERVICE_URL } = require('../config/env');

/**
 * Fallback hazard classifier when Python NLP microservice is unreachable.
 * Uses transparent, deterministic rule-based heuristics so the backend never crashes.
 */
function fallbackClassification(text) {
  const t = (text || '').toLowerCase();

  let hazardType = 'other';
  let confidence = 0.50;
  let severity = 'low';
  let secondaryHazardTypes = [];

  if (t.includes('wave') || t.includes('swell') || t.includes('breaker') || t.includes('rough sea')) {
    hazardType = 'abnormal_waves';
    confidence = 0.70;
    severity = 'medium';
  } else if (t.includes('surge') || t.includes('cyclon') || t.includes('gale') || t.includes('depression')) {
    hazardType = 'storm_surge';
    confidence = 0.72;
    severity = 'high';
  } else if (t.includes('flood') || t.includes('inundat') || t.includes('overflow') || t.includes('waterlogg')) {
    hazardType = 'coastal_flooding';
    confidence = 0.72;
    severity = 'medium';
  } else if (t.includes('erosi') || t.includes('seawall') || t.includes('sea wall') || t.includes('collapse') || t.includes('wash away')) {
    hazardType = 'coastal_erosion';
    confidence = 0.70;
    severity = 'medium';
  } else if (t.includes('boat') || t.includes('trawler') || t.includes('vessel') || t.includes('capsize') || t.includes('oil spill') || t.includes('missing')) {
    hazardType = 'marine_incident';
    confidence = 0.75;
    severity = t.includes('missing') || t.includes('capsize') ? 'critical' : 'high';
  }

  // Critical impact escalations
  if (t.includes('evacuat') || t.includes('fatal') || t.includes('dead') || t.includes('emergency')) {
    severity = 'critical';
  }

  return {
    success: true,
    fallback: true,
    hazard_type: hazardType,
    hazard_label: hazardType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    confidence,
    severity,
    secondary_hazard_types: secondaryHazardTypes,
    location: {
      text: null,
      name: null,
      coordinates: null,
      source: 'unresolved',
      resolved: false
    },
    metadata: {
      fallback: true,
      service: 'Node.js Heuristic Fallback'
    }
  };
}

/**
 * Sends report text and optional coordinates to the Python FastAPI NLP microservice.
 * Gracefully falls back to heuristic scoring if the NLP service is offline or times out.
 *
 * @param {string} text - Report description text
 * @param {Object} [options] - Optional coordinates, locationName
 * @returns {Promise<Object>} Structured NLP analysis result
 */
async function analyzeText(text, options = {}) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Text is required for NLP analysis');
  }

  const payload = {
    text: text.trim(),
    coordinates: options.coordinates || null,
    locationName: options.locationName || null
  };

  try {
    const response = await axios.post(
      `${NLP_SERVICE_URL}/analyze`,
      payload,
      { timeout: 8000 }
    );

    return {
      ...response.data,
      fallback: false
    };
  } catch (error) {
    const reason = error.response
      ? `status ${error.response.status}`
      : error.code === 'ECONNREFUSED'
        ? 'connection refused'
        : error.message;

    console.warn(`[NLP Service Warning] ${NLP_SERVICE_URL} unavailable (${reason}). Utilizing graceful fallback.`);

    return fallbackClassification(text);
  }
}

/**
 * Check if the Python FastAPI NLP microservice is up and running.
 */
async function checkNlpHealth() {
  try {
    const res = await axios.get(`${NLP_SERVICE_URL}/health`, { timeout: 3000 });
    return res.data;
  } catch (err) {
    return {
      status: 'unavailable',
      error: err.message
    };
  }
}

module.exports = {
  analyzeText,
  fallbackClassification,
  checkNlpHealth
};
