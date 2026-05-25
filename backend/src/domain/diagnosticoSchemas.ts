import { z } from "zod";

const VALOR_MINIMO_OBJETIVO = 500;

export const DiagnosticoSchema = z.object({
  // Etapa 1
  idade: z.number().min(18).max(100),
  renda_mensal: z.number().positive(),
  gastos_mensais: z.number().positive(),
  aporte_mensal: z.number().min(0),

  // Etapa 2
  patrimonio_total: z.number().min(0),
  tipos_ativos: z.array(z.string()).optional().default([]),

  // Etapa 3 e 4
  objetivos_selecionados: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      emoji: z.string().optional(),
    })
  ).min(1),
  detalhes_objetivos: z.record(
    z.string(),
    z.object({
      valor: z.number().min(VALOR_MINIMO_OBJETIVO),
      horizonte_anos: z.number().min(1).max(50),
      natureza: z.enum(["need", "want"]),
      liquidez: z.enum(["low", "medium", "high"]),
      prioridade: z.number().min(1).max(5),
    })
  ),

  // Etapa 5
  reacao_queda: z.enum(["vender_tudo", "espera_preocupado", "mantenho_tranquilo", "compra_mais"]),
  experiencia_rv: z.enum(["nunca", "pouca", "media", "experiente"]),
  percentual_risco: z.enum(["ate_10", "ate_30", "ate_60", "mais_60"]),
});

export type DiagnosticoInput = z.infer<typeof DiagnosticoSchema>;
