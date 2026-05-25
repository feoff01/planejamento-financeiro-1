import { Router } from "express";
import rateLimit from "express-rate-limit";
import { PlanoIdealController } from "../controllers/PlanoIdealController";
import { authMiddleware } from "../middlewares/authMiddleware";

const planoIdealRouter = Router();
const controller = new PlanoIdealController();

// Rate limit específico para simulações (processamento pesado de Monte Carlo)
const sim_limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máx. 5 submissões por IP por janela
  message: { error: "Muitas simulações geradas. Aguarde uma hora para tentar novamente." },
  standardHeaders: true,
  legacyHeaders: false,
});

// A rota principal sera POST /api/plano-ideal/generate.
// /api/plano-ideal/generate fica como alias temporario para compatibilidade.
planoIdealRouter.post(
  "/generate",
  sim_limiter,
  authMiddleware,
  (req, res) => controller.generate(req, res)
);

export { planoIdealRouter };
