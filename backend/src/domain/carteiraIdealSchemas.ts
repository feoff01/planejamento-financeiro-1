import { z } from 'zod';

export const MarketAssumptionsSchema = z.object({
  ipca_esperado: z.number().default(0.0420),
  ipca_vol: z.number().default(0.0150),
  selic_esperada: z.number().default(0.0975),
  selic_vol: z.number().default(0.0040),
  real_curve: z.record(z.string(), z.number()).default({
    '2': 0.0680,
    '5': 0.0700,
    '10': 0.0715,
    '20': 0.0700,
    '30': 0.0680,
  }),
  eq_dividend_yield: z.number().default(0.065),
  eq_real_growth: z.number().default(0.030),
  eq_growth_premium: z.number().default(0.060),
  eq_div_vol: z.number().default(0.16),
  eq_growth_vol: z.number().default(0.28),
  conviction: z.number().default(0.60),
  macro_tilts: z.record(z.string(), z.number()).default({
    'selic': -0.05,
    'prefixado': -0.05,
    'ipca': 0.15,
    'equity': -0.05,
  }),
  selic_min: z.number().default(0.05),
  equity_max: z.number().default(0.85),
  single_max: z.number().default(0.40),
  taxa_b3: z.number().default(0.0020),
  ir_equity: z.number().default(0.15),
});

export type MarketAssumptions = z.infer<typeof MarketAssumptionsSchema>;

export const AssetSchema = z.object({
  id: z.string(),
  label: z.string(),
  cat: z.string(),
  ret_b: z.number(),
  ret_l: z.number(),
  vol: z.number(),
  color: z.string(),
  anos: z.number(),
});

export type Asset = z.infer<typeof AssetSchema>;

export const GoalSchema = z.object({
  name: z.string(),
  target: z.number(),
  years: z.number(),
  risk: z.enum(['conservative', 'moderate', 'aggressive', 'ultra_aggressive']).default('moderate'),
  priority: z.number().default(3),
  nature: z.enum(['essential', 'aspirational']).default('aspirational'),
  liquidity: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type Goal = z.infer<typeof GoalSchema>;

export const EmergencyFundSchema = z.object({
  months_target: z.number().default(6),
  balance: z.number().nullable().default(null),
  target_asset_id: z.string().default('lft_2028'),
});

export type EmergencyFund = z.infer<typeof EmergencyFundSchema>;

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  income: z.number(),
  expenses: z.number(),
  savings: z.number(),
  monthly: z.number(),
  goals: z.array(GoalSchema).default([]),
  emergency: EmergencyFundSchema.nullable().default(null),
});

export type Client = z.infer<typeof ClientSchema>;
