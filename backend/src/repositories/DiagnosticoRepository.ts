import { DiagnosticoInput } from "../domain/diagnosticoSchemas";

/**
 * DiagnosticoRepository (Camada 4)
 * Único ponto de contato com o Supabase para persistir dados do diagnóstico.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

export class DiagnosticoRepository {
  /**
   * Instancia um client do Supabase que herda as credenciais do usuário.
   * Necessário para passar pelas regras de RLS (Row Level Security).
   */
  private getClient(token: string) {
    return createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_KEY || "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
  }

  /**
   * Cria ou atualiza o diagnóstico financeiro do usuário.
   * Usa upsert com onConflict em 'user_id' para idempotência.
   */
  async upsert(userId: string, dados: DiagnosticoInput, perfil: string, token: string) {
    // Extrai campos que não mapeiam diretamente para colunas da tabela
    const { objetivos_selecionados, detalhes_objetivos, ...dadosSimples } = dados as any;

    const userSupabase = this.getClient(token);

    const { error } = await userSupabase
      .from("onboarding_data")
      .upsert(
        {
          user_id: userId,
          perfil_calculado: perfil,
          ...dadosSimples,
          objetivos_selecionados: JSON.stringify(objetivos_selecionados || []),
          detalhes_objetivos: JSON.stringify(detalhes_objetivos || {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("[DiagnosticoRepository] upsert error:", error.message);
      throw new Error("DATABASE_ERROR");
    }
  }

  /**
   * Atualiza a flag de onboarding na tabela profiles.
   */
  async marcarOnboardingCompleto(userId: string, perfil: string, token: string) {
    const userSupabase = this.getClient(token);

    const { error } = await userSupabase
      .from("profiles")
      .update({ onboarding_completo: true, perfil, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      console.error("[DiagnosticoRepository] update profiles error:", error.message);
      // Não lança erro — o diagnóstico já foi salvo, não bloqueia o fluxo
    }
  }
}
