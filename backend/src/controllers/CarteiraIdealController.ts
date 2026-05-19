import { Request, Response } from "express";

export class CarteiraIdealController {
  generate = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      res.status(403).json({
        error: "Plano completo protegido. Assinatura necessária para acessar a carteira detalhada.",
      });
    } catch (error: any) {
      console.error("[CarteiraIdealController] generate error:", error);
      res.status(500).json({ error: "Erro interno ao validar acesso ao plano completo." });
    }
  };
}
