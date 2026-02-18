// this file is reusable!
import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

// 1. express middleware expects req, res, next
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  // ask if to check the file for errors
  if (errors.isEmpty()) {
    return next(); // if there's NO errors, don't need do anything and proceed to the next step in the express middleware / request flow
  }
  const extractedErrors = [];
  errors.array().map((err) => {
    extractedErrors.push({
      [err.path]: err.msg, // what is the path?
    });
  });
  // convert into an array then loop through

  throw new ApiError(422, "Received data is not valid", extractedErrors); // then pass on the extracted errors.. do we need next(extractedErrors) here? or like for each of the error in extracted Errors, do the next(error)???

  // 2. validation (look at the index.js file in validators folder.)
};
