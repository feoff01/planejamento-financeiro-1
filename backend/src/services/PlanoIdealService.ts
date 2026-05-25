import { PlanoIdealRepository } from "../repositories/PlanoIdealRepository";
import * as Engine from "./PlanoIdealEngine";
import { Asset, Client, Goal, MarketAssumptions } from "../domain/planoIdealSchemas";

type AssetGroupKey = "renda_fixa" | "renda_variavel" | "liquidez";

type FullAsset = {
  id: string;
  label: string;
  categoria: AssetGroupKey;
  percentual: number;
  aporte_mensal: number;
};

type FullAssetGroup = {
  key: AssetGroupKey;
  label: string;
  percentual: number;
  assets: FullAsset[];
};

type TimeEstimate = {
  months: number;
  years: number;
  label: string;
} | null;

type GrowthProjectionPoint = {
  ano: number;
  aportado: number;
  projetado: number;
};

const VALOR_MINIMO_OBJETIVO = 500;

export class PlanoIdealService {
  private repository: PlanoIdealRepository;

  constructor() {
    this.repository = new PlanoIdealRepository();
  }

  private assetGroupKey(asset: Asset): AssetGroupKey {
    if (asset.cat === "selic") return "liquidez";
    if (asset.cat === "equity") return "renda_variavel";
    return "renda_fixa";
  }

  private assetGroupLabel(key: AssetGroupKey): string {
    const labels: Record<AssetGroupKey, string> = {
      renda_fixa: "Renda fixa",
      renda_variavel: "Renda variavel",
      liquidez: "Liquidez",
    };
    return labels[key];
  }

  private roundPercent(value: number): number {
    return Number((value * 100).toFixed(2));
  }

  private buildAllocationSummary(
    alloc: Record<string, number>,
    catalog: Record<string, Asset>
  ): Record<AssetGroupKey, number> {
    const summary: Record<AssetGroupKey, number> = {
      renda_fixa: 0,
      renda_variavel: 0,
      liquidez: 0,
    };

    for (const [assetId, weight] of Object.entries(alloc)) {
      const asset = catalog[assetId];
      if (!asset) continue;
      summary[this.assetGroupKey(asset)] += weight as number;
    }

    return {
      renda_fixa: this.roundPercent(summary.renda_fixa),
      renda_variavel: this.roundPercent(summary.renda_variavel),
      liquidez: this.roundPercent(summary.liquidez),
    };
  }

  private buildAssetGroups(
    alloc: Record<string, number>,
    catalog: Record<string, Asset>,
    monthly: number
  ): FullAssetGroup[] {
    const groups: Record<AssetGroupKey, FullAssetGroup> = {
      renda_fixa: { key: "renda_fixa", label: this.assetGroupLabel("renda_fixa"), percentual: 0, assets: [] },
      renda_variavel: { key: "renda_variavel", label: this.assetGroupLabel("renda_variavel"), percentual: 0, assets: [] },
      liquidez: { key: "liquidez", label: this.assetGroupLabel("liquidez"), percentual: 0, assets: [] },
    };

    for (const [assetId, weight] of Object.entries(alloc).sort(([, a], [, b]) => (b as number) - (a as number))) {
      const asset = catalog[assetId];
      if (!asset) continue;

      const key = this.assetGroupKey(asset);
      const percent = this.roundPercent(weight as number);
      groups[key].percentual = Number((groups[key].percentual + percent).toFixed(2));
      groups[key].assets.push({
        id: assetId,
        label: asset.label,
        categoria: key,
        percentual: percent,
        aporte_mensal: Number((monthly * (weight as number)).toFixed(2)),
      });
    }

    return [groups.renda_fixa, groups.renda_variavel, groups.liquidez];
  }

