import { Request, Response } from "express";
import { CarteiraIdealService } from "../services/CarteiraIdealService";

export class CarteiraIdealController {
  private service: CarteiraIdealService;

  constructor() {
    this.service = new CarteiraIdealService();
  }

  generate = async (req: Request, res: Response): Promise<void> => {
    try {
      // O usuário vem do AuthMiddleware
      const user = (req as any).user;
      if (!user || !user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const token = req.cookies?.sb_token || "";
      const goalInput = req.body.goal || {};

      const result = await this.service.generate(user.id, goalInput, token);

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[CarteiraIdealController] generate error:", error);
      if (error.message === "CLIENT_DATA_NOT_FOUND") {
        res.status(404).json({ error: "Dados financeiros do usuário não encontrados. Preencha o onboarding." });
      } else {
        res.status(500).json({ error: "Erro interno ao calcular a carteira ideal." });
      }
    }
  };
}
