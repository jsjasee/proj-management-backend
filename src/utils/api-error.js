class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
  ) {
    super(message); // this is like calling the constructor of the parent class so they know what 'this' is referring to? and also the parent class expects a message argument so we pass in the message
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    // stack is not always available
    if (stack) {
      this.stack = stack;
    } else {
      // generates a constructor and feeds it to our stack trace
      Error.captureStackTrace(this, this.constructor); // not sure what this does? ig 'this' just provides the context?
    }
  }
}

// what's a stack?
// use super() IN the constructor class NOT outside of the constructor!

export { ApiError };
