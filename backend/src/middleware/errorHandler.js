'use strict';

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  const message =
    isProd && status >= 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  const body = { error: err.name || 'Error', message, code: status };

  if (!isProd) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

module.exports = errorHandler;
