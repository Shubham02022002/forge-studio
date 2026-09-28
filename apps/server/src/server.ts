import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./config/db.js";
import {
  ALLOWED_ORIGINS,
  IS_PRODUCTION,
  TRUST_PROXY,
} from "./config/runtime.js";
import { requireSameOrigin } from "./middleware/same-origin.middleware.js";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import voiceRoutes from "./routes/voice.routes.js";

if (!IS_PRODUCTION) {
  dotenv.config({ override: true, quiet: true });
}

const app: Express = express();
const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 5000);

app.set("trust proxy", TRUST_PROXY);

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    exposedHeaders: ["Content-Disposition", "X-Forge-Files", "X-Forge-Skipped"],
  }),
);
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

app.use("/api", requireSameOrigin);

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
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/voice", voiceRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const server = app.listen(PORT, () => {
  console.log(
    `[Forge Studio] Server listening on port ${PORT} in ${IS_PRODUCTION ? "production" : "development"} mode`,
  );
  console.log(`[Forge Studio] Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});

const SHUTDOWN_GRACE_MS = 250;
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function shutdown(signal: string): Promise<void> {
  console.log(`[Forge Studio] ${signal} received, shutting down.`);

  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();

  server.close();
  server.closeAllConnections();

  await new Promise((resolve) => setTimeout(resolve, SHUTDOWN_GRACE_MS));
  await prisma.$disconnect();

  process.exit(0);
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}
