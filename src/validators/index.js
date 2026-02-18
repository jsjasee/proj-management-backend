import { body } from "express-validator"; // right now our data is coming from the body of the request so we import the body?

const userRegisterValidator = () => {
  // validate the fields? then run methods on it aka the validators!
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required") // error tied to the notEmpty if that field is empty
      .isEmail()
      .withMessage("Email is invalid."),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be lowercase")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),

    body("password").trim().notEmpty().withMessage("Please enter a password"),

    body("fullName")
      .optional() // since this field is optional, we only want to trim the field if it is there
      .trim(),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").isEmail().withMessage("Email is invalid"),

    body("password").notEmpty().withMessage("Password is required"),
  ];
};

export { userRegisterValidator, userLoginValidator };
