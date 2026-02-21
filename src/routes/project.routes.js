// the boilerplate for routes is the same
import { Router } from "express";
import {
  addMembersToProject,
  createProject,
  getProjects,
  getProjectById,
  updateMemberRole,
  updateProject,
  getProjectMembers,
  deleteMember,
  deleteProject,
} from "../controllers/project.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  createProjectValidator,
  addMemberToProjectValidator,
} from "../validators/index.js";
import {
  verifyJWT,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router(); // there's no need to write 'new' keyword for Router() even though you can, express.js will auto create and return a new function when Router() is written. don't need to use 'new' to set up the context for 'this'

// .use() is like a middleware, we pass in verifyJWT means all the routes in this file will have a verifyJWT AS THE FIRST middleware
router.use(verifyJWT);

router
  .route("/")
  .get(getProjects)
  .post(createProjectValidator(), validate, createProject); // validate will access the errors in the req.body

router
  .route("/:projectId") // make sure this projectId matches whatever you are catching in the req.params
  .get(validateProjectPermission(AvailableUserRole), getProjectById) // handle the GET request. we pass in the ENTIRE AvailableUserRole array which means EVERYONE can perform access route
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    createProjectValidator(),
    validate,
    updateProject,
  )
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProject);

router
  .route("/:projectId/members") // if no ":" express does NOT treat it as a param, : means it gets treated as a param, members is not treated like a param here
  .get(getProjectMembers)
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    addMemberToProjectValidator(),
    validate,
    addMembersToProject,
  );

router
  .route("/:projectId/members/:userId")
  .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateMemberRole)
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteMember);

export default router;
