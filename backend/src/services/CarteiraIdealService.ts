import { CarteiraIdealRepository } from "../repositories/CarteiraIdealRepository";
import * as Engine from "./CarteiraIdealEngine";
import { Client, Goal } from "../domain/carteiraIdealSchemas";

export class CarteiraIdealService {
  private repository: CarteiraIdealRepository;

  constructor() {
    this.repository = new CarteiraIdealRepository();
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
      savings: clientData.patrimonio_total || 0,
      monthly: clientData.aporte_mensal || 0,
      goals: [],
    };

    const inputs = Array.isArray(goalInput) ? goalInput : [goalInput];
    
    const goals: Goal[] = inputs.map(input => {
      const riskLevel = input.risk === 'ultra_aggressive' ? 'ultra_aggressive' :
                        input.risk === 'aggressive' ? 'aggressive' :
                        input.risk === 'conservative' ? 'conservative' : 'moderate';
      return {
        name: input.name || "Aposentadoria",
        target: input.target || 1000000,
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
    let mainGoal = goals[0]; // Usado para Monte Carlo e Score principal

    if (goals.length > 1) {
      // Cria portfolios individuais e consolida
      const portfolios = goals.map(g => Engine.buildPortfolio(g, client, view, catalog));
      portfolio = { alloc: Engine.consolidatePortfolios(portfolios, catalog) };
      // Pega o objetivo mais urgente (menor tempo) ou o mais prioritário como representativo
      mainGoal = goals.reduce((prev, curr) => (curr.priority > prev.priority ? curr : prev));
    } else {
      portfolio = Engine.buildPortfolio(mainGoal, client, view, catalog);
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

    const fullAnalysis = {
      trafficLight,
      planScore,
      enforceLog: portfolio.enforce_log || []
    };

    // 8. Save Snapshot
    await this.repository.saveSnapshot(userId, mainGoal.target, portfolio.alloc, risk, sim, fullAnalysis, token);

    // 9. Return JSON structure
    return {
      portfolio: portfolio.alloc,
      rules_applied: portfolio.rules,
      risk: {
        mu: risk.mu,
        sigma: risk.sigma,
        sharpe: risk.sharpe,
        var_95: risk.var_95
      },
      simulation: sim,
      analysis: fullAnalysis
    };
  }
}
