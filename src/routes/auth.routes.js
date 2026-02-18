// the boilerplate for routes is the same
import { Router } from "express";
import {
  registerUser,
  login,
  logoutUser,
  verifyEmail,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  getCurrentUser,
  changeCurrentPassword,
  resendEmailVerification,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userLoginValidator,
  userRegisterValidator,
  userResetForgotPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// UNSECURE routes (verifyJWT is NOT required)
router.route("/register").post(userRegisterValidator(), validate, registerUser);
// this is the POST route using the functionality 'registerUser'
// we intercept the route to registerUser by running the validator before registerUser?? that means the moment the line is executed the function is run? or when i click execute the function will run??? - the userRegisterValidator() execute immediately when code file loads and return an array of functions. req.body("some field").notEmpty() etc. IS a an obj - we are building up the validation pattern. think of it like a function ref.
// we DONT execute the validate here... it is the middleware? - yes

// so we run userRegisterValidator() to define the RULES. rules run on the request, errors are attached to request. then validate (the middleware) read and process the request. then finally the request reaches registerUser to do what it needs.
// but when writing the code, we write the middleware first then validation then the routes?

router.route("/login").post(userLoginValidator(), validate, login);

router.route("/verify-email/:verificationToken").get(verifyEmail); // we require the variable 'verificationToken' from the url params. this name 'verificationToken' is dependent on HOW THE URL is constructed (aka :verificationToken)

router.route("/refresh-token").get(refreshAccessToken);
router
  .route("/forgot-password")
  .get(userForgotPasswordValidator(), validate, forgotPasswordRequest); // the same pattern

router
  .route("/reset-password/:resetToken")
  .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);

// SECURE aka protected routes (all of these requires verifyJWT - aka user is loggedin)
router.route("/logout").post(verifyJWT, logoutUser); // we can only logout user who are logged in, we need a middleware here
router.route("/current-user").post(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword,
  );
router
  .route("/reset-email-verification")
  .post(verifyJWT, resendEmailVerification);

export default router;
