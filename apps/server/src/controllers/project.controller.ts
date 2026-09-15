import { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service.js";

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
