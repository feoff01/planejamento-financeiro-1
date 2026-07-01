import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Esse arquivo representa a Camada 4 (Repositório).
 * É o único lugar do backend onde fazemos chamadas diretas para o Supabase.
 */

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY
)?.trim();

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL não foi configurada no arquivo .env");
}

if (!SUPABASE_KEY) {
  throw new Error("Nenhuma chave do Supabase foi configurada no arquivo .env");
}

console.log("[Supabase] URL carregada:", SUPABASE_URL);
console.log(
  "[Supabase] Tipo da chave:",
  SUPABASE_KEY.startsWith("sb_secret")
    ? "secret"
    : SUPABASE_KEY.startsWith("sb_publishable")
      ? "publishable"
      : "legacy/jwt"
);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as any).cause;

    console.error("[Supabase Error]:", error.message);

    if (cause) {
      console.error("[Supabase Error Cause]:", cause);
    }

    return error.message;
  }

  console.error("[Supabase Unknown Error]:", error);
  return "Erro desconhecido ao comunicar com o Supabase.";
}

export class AuthRepository {
  async register(email: string, pass: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error("[Supabase Auth Register Error]:", error.message);
        throw new Error(error.message);
      }

      return data;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      throw new Error(`Erro ao cadastrar no Supabase: ${message}`);
    }
  }

  async login(email: string, pass: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        console.error("[Supabase Auth Login Error]:", error.message);

        if (error.message.includes("Invalid login credentials")) {
          throw new Error("CREDENTIALS_REJECTED");
        }

        throw new Error(error.message);
      }

      return data;
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "CREDENTIALS_REJECTED") {
        throw error;
      }

      const message = getErrorMessage(error);
      throw new Error(`Erro ao fazer login no Supabase: ${message}`);
    }
  }

  async validateToken(token: string) {
    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return null;
      }

      return data.user;
    } catch (error: unknown) {
      getErrorMessage(error);
      return null;
    }
  }
}

export const authRepository = new AuthRepository();