import { LoginFormData, CadastroFormData } from "@/schemas/authSchemas";

/**
 * AuthService
 *
 * Este serviço pertence ao Frontend e atua APENAS como ponte de comunicação
 * com o Backend.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://planejamento-financeiro-backend-scp3.onrender.com";

export const AuthService = {
  async signIn(data: LoginFormData) {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Não foi possível entrar.");
    }

    return result;
  },

  async signUp(data: CadastroFormData) {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: data.nome,
        email: data.email,
        password: data.password,
      }),
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Não foi possível criar sua conta.");
    }

    return result;
  },

  async signOut() {
    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Não foi possível realizar o logout.");
    }
  },

  async getMe() {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Sessão inválida.");
    }

    const result = await response.json();
    return result.user;
  },
};
