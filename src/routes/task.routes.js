// the boilerplate for routes is the same
import { Router } from "express";
import {
  createTask,
  createSubTask,
  updateTask,
  updateSubTask,
  deleteTask,
  deleteSubTask,
  getTaskById,
  getTasks,
} from "../controllers/task.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  createTaskValidator,
  createSubTaskValidator,
} from "../validators/index.js";
import {
  verifyJWT,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router();

// every single route must use verifyJWT
router.use(verifyJWT);

router
  .route("/:projectId")
  .get(getTasks)
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    upload.array("attachments", 5), // field name must match your frontend form-data key
    createTaskValidator(), // multer MUST run before validators because multipart/form-data requests leave req.body empty until multer parses them. express-validator reads from req.body, so it needs multer to populate it first. (the request comes in as multipart/form-data when you attach the file via postman, this is unreadable for express.js, so multer must parse it first, then populate request.body then express can read it.)
    validate,
    createTask,
  );

router
  .route("/:projectId/t/:taskId")
  .get(getTaskById)
  .put(
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    validate,
    updateTask,
  )
  .delete(
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    validate,
    deleteTask,
  );

router
  .route("/:projectId/t/:taskId/subtasks")
  .post(
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    createSubTaskValidator(),
    validate,
    createSubTask,
  );

router
  .route("/:projectId/st/:subtaskId")
  .put(
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    validate,
    updateSubTask,
  )
  .delete(
    validateProjectPermission([
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
    ]),
    validate,
    deleteSubTask,
  );

export default router;
