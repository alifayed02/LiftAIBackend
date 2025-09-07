/**
 * Wrap an async route handler so that any error is forwarded to Express's error handler.
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => {
    return function wrappedFn(req, res, next) {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
  