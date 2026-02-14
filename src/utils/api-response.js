class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    // anytime you create a class, the constructor() function runs automatically
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400; // anything above 400 is an error!
  }
}

export { ApiResponse };
