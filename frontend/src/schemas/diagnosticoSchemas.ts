import { z } from "zod";

// ── Etapa 1: Renda & Gastos ──────────────────────────────────────────────────
export const Etapa1Schema = z.object({
  idade: z
    .number({ message: "Informe sua idade." })
    .min(18, "Idade mínima 18 anos.")
    .max(100, "Idade máxima 100 anos."),
  renda_mensal: z
    .number({ message: "Informe sua renda mensal." })
    .positive("A renda deve ser maior que zero."),
  gastos_mensais: z
    .number({ message: "Informe seus gastos mensais." })
    .positive("Os gastos devem ser maior que zero."),
  aporte_mensal: z
    .number({ message: "Informe seu aporte mensal." })
    .min(0),
});

// ── Etapa 2: Patrimônio ──────────────────────────────────────────────────────
export const Etapa2Schema = z
  .object({
    patrimonio_total: z
      .number({ message: "Informe seu patrimônio atual." })
      .min(0, "O patrimônio não pode ser negativo."),
    tipos_ativos: z.array(z.string()),
    valor_reserva: z
      .number({ message: "Informe o valor total da sua reserva." })
      .min(0),
    meses_reserva: z.number().min(0),
  })
  .refine((data) => data.valor_reserva <= data.patrimonio_total, {
    message: "A reserva não pode ser maior que o patrimônio total.",
    path: ["valor_reserva"],
  });

// ── Etapa 3: Seleção de Objetivos ─────────────────────────────────────────────
export const Etapa3Schema = z.object({
  objetivos_selecionados: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        emoji: z.string().optional(),
      })
    )
    .min(1, "Selecione ou adicione ao menos um objetivo."),
});

// ── Etapa 4: Detalhamento dos Objetivos ───────────────────────────────────────
export const Etapa4Schema = z.object({
  detalhes_objetivos: z.record(
    z.string(),
    z.object({
      valor: z.number({ message: "Informe um valor." }).min(0, "Valor não pode ser negativo"),
      horizonte_anos: z.number().min(1, "Mínimo 1 ano.").max(50, "Máximo 50 anos."),
      natureza: z.enum(["need", "want"]),
      liquidez: z.enum(["low", "medium", "high"]),
      prioridade: z.number().min(1).max(5),
    })
  ),
});

// ── Etapa 5: Perfil de Risco ──────────────────────────────────────────────────
export const Etapa5Schema = z.object({
  reacao_queda: z.string().min(1, "Selecione sua reação a quedas."),
  experiencia_rv: z.string().min(1, "Selecione seu nível de experiência."),
  percentual_risco: z.string().min(1, "Selecione o percentual aceitável em risco."),
});

// ── Schema completo (enviado ao backend) ──────────────────────────────────────
export const DiagnosticoCompletoSchema = Etapa1Schema
  .merge(Etapa2Schema)
  .merge(Etapa3Schema)
  .merge(Etapa4Schema)
  .merge(Etapa5Schema);

export type Etapa1Data = z.infer<typeof Etapa1Schema>;
export type Etapa2Data = z.infer<typeof Etapa2Schema>;
export type Etapa3Data = z.infer<typeof Etapa3Schema>;
export type Etapa4Data = z.infer<typeof Etapa4Schema>;
export type Etapa5Data = z.infer<typeof Etapa5Schema>;
export type DiagnosticoCompleto = z.infer<typeof DiagnosticoCompletoSchema>;
