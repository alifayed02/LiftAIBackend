import http from 'http';
import app from './src/app.js';

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down...`);
  server.close((err) => {
    if (err) {
      console.error('Error during server close', err);
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Catch unhandled errors (optional but helpful)
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // best effort shutdown
  shutdown('uncaughtException');
});