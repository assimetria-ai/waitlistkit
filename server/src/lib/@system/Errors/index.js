class AppError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.status = status
    this.name = 'AppError'
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error') {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

module.exports = { AppError, NotFoundError, ValidationError }
