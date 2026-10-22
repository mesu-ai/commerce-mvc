import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { config } from "./config";
import { logger } from "./utils/logger";
import { errorHandler } from "./utils/errorHandler";
import router from "./routes";

// Create Express application
const app: Application = express();

// Enable CORS with credentials
app.use(cors({
  origin: "http://localhost:3010",
  credentials: true
}));

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/images", express.static(path.join(process.cwd(), "images")));

// Middleware for parsing cookies
app.use(cookieParser());

app.use(logger);

// Custom middleware

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use(config.apiPrefix, router);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
