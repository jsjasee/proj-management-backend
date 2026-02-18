// the boilerplate for routes is the same
import { Router } from "express";
import { registerUser, login } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userLoginValidator,
  userRegisterValidator,
} from "../validators/index.js";

const router = Router();

router.route("/register").post(userRegisterValidator(), validate, registerUser);
// this is the POST route using the functionality 'registerUser'
// we intercept the route to registerUser by running the validator before registerUser?? that means the moment the line is executed the function is run? or when i click execute the function will run???
// we DONT execute the validate here... it is the middleware?

// so we run userRegisterValidator() to collect the errors..? collect ot where? then validate is the middleware, which will process the collected errors..?? then finally the request reaches registerUser to do what it needs...
// but when writing the code, we write the middleware first then validation then the routes?

router.route("/login").post(userLoginValidator(), validate, login);

export default router;
