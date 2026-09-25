import { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service.js";
import { exportProject } from "../services/export.service.js";

export async function exportProjectHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await exportProject(req.params.id);

    if (!result.ok) {
      const status =
        result.reason === "not-found"
          ? 404
          : result.reason === "empty"
            ? 409
            : 413;
      res.status(status).json({ error: result.message, message: result.message });
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
    res.setHeader("Content-Length", String(result.zip.length));
    res.setHeader("X-Forge-Files", String(result.fileCount));
    res.setHeader("X-Forge-Skipped", String(result.skipped));
    res.status(200).send(result.zip);
  } catch (error) {
    next(error);
  }
}

export async function createProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

export async function listProjectsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projects = await projectService.listProjects();
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
}

export async function getProjectHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

export async function updateProjectHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

export async function addMessageHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const message = await projectService.addMessage(req.params.id, req.body);
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await projectService.deleteProject(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
