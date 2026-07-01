import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { authRouter } from "./routes/authRoutes";
import { diagnosticoRouter } from "./routes/diagnosticoRoutes";
import { planoIdealRouter } from "./routes/planoIdealRoutes";

const app = express();

app.use(helmet());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "https://planejamento-financeiro-1.vercel.app",
  process.env.ALLOWED_ORIGIN,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("[CORS] Origem bloqueada:", origin);
      return callback(new Error("Origem não permitida pelo CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Backend Synapta",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "alive" });
});

app.use("/api/auth", authRouter);
app.use("/api/user/diagnostico", diagnosticoRouter);
app.use("/api/plano-ideal", planoIdealRouter);

export default app;