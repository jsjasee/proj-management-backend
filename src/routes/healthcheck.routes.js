import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controller.js";

// again the 'routes' in the file name is just a reference, can also name it as healthcheck.js

const router = Router();

// we want to have a GET method on this route and the healthcheck is serving your route here.
// controller will provide the logic to tell routes what to do.
// the '/' is obtained from the Project Requirement Document?? the "/" is for the routes file but the "/api/v1/healthcheck/"
router.route("/").get(healthcheck); // this is the home route with just the "/"
// you can have a instagram route, add more routes HERE, NOT in app.js
// router.route("/instagram").get(healthcheck);

export default router; // need to export the router object with the routes defined, not an empty Router() object!! export default Router() is WRONG!
