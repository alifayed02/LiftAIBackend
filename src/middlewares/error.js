/**
 * Centralized error handler for Express.
 * Must be the last middleware registered in app.js.
 */
export default function errorMiddleware(err, req, res, _next) {
    console.error(err); // You can replace with a proper logger
  
    // Use the status property if set, otherwise default to 500
    const statusCode = err.status || err.statusCode || 500;
  
    // Never leak stack traces in production
    const response = {
      error: err.message || 'Internal Server Error',
    };
  
    // Optionally include details in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      response.stack = err.stack;
      if (err.details) response.details = err.details;
    }
  
    res.status(statusCode).json(response);
  }
  