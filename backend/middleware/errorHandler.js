function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  let statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  let message = statusCode < 500 ? error.message : 'An unexpected server error occurred';

  if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body must be valid JSON';
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  } else if (typeof error.code === 'string' && error.code.startsWith('SQLITE_CONSTRAINT')) {
    statusCode = error.code === 'SQLITE_CONSTRAINT_CHECK' ? 400 : 409;
    message = statusCode === 400
      ? 'Request violates data requirements'
      : 'A conflicting record already exists';
  }

  if (statusCode >= 500) {
    console.error(`Unhandled API error (${error.name || 'Error'})`);
  }

  return response.status(statusCode).json({
    status: 'error',
    message
  });
}

module.exports = { createHttpError, errorHandler };
