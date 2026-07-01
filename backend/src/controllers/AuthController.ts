import { Request, Response } from "express";

import { AuthService } from "../services/AuthService";
import { CadastroSchema, LoginSchema } from "../domain/authSchemas";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  private setAuthCookie(res: Response, accessToken: string) {
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("sb_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      maxAge: 60 * 60 * 1000,
    });
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CadastroSchema.parse(req.body);

      const userData = await this.authService.processRegistration(
        validatedData.email,
        validatedData.password,
        validatedData.nome
      );

      if (userData.session?.access_token) {
        this.setAuthCookie(res, userData.session.access_token);
      }

      res.status(201).json({
        success: true,
        user: userData.user,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({
          error: "Dados inválidos enviados.",
          details: error.errors,
        });
        return;
      }

      res.status(400).json({
        error: error.message || "Não foi possível realizar o cadastro.",
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = LoginSchema.parse(req.body);

      const userData = await this.authService.processLogin(
        validatedData.email,
        validatedData.password
      );

      if (userData.session?.access_token) {
        this.setAuthCookie(res, userData.session.access_token);
      }

      res.status(200).json({
        success: true,
        user: userData.user,
      });
    } catch (error: any) {
      res.status(401).json({
        error: error.message || "Credenciais não autorizadas.",
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie("sb_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.status(200).json({
      success: true,
    });
  }

  async me(req: Request, res: Response): Promise<void> {
    if (req.user) {
      res.status(200).json({
        success: true,
        user: req.user,
      });
      return;
    }

    res.status(401).json({
      error: "Sessão inválida.",
    });
  }
}