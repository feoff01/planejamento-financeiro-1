import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { CadastroSchema, LoginSchema } from "../domain/authSchemas";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      // 1. Zod Validation (Diretrizes de Segurança)
      const validatedData = CadastroSchema.parse(req.body);

      // 2. Chama a Camada 3 (Service) passando dados puros
      const userData = await this.authService.processRegistration(
        validatedData.email,
        validatedData.password,
        validatedData.nome
      );

      // 3. Setar Cookie (Diretriz de Segurança §4)
      if (userData.session?.access_token) {
        res.cookie("sb_token", userData.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 1000, // 1 hora (alinhado com o JWT do Supabase)
        });
      }

      res.status(201).json({ success: true, user: userData.user });
    } catch (error: any) {
      if (error.name === "ZodError") { // Erros de formato Zod
         res.status(400).json({ error: "Dados inválidos enviados.", details: error.errors });
         return;
      }
      // Nunca cuspir 'error' puro pro client, sempre mensagens genéricas.
      res.status(400).json({ error: error.message || "Não foi possível realizar o cadastro." });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = LoginSchema.parse(req.body);

      const userData = await this.authService.processLogin(
        validatedData.email,
        validatedData.password
      );

      // 3. Setar Cookie (Diretriz de Segurança §4)
      if (userData.session?.access_token) {
        res.cookie("sb_token", userData.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 1000, // 1 hora (alinhado com o JWT do Supabase)
        });
      }

      res.status(200).json({ success: true, user: userData.user });
    } catch (error: any) {
      res.status(401).json({ error: error.message || "Credenciais não autorizadas." });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie("sb_token");
    res.status(200).json({ success: true });
  }

  async me(req: Request, res: Response): Promise<void> {
    // A requisição já foi validada pelo authMiddleware, então req.user existe.
    if (req.user) {
      res.status(200).json({ success: true, user: req.user });
    } else {
      res.status(401).json({ error: "Sessão inválida." });
    }
  }
}
