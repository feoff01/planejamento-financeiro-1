import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

export class CarteiraIdealRepository {
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

  async saveSnapshot(userId: string, target: number, alloc: any, risk: any, sim: any, analysis: any, token: string) {
    const userSupabase = this.getClient(token);

    const { error } = await userSupabase
      .from("portfolio_history")
      .insert([
        {
          user_id: userId,
          target_amount: target,
          allocation_weights: alloc,
          risk_metrics: risk,
          simulation_results: sim,
          analysis_score: analysis.planScore.score,
          analysis_full: analysis,
          created_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      console.error("[CarteiraIdealRepository] saveSnapshot error:", error.message);
      // Not throwing error to avoid blocking the user flow if the table isn't fully created yet in Supabase.
      // throw new Error("DATABASE_ERROR");
    }
  }

  async getClientData(userId: string, token: string) {
    const userSupabase = this.getClient(token);
    
    const { data, error } = await userSupabase
      .from("onboarding_data")
      .select("idade, renda_mensal, gastos_mensais, patrimonio_total, aporte_mensal")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("[CarteiraIdealRepository] getClientData error:", error.message);
      throw new Error("DATABASE_ERROR");
    }

    return data;
  }
}
