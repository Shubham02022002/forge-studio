import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./config/db.js";
import aiRoutes from "./routes/ai.routes.js";
import projectRoutes from "./routes/project.routes.js";
import voiceRoutes from "./routes/voice.routes.js";

dotenv.config({ override: true, quiet: true });

const app: Express = express();
const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 5000);

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    exposedHeaders: ["Content-Disposition", "X-Forge-Files", "X-Forge-Skipped"],
  }),
);
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      message: "Forge Studio Backend is healthy and database is connected.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.use("/api/ai", aiRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/voice", voiceRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`[Forge Studio] Server running on http://localhost:${PORT}`);
});
