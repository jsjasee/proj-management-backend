const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err)); // pass the error to express's in built error handling function??
    // diff between .resolve and .then?
    // what's the point of this handler even..?? so i don't have to write try catch?
  };
  // what is the 'next' for???
};

// this is a higher order function, in the input we are taking a function

export { asyncHandler };
