import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import healthRouter from "./routes/health.js";
import spacesRouter from "./routes/spaces.js";
import itemsRouter from "./routes/items.js";
import dashboardRouter from "./routes/dashboard.js";

export function createApp() {
  const app = express();

  const allowedOrigins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5174"
  ];

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/spaces", spacesRouter);
  app.use("/items", itemsRouter);
  app.use("/dashboard", dashboardRouter);

  return app;
}
