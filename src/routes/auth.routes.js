// the boilerplate for routes is the same
import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";

const router = Router();

router.route("/register").post(registerUser);
// this is the POST route using the functionality 'registerUser'

export default router;
