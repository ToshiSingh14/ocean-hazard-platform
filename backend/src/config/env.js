const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Validate and normalize configuration values
const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ocean_hazard_db';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

if (!process.env.MONGO_URI && NODE_ENV === 'production') {
  console.warn('[Config Warning] MONGO_URI is not set in environment. Falling back to local default.');
}

module.exports = {
  PORT,
  NODE_ENV,
  MONGO_URI,
  CLIENT_ORIGIN,
  NLP_SERVICE_URL
};
