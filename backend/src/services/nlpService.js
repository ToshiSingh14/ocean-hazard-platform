const axios = require('axios');
const { NLP_SERVICE_URL } = require('../config/env');

async function analyzeText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Text is required for NLP analysis');
  }

  try {
    const response = await axios.post(
      `${NLP_SERVICE_URL}/analyze`,
      { text: text.trim() },
      { timeout: 10000 }
    );

    return response.data;
  } catch (error) {
    const message = error.response
      ? `NLP service returned status ${error.response.status}`
      : `NLP service unavailable: ${error.message}`;

    const serviceError = new Error(message);
    serviceError.statusCode = 502;
    throw serviceError;
  }
}

module.exports = { analyzeText };
