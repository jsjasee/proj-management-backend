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
    createTaskValidator(),
    upload.array("attachments", 5), // field name must match your frontend form-data key
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
