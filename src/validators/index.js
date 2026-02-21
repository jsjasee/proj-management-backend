import { body } from "express-validator"; // right now our data is coming from the body of the request so we import the body?
import { AvailableUserRole } from "../utils/constants.js";

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

const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword")
      .notEmpty() // compulsory field
      .withMessage("Old password is required"),
    body("newPassword")
      .notEmpty() // compulsory field
      .withMessage("New password is required"),
  ];
};

const userForgotPasswordValidator = () => {
  return [
    body("email") // when user forgots their password they will only provide us the email
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};

const userResetForgotPasswordValidator = () => {
  return [body("newPassword").notEmpty().withMessage("Password is required")];
};

const createProjectValidator = () => {
  return [
    body("name").notEmpty().withMessage("Name is required"),

    body("description").optional(),
  ];
};

const addMemberToProjectValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),

    body("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(AvailableUserRole) // checks if something is in an array or not
      .withMessage("Role is invalid"),
  ];
};

export {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
  createProjectValidator,
  addMemberToProjectValidator,
};
