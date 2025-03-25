class CustomError extends Error {
  constructor(message, statusCode = 500, name = "CustomError") {
    super(message);
    this.statusCode = statusCode;
    this.name = name;
  }
}

module.exports = CustomError;