  private buildAssetExplanations(
    alloc: Record<string, number>,
    catalog: Record<string, Asset>,
    goal: Goal
  ) {
    return Object.entries(alloc)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([assetId, weight]) => {
        const asset = catalog[assetId];
        return {
          id: assetId,
          label: asset?.label || assetId,
          percentual: this.roundPercent(weight as number),
          explanation: asset ? Engine.assetRole(assetId, asset, goal) : "Papel complementar na carteira",
        };
      });
  }

  private formatTimeEstimateLabel(months: number): string {
    if (months <= 0) return "Menos de 1 mês";
    if (months < 12) return months === 1 ? "1 mês" : `${months} meses`;

    const years = Math.ceil(months / 12);
    return years === 1 ? "1 ano" : `${years} anos`;
  }

  private estimateTimeToTarget(target: number, initialAmount: number, monthlyAmount: number, annualReturn: number): TimeEstimate {
    if (!target || target <= 0) return null;
    if (initialAmount >= target) {
      return { months: 0, years: 0, label: this.formatTimeEstimateLabel(0) };
    }

    const monthlyReturn = Math.pow(1 + Math.max(annualReturn, 0), 1 / 12) - 1;
    if ((monthlyAmount || 0) <= 0 && monthlyReturn <= 0) return null;

    let balance = initialAmount || 0;
    const maxMonths = 50 * 12;

    for (let month = 1; month <= maxMonths; month++) {
      balance = balance * (1 + monthlyReturn) + (monthlyAmount || 0);
      if (balance >= target) {
        const years = Number((month / 12).toFixed(1));
        return {
          months: month,
          years,
          label: this.formatTimeEstimateLabel(month),
        };
      }
    }

    return { months: maxMonths, years: 50, label: "Acima de 50 anos" };
  }

  private estimateTimeToAllGoals(
    goals: Goal[],
    client: Client,
    portfolios: Array<{ alloc: Record<string, number> }>,
    contributionPlan: Engine.ContributionPlan,
    view: MarketAssumptions,
    catalog: Record<string, Asset>
  ): TimeEstimate {
    const activeGoals = goals.length > 0 ? goals : [{
      name: "Crescimento",
      target: 0,
      years: 10,
      risk: "moderate" as const,
      priority: 3,
      nature: "aspirational" as const,
      liquidity: "medium" as const,
    }];
    const estimates = activeGoals
      .map((goal, index) => {
        const contribution = contributionPlan.objetivos.find((item) => item.goal_index === index);
        const monthlyShare = contribution?.aporte_mensal ?? (client.monthly || 0) / activeGoals.length;
        const portfolio = portfolios[index] || portfolios[0] || { alloc: {} };
        const goalRisk = Engine.portfolioRisk(portfolio.alloc, view, catalog);

        return this.estimateTimeToTarget(goal.target, 0, monthlyShare, goalRisk.mu);
      })
      .filter((estimate): estimate is NonNullable<TimeEstimate> => estimate !== null);

    if (estimates.length === 0) return null;

    return estimates.reduce((longest, estimate) => (estimate.months > longest.months ? estimate : longest));
  }

  private buildGrowthProjection(client: Client, goal: Goal, annualReturn: number, estimate: TimeEstimate): GrowthProjectionPoint[] {
    const horizon = Math.max(1, Math.min(50, Math.ceil(estimate?.years || goal.years || 1)));
    const monthlyReturn = Math.pow(1 + Math.max(annualReturn, 0), 1 / 12) - 1;
    const projection: GrowthProjectionPoint[] = [];
    let projected = 0;

    projection.push({
      ano: 0,
      aportado: Number(projected.toFixed(2)),
      projetado: Number(projected.toFixed(2)),
    });

    for (let year = 1; year <= horizon; year++) {
      for (let month = 0; month < 12; month++) {
        projected = projected * (1 + monthlyReturn) + (client.monthly || 0);
      }

      projection.push({
        ano: year,
        aportado: Number(((client.monthly || 0) * year * 12).toFixed(2)),
        projetado: Number(projected.toFixed(2)),
      });
    }

    return projection;
  }

  async generate(userId: string, goalInput: Partial<Goal> | Partial<Goal>[], token: string) {
    // 1. Fetch client data
    const clientData = await this.repository.getClientData(userId, token);
    
    if (!clientData) {
      throw new Error("CLIENT_DATA_NOT_FOUND");
    }

    // 2. Build Client domain object
    const client: Client = {
      id: userId,
      name: "User", // Can be fetched from profiles if needed
      age: clientData.idade || 30,
      income: clientData.renda_mensal || 0,
      expenses: clientData.gastos_mensais || 0,
      // Patrimonio atual fica salvo como contexto, mas nao abate objetivos do Plano Ideal.
      savings: 0,
      monthly: clientData.aporte_mensal || 0,
      goals: [],
    };

    const rawInputs = Array.isArray(goalInput) ? goalInput : [goalInput];
    const inputs = rawInputs.length > 0 ? rawInputs : [{}];
    
    const goals: Goal[] = inputs.map(input => {
      const target = input.target ?? 1000000;
      if (target < VALOR_MINIMO_OBJETIVO) {
        const error = new Error("O valor mínimo por objetivo é R$ 500.");
        (error as any).statusCode = 422;
        throw error;
      }
      const riskLevel = input.risk === 'ultra_aggressive' ? 'ultra_aggressive' :
                        input.risk === 'aggressive' ? 'aggressive' :
                        input.risk === 'conservative' ? 'conservative' : 'moderate';
      return {
        name: input.name || "Aposentadoria",
        target,
        years: input.years || 20,
        risk: riskLevel,
        priority: input.priority || 3,
        nature: input.nature === 'essential' ? 'essential' : 'aspirational',
        liquidity: input.liquidity === 'low' ? 'low' : input.liquidity === 'high' ? 'high' : 'medium'
      };
    });

    const view = Engine.DEFAULT_VIEW;
    const catalog = Engine.buildCatalog(view);

    let portfolio;
    let individualPortfolios: any[] = [];
    let mainGoal = goals[0]; // Usado para Monte Carlo e Score principal

    if (goals.length > 1) {
      // Cria portfolios individuais e consolida
      individualPortfolios = goals.map(g => Engine.buildPortfolio(g, client, view, catalog));
      portfolio = { alloc: Engine.consolidatePortfolios(individualPortfolios, catalog) };
      // Pega o objetivo mais urgente (menor tempo) ou o mais prioritário como representativo
      mainGoal = goals.reduce((prev, curr) => (curr.priority > prev.priority ? curr : prev));
    } else {
      portfolio = Engine.buildPortfolio(mainGoal, client, view, catalog);
      individualPortfolios = [portfolio];
    }

    // 5. Calculate Risk
    const risk = Engine.portfolioRisk(portfolio.alloc, view, catalog);

    // 6. Run Monte Carlo (usando o objetivo representativo)
    const sim = Engine.runMonteCarlo(
      portfolio.alloc,
      client.savings,
      client.monthly,
      mainGoal.years,
      mainGoal.target,
      view,
      catalog
    );

    // 7. Plan Analysis
    const trafficLight = Engine.planTrafficLight(client, mainGoal, portfolio, sim, view, catalog, risk);
    const planScore = Engine.planScore(client, mainGoal, portfolio, sim, view, catalog, risk);
    const contributionPlan = Engine.buildContributionPlan(goals, client, individualPortfolios, view, catalog);
    const allocationSummary = this.buildAllocationSummary(portfolio.alloc, catalog);
    const assetGroups = this.buildAssetGroups(portfolio.alloc, catalog, client.monthly);
    const assetExplanations = this.buildAssetExplanations(portfolio.alloc, catalog, mainGoal);
    const timeEstimate = this.estimateTimeToAllGoals(goals, client, individualPortfolios, contributionPlan, view, catalog);
    const growthProjection = this.buildGrowthProjection(client, mainGoal, risk.mu, timeEstimate);

    const fullAnalysis = {
      trafficLight,
      planScore,
      enforceLog: portfolio.enforce_log || []
    };

    // 8. Save Snapshot
    await this.repository.saveSnapshot(userId, mainGoal.target, portfolio.alloc, risk, sim, fullAnalysis, token);

    // 9. Return JSON structure
    return {
      goals: goals.map((goal, index) => ({
        goal_index: index,
        name: goal.name,
        target: goal.target,
        years: goal.years,
        risk: goal.risk,
        priority: goal.priority,
        nature: goal.nature,
        liquidity: goal.liquidity,
      })),
      main_goal: {
        name: mainGoal.name,
        target: mainGoal.target,
        years: mainGoal.years,
        risk: mainGoal.risk,
        priority: mainGoal.priority,
        nature: mainGoal.nature,
        liquidity: mainGoal.liquidity,
      },
      tempo_estimado: timeEstimate,
      allocation_summary: allocationSummary,
      asset_groups: assetGroups,
      asset_explanations: assetExplanations,
      growth_projection: growthProjection,
      portfolio: portfolio.alloc,
      rules_applied: portfolio.rules,
      risk: {
        mu: risk.mu,
        sigma: risk.sigma,
        sharpe: risk.sharpe,
        var_95: risk.var_95
      },
      simulation: sim,
      contribution_plan: contributionPlan,
      analysis: fullAnalysis
    };
  }
}
