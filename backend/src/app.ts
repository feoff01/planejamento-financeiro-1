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

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

// Rotas de teste
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Backend Synapta",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "alive" });
});

// Rotas principais
app.use("/api/auth", authRouter);
app.use("/api/user/diagnostico", diagnosticoRouter);
app.use("/api/plano-ideal", planoIdealRouter);

export default app;