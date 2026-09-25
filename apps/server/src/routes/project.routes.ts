import { Router } from "express";
import {
  createMessageSchema,
  createProjectSchema,
  projectIdParamSchema,
  updateProjectSchema,
} from "../types/project.schema.js";
import { validate, validateParams } from "../middleware/validate.middleware.js";
import {
  createProjectHandler,
  listProjectsHandler,
  addMessageHandler,
  deleteProjectHandler,
  getProjectHandler,
  updateProjectHandler,
  exportProjectHandler,
} from "../controllers/project.controller.js";

const router = Router();

router.post("/", validate(createProjectSchema), createProjectHandler);
router.get("/", listProjectsHandler);

router.get("/:id", validateParams(projectIdParamSchema), getProjectHandler);
router.get(
  "/:id/export",
  validateParams(projectIdParamSchema),
  exportProjectHandler,
);
router.patch(
  "/:id",
  validateParams(projectIdParamSchema),
  validate(updateProjectSchema),
  updateProjectHandler,
);
router.delete(
  "/:id",
  validateParams(projectIdParamSchema),
  deleteProjectHandler,
);
router.post(
  "/:id/messages",
  validateParams(projectIdParamSchema),
  validate(createMessageSchema),
  addMessageHandler,
);

export default router;
