const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/);
  const message = `Duplicate field value: ${value}. Please replace with another value`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid credential! Please login again', 401);

const handleJWTExpireError = () =>
  new AppError('Token expired! Please login again', 401);

const sendErrorProd = (err, req, res) => {
  // Operational error, trusted error: send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Programming error, unknown error: don't leak error details
    // Log error details
    console.error('Error:', err);

    // send general message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
  if (err.isOperational) {
    // Operational error, trusted error: send message to client
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // Programming error, unknown error: don't leak error details
  // Log error details
  console.error('Error:', err);

  // send general message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later!',
  });
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  console.log(err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateErrorDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    if (error.name === 'TokenExpiredError') error = handleJWTExpireError();

    sendErrorProd(err, req, res);
  } else if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  }
};
