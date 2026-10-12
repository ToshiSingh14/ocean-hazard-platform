require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = require('./src/app');
const { PORT, NODE_ENV } = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');

let server;

async function startServer() {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`[Server] Running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  console.log(`\n[Server] ${signal} received. Shutting down...`);

  if (server) {
    server.close(async () => {
      try {
        await disconnectDB();
        process.exit(0);
      } catch (error) {
        console.error('[Server] Shutdown error:', error.message);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
