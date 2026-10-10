const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

// Configure global Mongoose query options
mongoose.set('strictQuery', true);

// Set up connection event listeners for logging and observability
mongoose.connection.on('connected', () => {
  console.log(`[MongoDB] Connected successfully to host: ${mongoose.connection.host}, database: ${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

/**
 * Connects to MongoDB with error handling.
 * @param {string} [uri] - Optional connection URI override
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async (uri = MONGO_URI) => {
  try {
    if (!uri) {
      throw new Error('Database URI is not defined. Please check your MONGO_URI environment variable.');
    }

    console.log('[MongoDB] Initiating connection...');
    const conn = await mongoose.connect(uri);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Failed to connect: ${error.message}`);
    throw error;
  }
};

/**
 * Gracefully disconnects from MongoDB.
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[MongoDB] Connection closed.');
  } catch (error) {
    console.error(`[MongoDB] Error during disconnect: ${error.message}`);
    throw error;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  connection: mongoose.connection
};
