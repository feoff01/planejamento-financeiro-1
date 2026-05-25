import { Request, Response } from "express";
import { PlanoIdealService } from "../services/PlanoIdealService";

export class PlanoIdealController {
  private service = new PlanoIdealService();

  generate = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const token = req.cookies?.sb_token;
      const goalInput = req.body?.goals ?? req.body?.goal ?? req.body ?? {};
      const data = await this.service.generate(user.id, goalInput, token);

      res.status(200).json({ data });
    } catch (error: any) {
      console.error("[PlanoIdealController] generate error:", error);
      if (error?.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Erro interno ao gerar o plano completo." });
    }
  };
}
