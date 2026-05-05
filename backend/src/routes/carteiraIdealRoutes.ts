import { Router } from "express";
import rateLimit from "express-rate-limit";
import { CarteiraIdealController } from "../controllers/CarteiraIdealController";
import { authMiddleware } from "../middlewares/authMiddleware";

const carteiraIdealRouter = Router();
const controller = new CarteiraIdealController();

// Rate limit específico para simulações (processamento pesado de Monte Carlo)
const sim_limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máx. 5 submissões por IP por janela
  message: { error: "Muitas simulações geradas. Aguarde uma hora para tentar novamente." },
  standardHeaders: true,
  legacyHeaders: false,
});

// A rota será POST /api/carteira-ideal/generate
carteiraIdealRouter.post(
  "/generate",
  sim_limiter,
  authMiddleware,
  (req, res) => controller.generate(req, res)
);

export { carteiraIdealRouter };
