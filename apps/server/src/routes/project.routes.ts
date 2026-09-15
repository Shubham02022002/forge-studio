import { Router } from "express";
import {
  createMessageSchema,
  projectIdParamSchema,
  updateProjectSchema,
} from "../types/project.schema.js";
import { validate, validateParams } from "../middleware/validate.middleware.js";
import {
  addMessageHandler,
  deleteProjectHandler,
  getProjectHandler,
  updateProjectHandler,
} from "../controllers/project.controller.js";

const router = Router();

router.get("/:id", validateParams(projectIdParamSchema), getProjectHandler);
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
