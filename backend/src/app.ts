import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/authRoutes";
import { diagnosticoRouter } from "./routes/diagnosticoRoutes";
import { planoIdealRouter } from "./routes/planoIdealRoutes";

const app = express();

// 1. Diretrizes de Segurança: Aplicação rigorosa de proteção de Headers HTTPS
app.use(helmet());
app.use(cookieParser());

// 2. Diretrizes de Segurança: Limitar chamadas apenas à origem que nós conhecemos
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

// 3. Diretrizes de Segurança: Limitar tamanho do body JSON para previnir DoS (JSON Bomb)
app.use(express.json({ limit: "10kb" }));

// 4. Montar Rotas (Isolamento Arquitetural)
app.use("/api/auth", authRouter);
app.use("/api/user/diagnostico", diagnosticoRouter);
app.use("/api/plano-ideal", planoIdealRouter);
app.use("/api/plano-ideal", planoIdealRouter);

// Rota fallback genérica de checagem
app.get("/health", (req, res) => {
  res.json({ status: "alive" });
});

export default app;
