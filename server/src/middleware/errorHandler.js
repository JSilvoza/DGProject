'use strict';

/* eslint-disable no-unused-vars */
module.exports = function errorHandler(err, _req, res, _next) {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    console.error('[error]', err.stack || err.message);
  }

  res.status(status).json({ success: false, error: message });
};
