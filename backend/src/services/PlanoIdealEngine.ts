import * as math from 'mathjs';
import { MarketAssumptions, Asset, Goal, Client } from '../domain/planoIdealSchemas';

// Helper Random functions
function standardNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function randomChoice(probs: number[]): number {
  const sum = probs.reduce((a, b) => a + b, 0);
  const r = Math.random() * sum;
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r <= acc) return i;
  }
  return probs.length - 1;
}

// ---- SECTION 1: PREMISSAS DO GESTOR ----
export const DEFAULT_VIEW: MarketAssumptions = {
  ipca_esperado: 0.0420,
  ipca_vol: 0.0150,
  selic_esperada: 0.0975,
  selic_vol: 0.0040,
  real_curve: {
    '2': 0.0680,
    '5': 0.0700,
    '10': 0.0715,
    '20': 0.0700,
    '30': 0.0680,
  },
  eq_dividend_yield: 0.065,
  eq_real_growth: 0.030,
  eq_growth_premium: 0.060,
  eq_div_vol: 0.16,
  eq_growth_vol: 0.28,
  conviction: 0.60,
  macro_tilts: {
    selic: -0.05,
    prefixado: -0.05,
    ipca: 0.10,
    equity: 0.00,
  },
  selic_min: 0.05,
  equity_max: 0.85,
  single_max: 0.40,
  taxa_b3: 0.0020,
  ir_equity: 0.15,
};

export function realYieldFor(view: MarketAssumptions, years: number): number {
  const ks = Object.keys(view.real_curve).map(Number).sort((a, b) => a - b);
  if (years <= ks[0]) return view.real_curve[String(ks[0])];
  if (years >= ks[ks.length - 1]) return view.real_curve[String(ks[ks.length - 1])];
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (years >= a && years <= b) {
      const t = (years - a) / (b - a);
      return view.real_curve[String(a)] * (1 - t) + view.real_curve[String(b)] * t;
    }
  }
  return view.real_curve[String(ks[ks.length - 1])];
}

export function equityExpectedReturn(view: MarketAssumptions, kind: 'div' | 'growth' = 'div'): number {
  const infl = 1 + view.ipca_esperado;
  let real: number;
  if (kind === 'div') {
    real = (1 + view.eq_dividend_yield) * (1 + view.eq_real_growth) - 1;
  } else {
    real = ((1 + view.eq_dividend_yield) * (1 + view.eq_real_growth) * (1 + view.eq_growth_premium)) - 1;
  }
  return (1 + real) * infl - 1;
}

// ---- SECTION 2: MATRIZ DE CORRELAÇÃO E COVARIÂNCIA ----
export const CORR_CLASSES = ['selic', 'prefixado', 'ipca', 'equity_div', 'equity_growth'];

export const CORR_MATRIX_CLASSES = [
    [   1.00,  0.20,   0.15,  0.05,  0.00 ],
    [   0.20,  1.00,   0.55, -0.05, -0.05 ],
    [   0.15,  0.55,   1.00,  0.20,  0.15 ],
    [   0.05, -0.05,   0.20,  1.00,  0.65 ],
    [   0.00, -0.05,   0.15,  0.65,  1.00 ],
];

export const INTRACLASS_CORR = 0.92;

export function assetClassLabel(assetId: string, asset: Asset): string {
  if (asset.cat === 'equity') {
    return assetId.includes('dividend') ? 'equity_div' : 'equity_growth';
  }
  return asset.cat;
}

export function assetRole(assetId: string, asset: Asset, goal: Goal): string {
  if (asset.cat === 'selic') return 'Reserva e liquidez imediata';
  if (asset.cat === 'ipca') {
    if (asset.label.toLowerCase().includes('princ')) {
      return `Ancora real para proteger contra inflacao ate ${asset.anos.toFixed(0)}a`;
    }
    return `Protecao real de longo prazo (${asset.anos.toFixed(0)}a)`;
  }
  if (asset.cat === 'prefixado') {
    return `Trava nominal de ${asset.anos.toFixed(0)}a para cenarios de queda de juros`;
  }
  if (asset.cat === 'equity') {
    if (assetId.includes('dividend')) return 'Renda recorrente via dividendos';
    return goal.years >= 8 ? 'Crescimento real de longo prazo' : 'Parcela de crescimento controlada';
  }
  return 'Papel complementar na carteira';
}

export function buildCovMatrix(assetIds: string[], catalog: Record<string, Asset>): number[][] {
  const n = assetIds.length;
  const Sigma: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    const ai = assetIds[i];
    const ci = CORR_CLASSES.indexOf(assetClassLabel(ai, catalog[ai]));
    for (let j = 0; j < n; j++) {
      const aj = assetIds[j];
      const cj = CORR_CLASSES.indexOf(assetClassLabel(aj, catalog[aj]));
      let rho: number;
      if (i === j) {
        rho = 1.0;
      } else if (ci === cj) {
        rho = INTRACLASS_CORR;
      } else {
        rho = CORR_MATRIX_CLASSES[ci][cj];
      }
      Sigma[i][j] = rho * catalog[ai].vol * catalog[aj].vol;
    }
  }
  return Sigma;
}

// ---- SECTION 3: DADOS DE MERCADO (Fallback) ----
const FALLBACK_BONDS = [
  { tipo: 'Tesouro Selic', nome: 'LFT', venc: '2028-03-01', taxa: 0.0025, pu: 0 },
  { tipo: 'Tesouro Prefixado', nome: 'LTN', venc: '2027-01-01', taxa: 0.1450, pu: 0 },
  { tipo: 'Tesouro Prefixado com Juros Semestrais', nome: 'NTN-F', venc: '2029-01-01', taxa: 0.1380, pu: 0 },
  { tipo: 'Tesouro Prefixado com Juros Semestrais', nome: 'NTN-F', venc: '2033-01-01', taxa: 0.1360, pu: 0 },
  { tipo: 'Tesouro Prefixado com Juros Semestrais', nome: 'NTN-F', venc: '2035-01-01', taxa: 0.1340, pu: 0 },
  { tipo: 'Tesouro IPCA+', nome: 'NTN-B PRINCIPAL', venc: '2029-05-15', taxa: 0.0750, pu: 0 },
  { tipo: 'Tesouro IPCA+ com Juros Semestrais', nome: 'NTN-B', venc: '2032-08-15', taxa: 0.0720, pu: 0 },
  { tipo: 'Tesouro IPCA+', nome: 'NTN-B PRINCIPAL', venc: '2035-05-15', taxa: 0.0710, pu: 0 },
  { tipo: 'Tesouro IPCA+ com Juros Semestrais', nome: 'NTN-B', venc: '2040-08-15', taxa: 0.0700, pu: 0 },
  { tipo: 'Tesouro IPCA+', nome: 'NTN-B PRINCIPAL', venc: '2045-05-15', taxa: 0.0690, pu: 0 },
  { tipo: 'Tesouro IPCA+ com Juros Semestrais', nome: 'NTN-B', venc: '2055-05-15', taxa: 0.0680, pu: 0 },
  { tipo: 'Tesouro IPCA+', nome: 'NTN-B PRINCIPAL', venc: '2060-05-15', taxa: 0.0670, pu: 0 },
];

function irRateRf(dias: number): number {
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.200;
  if (dias <= 720) return 0.175;
  return 0.150;
}

function grossToNetRf(grossAa: number, anos: number, taxaB3: number): number {
  if (anos <= 0) return 0.0;
  const dias = Math.floor(anos * 365);
  const ir = irRateRf(dias);
  const acum = Math.pow(1 + grossAa, anos) - 1;
  let liq = acum * (1 - ir);
  liq -= taxaB3 * anos;
  return liq > -1 ? Math.max(Math.pow(1 + liq, 1 / anos) - 1, 0.0) : 0.0;
}

// ---- SECTION 4: CATÁLOGO DE ATIVOS ----
export function buildCatalog(view: MarketAssumptions): Record<string, Asset> {
  const catalog: Record<string, Asset> = {};
  const today = new Date();

  FALLBACK_BONDS.forEach(b => {
    const venc = new Date(b.venc);
    const anos = (venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (anos < 0.08) return;

    let cat = 'outro';
    if (b.tipo.includes('Selic')) cat = 'selic';
    else if (b.tipo.includes('IPCA') || b.nome.includes('NTN-B')) cat = 'ipca';
    else if (b.tipo.includes('Prefixado') || ['LTN', 'NTN-F'].includes(b.nome)) cat = 'prefixado';

    if (cat === 'outro') return;

    let rb = b.taxa;
    if (cat === 'ipca') rb = (1 + b.taxa) * (1 + view.ipca_esperado) - 1;
    else if (cat === 'selic') rb = view.selic_esperada + b.taxa;

    const rl = grossToNetRf(rb, anos, view.taxa_b3);
    
    let vol = 0.05;
    if (cat === 'selic') vol = 0.005;
    else if (cat === 'prefixado') vol = Math.min(0.025 + anos * 0.011, 0.20);
    else if (cat === 'ipca') vol = Math.min(0.030 + anos * 0.009, 0.20);

    let color = '#1B4332';
    if (cat === 'prefixado') color = anos < 5 ? '#264653' : '#2A9D8F';
    else if (cat === 'ipca') {
      if (anos <= 5) color = '#40916C';
      else if (anos <= 10) color = '#52B788';
      else if (anos <= 20) color = '#74C69D';
      else if (anos <= 30) color = '#95D5B2';
      else color = '#B7E4C7';
    }

    const year = venc.getFullYear();
    const id = `${b.nome}_${year}`.toLowerCase().replace(/ /g, '_').replace(/-/g, '');
    let label = `${b.nome} ${year}`;
    if (b.tipo.includes('Juros Semestrais')) label += ' c/ cupom';
    else if (b.nome.includes('PRINCIPAL')) label += ' princ.';

    catalog[id] = { id, label, cat, ret_b: Number(rb.toFixed(4)), ret_l: Number(rl.toFixed(4)), vol: Number(vol.toFixed(4)), color, anos: Number(anos.toFixed(2)) };
  });

  const divRet = equityExpectedReturn(view, 'div');
  const grwRet = equityExpectedReturn(view, 'growth');

  catalog['dividend_portfolio'] = {
    id: 'dividend_portfolio', label: 'Carteira Dividendos', cat: 'equity',
    ret_b: Number(divRet.toFixed(4)), ret_l: Number(divRet.toFixed(4)), vol: view.eq_div_vol, color: '#D4A017', anos: 0
  };
  catalog['portfolio_z'] = {
    id: 'portfolio_z', label: 'Portfolio Z (Crescimento)', cat: 'equity',
    ret_b: Number(grwRet.toFixed(4)), ret_l: Number((grwRet * (1 - view.ir_equity)).toFixed(4)), vol: view.eq_growth_vol, color: '#E63946', anos: 0
  };

  return catalog;
}

export function goalToRules(goal: Goal): Record<string, any> {
  let maxEq = 0.85, floorMin = 0.20, targetP = 0.65;
  if (goal.nature === 'essential') {
    maxEq = 0.30; floorMin = 0.70; targetP = 0.85;
  }

  if (goal.priority <= 1) {
    maxEq = Math.min(maxEq, 0.40); floorMin = Math.max(floorMin, 0.60); targetP = Math.max(targetP, 0.80);
  } else if (goal.priority >= 4) {
    maxEq = Math.min(maxEq + 0.10, 0.85); floorMin = Math.max(floorMin - 0.10, 0.10);
  }

  let minLiq = 0.08;
  if (goal.liquidity === 'low') minLiq = 0.03;
  if (goal.liquidity === 'high') minLiq = 0.20;

  let horizonClass = 'long';
  if (goal.years <= 3) horizonClass = 'short';
  else if (goal.years <= 10) horizonClass = 'medium';

  const bands = {
    short: [0.5, 3],
    medium: [2, 8],
    long: [5, 25],
  };
  const durationBand = bands[horizonClass as keyof typeof bands];

  const riskEqMap: Record<string, number> = { conservative: 0.25, moderate: 0.52, aggressive: 0.78, ultra_aggressive: 0.85 };
  maxEq = Math.min(maxEq, riskEqMap[goal.risk] || 0.45);

  let minEqFloor = 0.20;
  if (goal.years <= 2 && goal.nature === 'essential') minEqFloor = 0.10;
  else if (goal.target === 0 && goal.priority === 1) minEqFloor = 0.00;

  maxEq = Math.max(maxEq, minEqFloor);

  return {
    max_equity: maxEq,
    min_equity: minEqFloor,
    min_liquidity: minLiq,
    duration_band: durationBand,
    floor_min: floorMin,
    target_prob: targetP,
  };
}

// ---- SECTION 6: FLOOR REALISTA ----
export function selectFloorAnchor(years: number, catalog: Record<string, Asset>): Asset | null {
  const vals = Object.values(catalog);
  const princ = vals.filter(a => a.cat === 'ipca' && a.label.toLowerCase().includes('princ'));
  if (princ.length > 0) return princ.reduce((prev, curr) => Math.abs(curr.anos - years) < Math.abs(prev.anos - years) ? curr : prev);
  const ipca = vals.filter(a => a.cat === 'ipca');
  if (ipca.length > 0) return ipca.reduce((prev, curr) => Math.abs(curr.anos - years) < Math.abs(prev.anos - years) ? curr : prev);
  const pref = vals.filter(a => a.cat === 'prefixado');
  if (pref.length > 0) return pref.reduce((prev, curr) => Math.abs(curr.anos - years) < Math.abs(prev.anos - years) ? curr : prev);
  return null;
}

export function buildRealFloor(target: number, savings: number, monthly: number, years: number, view: MarketAssumptions, catalog: Record<string, Asset>, safetyMargin = 1.05) {
  const anchor = selectFloorAnchor(years, catalog);
  let netAa = 0, anchorId: string | null = null, anchorLabel = '', realYieldUsed: number | null = null;
  
  if (anchor) {
    netAa = anchor.ret_l;
    anchorId = anchor.id;
    anchorLabel = anchor.label;
    realYieldUsed = anchor.cat === 'ipca' ? (anchor.ret_b - view.ipca_esperado) / (1 + view.ipca_esperado) : null;
  } else {
    const real = realYieldFor(view, years);
    const nominal = (1 + real) * (1 + view.ipca_esperado) - 1;
    netAa = grossToNetRf(nominal, years, view.taxa_b3);
    anchorLabel = `curva real ${years.toFixed(0)}a (sintético)`;
    realYieldUsed = real;
  }

  const rM = netAa > 0 ? Math.pow(1 + netAa, 1 / 12) - 1 : 0;
  const n = Math.round(years * 12);
  const fvLump = savings * Math.pow(1 + rM, n);
  const fvAnn = monthly * (rM > 0 ? (Math.pow(1 + rM, n) - 1) / rM : n);
  const fvTotal = fvLump + fvAnn;
  const twm = target * safetyMargin;

  if (fvTotal >= twm) {
    const floorPct = Math.min(twm / fvTotal, 1.0);
    return {
      achievable: true, floor_pct: Number(floorPct.toFixed(4)), upside_pct: Number((1 - floorPct).toFixed(4)),
      anchor_id: anchorId, anchor_label: anchorLabel, net_yield_used: netAa, real_yield_used: realYieldUsed,
      fv_at_floor: fvTotal, excess: Number((fvTotal / twm).toFixed(3)), deficit: 0.0,
      monthly_needed: monthly, floor_monthly: Number((monthly * floorPct).toFixed(2)), upside_monthly: Number((monthly * (1 - floorPct)).toFixed(2)), safety_margin: safetyMargin
    };
  }

  const need = rM > 0 ? (twm - savings * Math.pow(1 + rM, n)) / ((Math.pow(1 + rM, n) - 1) / rM) : (twm - savings) / Math.max(n, 1);
  return {
    achievable: false, floor_pct: 1.0, upside_pct: 0.0,
    anchor_id: anchorId, anchor_label: anchorLabel, net_yield_used: netAa, real_yield_used: realYieldUsed,
    fv_at_floor: fvTotal, excess: Number((fvTotal / twm).toFixed(3)), deficit: twm - fvTotal,
    monthly_needed: Math.max(need, 0), floor_monthly: monthly, upside_monthly: 0.0, safety_margin: safetyMargin
  };
}

// ---- SECTION 7: MOTOR DE ALOCAÇÃO ----
function findBest(cat: string, minA: number, maxA: number, catalog: Record<string, Asset>): string | null {
  let best: string | null = null;
  for (const aid in catalog) {
    const p = catalog[aid];
    if (p.cat !== cat || p.anos < minA || p.anos > maxA) continue;
    if (!best || p.ret_l > catalog[best].ret_l) best = aid;
  }
  return best;
}

function selicId(catalog: Record<string, Asset>): string {
  for (const aid in catalog) {
    if (catalog[aid].cat === 'selic') return aid;
  }
  return Object.keys(catalog)[0];
}

function resolveFiSplit(years: number, rules: Record<string, any>, catalog: Record<string, Asset>): Record<string, number> {
  const s = selicId(catalog);
  const [bandMin, bandMax] = rules.duration_band;
  
  const mix: Record<string, number> = { [s]: rules.min_liquidity };
  const remaining = 1.0 - mix[s];

  if (years <= 3) {
    const pc = findBest('prefixado', 0, 4, catalog) || s;
    const ic = findBest('ipca', 0, 5, catalog) || s;
    mix[pc] = (mix[pc] || 0) + remaining * 0.55;
    mix[ic] = (mix[ic] || 0) + remaining * 0.45;
  } else if (years <= 10) {
    const ic = findBest('ipca', Math.max(bandMin, 2), Math.min(bandMax, 6), catalog) || s;
    const im = findBest('ipca', Math.max(bandMin, 5), Math.min(bandMax, 10), catalog) || ic;
    let icup: string | null = null;
    for (const aid in catalog) {
      const p = catalog[aid];
      if (p.cat === 'ipca' && p.label.toLowerCase().includes('cupom') && p.anos >= 6 && p.anos <= 12) {
        if (!icup || p.ret_l > catalog[icup].ret_l) icup = aid;
      }
    }
    icup = icup || im;
    mix[ic] = (mix[ic] || 0) + remaining * 0.30;
    mix[im] = (mix[im] || 0) + remaining * 0.30;
    mix[icup] = (mix[icup] || 0) + remaining * 0.40;
  } else {
    const im = findBest('ipca', Math.max(bandMin, 5), 15, catalog) || s;
    const il = findBest('ipca', 10, Math.min(bandMax, 25), catalog) || im;
    const iu = findBest('ipca', 20, Math.max(bandMax, 40), catalog) || il;
    let icup: string | null = null;
    for (const aid in catalog) {
      const p = catalog[aid];
      if (p.cat === 'ipca' && p.label.toLowerCase().includes('cupom') && p.anos >= 8 && p.anos <= 25) {
        if (!icup || p.ret_l > catalog[icup].ret_l) icup = aid;
      }
    }
    icup = icup || il;
    mix[im] = (mix[im] || 0) + remaining * 0.15;
    mix[icup] = (mix[icup] || 0) + remaining * 0.35;
    mix[il] = (mix[il] || 0) + remaining * 0.30;
    mix[iu] = (mix[iu] || 0) + remaining * 0.20;
  }

  let total = 0;
  for (const v of Object.values(mix)) total += v;
  const res: Record<string, number> = {};
  for (const k in mix) {
    if (catalog[k]) res[k] = mix[k] / total;
  }
  return res;
}

function resolveEquitySplit(rules: Record<string, any>, risk?: string): number {
  let divShare = 0.50;
  if (rules.max_equity >= 0.80) divShare = 0.20;
  else if (rules.max_equity >= 0.60) divShare = 0.35;
  else if (rules.max_equity >= 0.35) divShare = 0.65;
  else divShare = 1.00;

  if (risk === 'conservative') divShare = Math.max(divShare, 0.80);
  return divShare;
}

export function algoAllocation(target: number, savings: number, monthly: number, years: number, rules: Record<string, any>, view: MarketAssumptions, catalog: Record<string, Asset>) {
  let floor: any = null;
  let fp = rules.floor_min;

  if (target && target > 0) {
    floor = buildRealFloor(target, savings, monthly, years, view, catalog);
    fp = Math.max(floor.floor_pct, rules.floor_min);
  }

  fp = Math.min(fp, 1.0);
  const up = Math.min(1.0 - fp, rules.max_equity);
  fp = 1.0 - up;

  const fiMix = resolveFiSplit(years, rules, catalog);
  const weights: Record<string, number> = {};
  for (const k in fiMix) weights[k] = fp * fiMix[k];

  const divShare = resolveEquitySplit(rules);

  weights['dividend_portfolio'] = up * divShare;
  weights['portfolio_z'] = up * (1 - divShare);

  return { weights, floor };
}

export function applyManagerView(algoW: Record<string, number>, view: MarketAssumptions, catalog: Record<string, Asset>, minSelicFloor?: number): Record<string, number> {
  if (view.conviction === 0) return { ...algoW };

  const w = { ...algoW };

  for (const [cat, tilt] of Object.entries(view.macro_tilts)) {
    const actual = tilt * view.conviction;
    const catAssets = Object.entries(w).filter(([k]) => catalog[k] && catalog[k].cat === cat);
    if (catAssets.length === 0) continue;
    const total = catAssets.reduce((sum, [_, v]) => sum + v, 0);
    if (total > 0) {
      for (const [aid, weight] of catAssets) {
        const share = weight / total;
        w[aid] = Math.max(weight + actual * share, 0);
      }
    }
  }

  const sid = selicId(catalog);
  const selicFloor = Math.max(view.selic_min, minSelicFloor || 0);
  if ((w[sid] || 0) < selicFloor) {
    const deficit = selicFloor - (w[sid] || 0);
    w[sid] = selicFloor;
    const others = Object.entries(w).filter(([k, v]) => k !== sid && v > 0.01);
    const ot = others.reduce((sum, [_, v]) => sum + v, 0);
    if (ot > 0) {
      for (const [k, v] of others) {
        w[k] = v - deficit * (v / ot);
      }
    }
  }

  const eqTotal = Object.entries(w).reduce((sum, [k, v]) => sum + (catalog[k]?.cat === 'equity' ? v : 0), 0);
  if (eqTotal > view.equity_max) {
    const scale = view.equity_max / eqTotal;
    const excess = eqTotal - view.equity_max;
    const fiKeys = Object.keys(w).filter(k => catalog[k]?.cat !== 'equity' && w[k] > 0);
    const fiTot = fiKeys.reduce((sum, k) => sum + w[k], 0);
    for (const k of Object.keys(w)) {
      if (catalog[k]?.cat === 'equity') w[k] *= scale;
    }
    if (fiTot > 0) {
      for (const k of fiKeys) w[k] += excess * (w[k] / fiTot);
    }
  }

  for (const k of Object.keys(w)) {
    if (w[k] > view.single_max) w[k] = view.single_max;
  }

  return w;
}

function cleanW(w: Record<string, number>, catalog: Record<string, Asset>, minW = 0.005): Record<string, number> {
  const c: Record<string, number> = {};
  let total = 0;
  for (const k in w) {
    if (w[k] >= minW && catalog[k]) {
      c[k] = w[k];
      total += w[k];
    }
  }
  if (total === 0) total = 1;
  const sortedKeys = Object.keys(c).sort((a, b) => c[b] - c[a]);
  const res: Record<string, number> = {};
  for (const k of sortedKeys) res[k] = Number((c[k] / total).toFixed(4));
  return res;
}

export function enforceMinEquityAllocation(weights: Record<string, number>, goal: Goal, rules: Record<string, any>, catalog: Record<string, Asset>, minEquity = 0.20) {
  const ruleMinEq = rules.min_equity !== undefined ? rules.min_equity : minEquity;
  const effMin = ruleMinEq > 0 ? Math.max(ruleMinEq, minEquity) : 0.0;

  const equityIds = Object.keys(catalog).filter(k => catalog[k].cat === 'equity');
  const selicIds = Object.keys(catalog).filter(k => catalog[k].cat === 'selic');
  const otherRfIds = Object.keys(catalog).filter(k => ['ipca', 'prefixado'].includes(catalog[k].cat));

  const newW = { ...weights };
  const eqBefore = equityIds.reduce((sum, aid) => sum + (newW[aid] || 0), 0);

  const log = {
    equity_before: eqBefore, equity_after: eqBefore, deficit_corrected: 0.0,
    reduced_assets: {} as Record<string, number>, increased_assets: {} as Record<string, number>,
    forced: false, warnings: [] as string[], min_equity_applied: effMin
  };

  if (effMin <= 0 || eqBefore >= effMin - 1e-9) return { newW, log };

  const deficit = effMin - eqBefore;
  log.deficit_corrected = deficit;
  log.forced = true;

  const otherRfTotal = otherRfIds.reduce((sum, aid) => sum + (newW[aid] || 0), 0);
  const selicTotal = selicIds.reduce((sum, aid) => sum + (newW[aid] || 0), 0);
  const minLiq = rules.min_liquidity || 0.0;
  let selicDisponivel = Math.max(0, selicTotal - minLiq);

  if (otherRfTotal + selicDisponivel < deficit - 1e-9) {
    if (otherRfTotal + selicTotal >= deficit - 1e-9) {
      log.warnings.push(`Para suprir min_equity (${(effMin*100).toFixed(0)}%), foi necessário reduzir Selic abaixo do piso de liquidez (${(minLiq*100).toFixed(0)}%).`);
      selicDisponivel = Math.max(0, deficit - otherRfTotal);
    } else {
      log.warnings.push('Não há renda fixa suficiente para elevar equity ao mínimo.');
      return { newW, log };
    }
  }

  const cutFromOther = Math.min(deficit, otherRfTotal);
  const cutFromSelic = Math.max(0, deficit - cutFromOther);

  if (cutFromOther > 0 && otherRfTotal > 0) {
    for (const aid of otherRfIds) {
      const w = newW[aid] || 0;
      if (w <= 0) continue;
      const cut = w * (cutFromOther / otherRfTotal);
      newW[aid] = Math.max(0.0, w - cut);
      log.reduced_assets[aid] = cut;
    }
  }

  if (cutFromSelic > 0 && selicTotal > 0) {
    for (const aid of selicIds) {
      const w = newW[aid] || 0;
      if (w <= 0) continue;
      const cut = w * (cutFromSelic / selicTotal);
      newW[aid] = Math.max(0.0, w - cut);
      log.reduced_assets[aid] = cut;
    }
  }

  const divShare = resolveEquitySplit(rules, goal.risk);

  const divId = 'dividend_portfolio';
  const zId = 'portfolio_z';
  let addDiv = deficit * divShare;
  let addZ = deficit * (1 - divShare);

  if (catalog[divId]) {
    newW[divId] = (newW[divId] || 0) + addDiv;
    log.increased_assets[divId] = addDiv;
  } else {
    addZ += addDiv; addDiv = 0;
  }

  if (catalog[zId] && addZ > 0) {
    newW[zId] = (newW[zId] || 0) + addZ;
    log.increased_assets[zId] = addZ;
  }

  let total = 0;
  for (const k in newW) {
    if (newW[k] < 0) newW[k] = 0;
    total += newW[k];
  }
  if (total > 0 && Math.abs(total - 1.0) > 1e-6) {
    for (const k in newW) newW[k] /= total;
  }

  log.equity_after = equityIds.reduce((sum, aid) => sum + (newW[aid] || 0), 0);

  return { newW, log };
}

function applyEquityRiskBudgetBias(weights: Record<string, number>, goal: Goal, rules: Record<string, any>, view: MarketAssumptions, catalog: Record<string, Asset>) {
  const equityIds = Object.keys(catalog).filter(k => catalog[k].cat === 'equity');
  const selicIds = Object.keys(catalog).filter(k => catalog[k].cat === 'selic');
  const otherRfIds = Object.keys(catalog).filter(k => ['ipca', 'prefixado'].includes(catalog[k].cat));

  const eqBefore = equityIds.reduce((sum, aid) => sum + (weights[aid] || 0), 0);
  const currentRisk = portfolioRisk(weights, view, catalog).sigma;
  const [, maxProfileVol] = profileTargetVol(goal.risk);
  const targetProfileVol = Math.max(maxProfileVol - 0.0001, 0);

  const log = {
    equity_before: eqBefore,
    equity_after: eqBefore,
    added_equity: 0.0,
    sigma_before: currentRisk,
    sigma_after: currentRisk,
    skipped_reason: '',
  };

  if (currentRisk >= targetProfileVol - 1e-9) {
    log.skipped_reason = 'risk_budget_exhausted';
    return { newW: weights, log };
  }

  const baseIncreaseMap: Record<string, number> = {
    conservative: 0.03,
    moderate: 0.07,
    aggressive: 0.08,
    ultra_aggressive: 0.05,
  };

  let desiredIncrease = baseIncreaseMap[goal.risk] || 0.05;
  if (goal.nature === 'essential' || goal.liquidity === 'high' || goal.years <= 3) {
    desiredIncrease *= 0.5;
  }

  const maxEquity = Math.min(rules.max_equity || view.equity_max, view.equity_max);
  const equityRoom = Math.max(0, maxEquity - eqBefore);
  const otherRfTotal = otherRfIds.reduce((sum, aid) => sum + (weights[aid] || 0), 0);
  const selicTotal = selicIds.reduce((sum, aid) => sum + (weights[aid] || 0), 0);
  const minSelic = Math.max(rules.min_liquidity || 0.0, view.selic_min || 0.0);
  const availableSelic = Math.max(0, selicTotal - minSelic);

  const divId = 'dividend_portfolio';
  const zId = 'portfolio_z';
  const singleMax = view.single_max || 1.0;
  const equityAssetRoom =
    (catalog[divId] ? Math.max(0, singleMax - (weights[divId] || 0)) : 0) +
    (catalog[zId] ? Math.max(0, singleMax - (weights[zId] || 0)) : 0);

  const maxTransfer = Math.min(desiredIncrease, equityRoom, otherRfTotal + availableSelic, equityAssetRoom);
  if (maxTransfer <= 1e-9) {
    log.skipped_reason = 'no_transfer_room';
    return { newW: weights, log };
  }

  const divShare = resolveEquitySplit(rules, goal.risk);

  const buildCandidate = (amount: number): Record<string, number> => {
    const newW = { ...weights };
    const cutFromOther = Math.min(amount, otherRfTotal);
    const cutFromSelic = Math.max(0, amount - cutFromOther);

    if (cutFromOther > 0 && otherRfTotal > 0) {
      for (const aid of otherRfIds) {
        const w = newW[aid] || 0;
        if (w <= 0) continue;
        newW[aid] = Math.max(0, w - w * (cutFromOther / otherRfTotal));
      }
    }

    if (cutFromSelic > 0 && selicTotal > 0) {
      for (const aid of selicIds) {
        const w = newW[aid] || 0;
        if (w <= 0) continue;
        newW[aid] = Math.max(0, w - w * (cutFromSelic / selicTotal));
      }
    }

    let remaining = amount;
    const addDivTarget = amount * divShare;
    const addZTarget = amount - addDivTarget;
    const divRoom = catalog[divId] ? Math.max(0, singleMax - (newW[divId] || 0)) : 0;
    const zRoom = catalog[zId] ? Math.max(0, singleMax - (newW[zId] || 0)) : 0;

    const addDiv = Math.min(addDivTarget, divRoom);
    if (addDiv > 0) {
      newW[divId] = (newW[divId] || 0) + addDiv;
      remaining -= addDiv;
    }

    const addZ = Math.min(addZTarget, zRoom);
    if (addZ > 0) {
      newW[zId] = (newW[zId] || 0) + addZ;
      remaining -= addZ;
    }

    if (remaining > 1e-9) {
      const preferredIds = divShare >= 0.5 ? [divId, zId] : [zId, divId];
      for (const aid of preferredIds) {
        if (!catalog[aid]) continue;
        const room = Math.max(0, singleMax - (newW[aid] || 0));
        const add = Math.min(remaining, room);
        if (add > 0) {
          newW[aid] = (newW[aid] || 0) + add;
          remaining -= add;
        }
      }
    }

    let total = 0;
    for (const k in newW) {
      if (newW[k] < 0) newW[k] = 0;
      total += newW[k];
    }
    if (total > 0 && Math.abs(total - 1.0) > 1e-6) {
      for (const k in newW) newW[k] /= total;
    }

    return newW;
  };

  let acceptedAmount = maxTransfer;
  let candidate = buildCandidate(acceptedAmount);
  let candidateRisk = portfolioRisk(candidate, view, catalog).sigma;

  if (candidateRisk > targetProfileVol) {
    let lo = 0.0;
    let hi = maxTransfer;
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      const midCandidate = buildCandidate(mid);
      const midRisk = portfolioRisk(midCandidate, view, catalog).sigma;
      if (midRisk <= targetProfileVol) lo = mid;
      else hi = mid;
    }
    acceptedAmount = lo;
    candidate = buildCandidate(acceptedAmount);
    candidateRisk = portfolioRisk(candidate, view, catalog).sigma;
  }

  if (acceptedAmount <= 1e-4) {
    log.skipped_reason = 'risk_budget_too_small';
    return { newW: weights, log };
  }

  log.added_equity = acceptedAmount;
  log.equity_after = equityIds.reduce((sum, aid) => sum + (candidate[aid] || 0), 0);
  log.sigma_after = candidateRisk;

  return { newW: candidate, log };
}

function limitRiskToProfile(weights: Record<string, number>, goal: Goal, view: MarketAssumptions, catalog: Record<string, Asset>) {
  const equityIds = Object.keys(catalog).filter(k => catalog[k].cat === 'equity');
  const eqBefore = equityIds.reduce((sum, aid) => sum + (weights[aid] || 0), 0);
  const currentRisk = portfolioRisk(weights, view, catalog).sigma;
  const [, maxProfileVol] = profileTargetVol(goal.risk);
  const targetProfileVol = Math.max(maxProfileVol - 0.0001, 0);

  const log = {
    equity_before: eqBefore,
    equity_after: eqBefore,
    sigma_before: currentRisk,
    sigma_after: currentRisk,
    reduced_equity: 0.0,
    applied: false,
  };

  if (currentRisk <= targetProfileVol + 1e-9 || eqBefore <= 0) {
    return { newW: weights, log };
  }

  const sid = selicId(catalog);
  const buildCandidate = (reduction: number): Record<string, number> => {
    const newW = { ...weights };
    for (const aid of equityIds) {
      const w = newW[aid] || 0;
      if (w <= 0) continue;
      newW[aid] = Math.max(0, w - w * (reduction / eqBefore));
    }
    newW[sid] = (newW[sid] || 0) + reduction;

    let total = 0;
    for (const k in newW) {
      if (newW[k] < 0) newW[k] = 0;
      total += newW[k];
    }
    if (total > 0 && Math.abs(total - 1.0) > 1e-6) {
      for (const k in newW) newW[k] /= total;
    }

    return newW;
  };

  let lo = 0.0;
  let hi = eqBefore;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const candidate = buildCandidate(mid);
    const sigma = portfolioRisk(candidate, view, catalog).sigma;
    if (sigma <= targetProfileVol) hi = mid;
    else lo = mid;
  }

  const finalW = buildCandidate(hi);
  const finalRisk = portfolioRisk(finalW, view, catalog).sigma;
  log.applied = true;
  log.reduced_equity = hi;
  log.equity_after = equityIds.reduce((sum, aid) => sum + (finalW[aid] || 0), 0);
  log.sigma_after = finalRisk;

  return { newW: finalW, log };
}

function enforceSelicFloor(weights: Record<string, number>, rules: Record<string, any>, view: MarketAssumptions, catalog: Record<string, Asset>) {
  const sid = selicId(catalog);
  const floor = Math.max(rules.min_liquidity || 0.0, view.selic_min || 0.0);
  const current = weights[sid] || 0;
  if (current >= floor - 1e-9) return weights;

  const newW = { ...weights };
  const deficit = floor - current;
  const preferredCutIds = Object.keys(catalog).filter(k => k !== sid && ['ipca', 'prefixado'].includes(catalog[k].cat) && (newW[k] || 0) > 0);
  const fallbackCutIds = Object.keys(catalog).filter(k => k !== sid && catalog[k].cat === 'equity' && (newW[k] || 0) > 0);

  let remaining = deficit;
  for (const ids of [preferredCutIds, fallbackCutIds]) {
    if (remaining <= 1e-9) break;
    const total = ids.reduce((sum, aid) => sum + (newW[aid] || 0), 0);
    const cut = Math.min(remaining, total);
    if (cut <= 0 || total <= 0) continue;
    for (const aid of ids) {
      const w = newW[aid] || 0;
      if (w <= 0) continue;
      newW[aid] = Math.max(0, w - w * (cut / total));
    }
    remaining -= cut;
  }

  newW[sid] = current + deficit - Math.max(remaining, 0);

  let total = 0;
  for (const k in newW) {
    if (newW[k] < 0) newW[k] = 0;
    total += newW[k];
  }
  if (total > 0 && Math.abs(total - 1.0) > 1e-6) {
    for (const k in newW) newW[k] /= total;
  }

  return newW;
}

export function buildPortfolio(goal: Goal | null, client: Client, view: MarketAssumptions, catalog: Record<string, Asset>, override?: Record<string, number>) {
  if (!goal) {
    goal = { name: 'Crescimento', target: 0, years: 10, risk: 'aggressive', priority: 5, nature: 'aspirational', liquidity: 'medium' };
  }

  const rules = goalToRules(goal);
  const { weights: algoW, floor } = algoAllocation(goal.target, client.savings, client.monthly, goal.years, rules, view, catalog);
  
  let gestorW = applyManagerView(algoW, view, catalog, rules.min_liquidity);
  
  const afterOvrClean = cleanW(gestorW, catalog);
  const { newW: minEquityW, log: enforceLog } = enforceMinEquityAllocation(afterOvrClean, goal, rules, catalog, 0.20);
  const { newW: equityBiasedW, log: equityBiasLog } = applyEquityRiskBudgetBias(minEquityW, goal, rules, view, catalog);
  const { newW: riskLimitedW, log: riskLimitLog } = limitRiskToProfile(equityBiasedW, goal, view, catalog);
  const finalW = enforceSelicFloor(riskLimitedW, rules, view, catalog);

  return {
    alloc: cleanW(finalW, catalog),
    algo_alloc: cleanW(algoW, catalog),
    pre_enforce: afterOvrClean,
    rules, floor, goal, enforce_log: enforceLog, equity_bias_log: equityBiasLog, risk_limit_log: riskLimitLog
  };
}

/**
 * Une múltiplos portfólios individuais em uma única Carteira Mestra Consolidada.
 * Pondera cada objetivo igualmente ou pode ser expandido para ponderar por montante.
 */
export function consolidatePortfolios(results: any[], catalog: Record<string, Asset>): Record<string, number> {
  if (results.length === 0) return {};
  if (results.length === 1) return results[0].alloc;

  const consolidated: Record<string, number> = {};
  const n = results.length;

  for (const res of results) {
    const alloc = res.alloc as Record<string, number>;
    for (const [aid, weight] of Object.entries(alloc)) {
      consolidated[aid] = (consolidated[aid] || 0) + (weight / n);
    }
  }

  return cleanW(consolidated, catalog);
}

type ContributionFactors = {
  priority: number;
  urgency: number;
  nature: number;
  liquidity: number;
};

export type ContributionAssetAllocation = {
  id: string;
  label: string;
  percentual: number;
  aporte_mensal: number;
};

export type ContributionGoalAllocation = {
  goal_index: number;
  goal_name: string;
  aporte_mensal: number;
  aporte_necessario_mensal: number;
  percentual: number;
  cobertura: number | null;
  prioridade: number;
  fatores: ContributionFactors;
  ativos: ContributionAssetAllocation[];
};

export type ContributionPlan = {
  total_mensal: number;
  ideal_mensal: number;
  goal_count: number;
  objetivos: ContributionGoalAllocation[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundMoney(value: number): number {
  return Number((Math.max(value, 0)).toFixed(2));
}

function roundSignedMoney(value: number): number {
  return Number(value.toFixed(2));
}

function contributionFactors(goal: Goal): ContributionFactors {
  return {
    priority: 0.75 + goal.priority * 0.25,
    urgency: clamp(1 + (8 - goal.years) / 12, 0.65, 1.75),
    nature: goal.nature === 'essential' ? 1.35 : 1.0,
    liquidity: goal.liquidity === 'high' ? 1.12 : goal.liquidity === 'low' ? 0.95 : 1.0,
  };
}

function factorProduct(factors: ContributionFactors): number {
  return factors.priority * factors.urgency * factors.nature * factors.liquidity;
}

function monthlyNeededForGoal(goal: Goal, savingsShare: number, annualReturn: number, safetyMargin = 1.05): number {
  if (!goal.target || goal.target <= 0) return 0;

  const nMonths = Math.max(1, Math.round(goal.years * 12));
  const monthlyReturn = annualReturn > -0.99 ? Math.pow(1 + Math.max(annualReturn, 0), 1 / 12) - 1 : 0;
  const target = goal.target * safetyMargin;
  const futureSavings = savingsShare * Math.pow(1 + monthlyReturn, nMonths);
  const remaining = target - futureSavings;

  if (remaining <= 0) return 0;

  const annuityFactor = monthlyReturn > 0
    ? (Math.pow(1 + monthlyReturn, nMonths) - 1) / monthlyReturn
    : nMonths;

  return remaining / Math.max(annuityFactor, 1);
}

export function buildContributionPlan(
  goals: Goal[],
  client: Client,
  portfolios: Array<{ alloc: Record<string, number> }>,
  view: MarketAssumptions,
  catalog: Record<string, Asset>
): ContributionPlan {
  const totalMonthly = roundMoney(client.monthly || 0);
  const activeGoals: Goal[] = goals.length > 0 ? goals : [{
    name: 'Crescimento',
    target: 0,
    years: 10,
    risk: 'aggressive' as const,
    priority: 3,
    nature: 'aspirational' as const,
    liquidity: 'medium' as const,
  }];

  const baseScores = activeGoals.map((goal) => {
    const factors = contributionFactors(goal);
    const targetBasis = goal.target > 0 ? goal.target : 1;
    return targetBasis * factorProduct(factors);
  });
  const baseTotal = baseScores.reduce((sum, value) => sum + value, 0) || activeGoals.length;

  const drafts = activeGoals.map((goal, index) => {
    const portfolio = portfolios[index] || portfolios[0] || { alloc: {} };
    const risk = portfolioRisk(portfolio.alloc, view, catalog);
    const savingsShare = client.savings * ((baseScores[index] || 1) / baseTotal);
    const needed = monthlyNeededForGoal(goal, savingsShare, risk.mu);
    const factors = contributionFactors(goal);
    const fallbackNeed = goal.target > 0
      ? (goal.target / Math.max(goal.years * 12, 1)) * 0.05
      : 1;
    const decisionNeed = Math.max(needed, fallbackNeed);
    const score = decisionNeed * factorProduct(factors);

    return {
      goal,
      index,
      portfolio,
      factors,
      needed,
      score,
    };
  });

  const scoreTotal = drafts.reduce((sum, item) => sum + item.score, 0) || drafts.length;
  const rawAllocations = drafts.map((item) => totalMonthly * (item.score / scoreTotal));
  const roundedAllocations = rawAllocations.map(roundMoney);
  const roundedTotal = roundMoney(roundedAllocations.reduce((sum, value) => sum + value, 0));
  const diff = roundSignedMoney(totalMonthly - roundedTotal);

  if (roundedAllocations.length > 0 && diff !== 0) {
    let adjustmentIndex = 0;
    for (let index = 1; index < rawAllocations.length; index++) {
      if (rawAllocations[index] > rawAllocations[adjustmentIndex]) adjustmentIndex = index;
    }
    roundedAllocations[adjustmentIndex] = roundMoney(roundedAllocations[adjustmentIndex] + diff);
  }

  const objetivos = drafts.map((item, index): ContributionGoalAllocation => {
    const monthly = roundedAllocations[index] || 0;
    const assets = Object.entries(item.portfolio.alloc)
      .sort(([, a], [, b]) => b - a)
      .map(([id, weight]) => ({
        id,
        label: catalog[id]?.label || id,
        percentual: Number(((weight as number) * 100).toFixed(2)),
        aporte_mensal: roundMoney(monthly * (weight as number)),
      }));

    return {
      goal_index: item.index,
      goal_name: item.goal.name,
      aporte_mensal: monthly,
      aporte_necessario_mensal: roundMoney(item.needed),
      percentual: totalMonthly > 0 ? Number(((monthly / totalMonthly) * 100).toFixed(2)) : 0,
      cobertura: item.needed > 0 ? Number((monthly / item.needed).toFixed(3)) : null,
      prioridade: item.goal.priority,
      fatores: item.factors,
      ativos: assets,
    };
  });

  return {
    total_mensal: totalMonthly,
    ideal_mensal: roundMoney(drafts.reduce((sum, item) => sum + item.needed, 0)),
    goal_count: activeGoals.length,
    objetivos,
  };
}

// ---- SECTION 8: RISK ENGINE ----
export function portfolioRisk(alloc: Record<string, number>, view: MarketAssumptions, catalog: Record<string, Asset>, liquid = true) {
  const assetIds = Object.keys(alloc);
  if (assetIds.length === 0) return { mu: 0, sigma: 0, sharpe: 0, var_95: 0, var_99: 0, contrib: {}, class_risk: {}, sigma_naive: 0 };

  const w = assetIds.map(aid => alloc[aid]);
  const rk = liquid ? 'ret_l' : 'ret_b';
  const rets = assetIds.map(aid => catalog[aid][rk as keyof Asset] as number);

  const Sigma = buildCovMatrix(assetIds, catalog);
  
  const wVec = math.matrix(w);
  const retsVec = math.matrix(rets);
  const SigmaMat = math.matrix(Sigma);
  
  const mu = Number(math.multiply(wVec, retsVec));
  const variance = Number(math.multiply(math.multiply(wVec, SigmaMat), wVec));
  const sigma = Math.sqrt(Math.max(variance, 0));

  let naiveVar = 0;
  for(let i=0; i<assetIds.length; i++){
    naiveVar += Math.pow(w[i] * catalog[assetIds[i]].vol, 2);
  }
  const sigmaNaive = Math.sqrt(naiveVar);

  const rf = view.selic_esperada;
  const sharpe = (mu - rf) / Math.max(sigma, 1e-6);

  const z95 = 1.645, z99 = 2.326;
  const var95 = Math.max(z95 * sigma - mu, 0);
  const var99 = Math.max(z99 * sigma - mu, 0);

  const Sw = math.multiply(SigmaMat, wVec) as math.Matrix;
  const SwArray = Sw.toArray() as number[];
  const contribVec = w.map((wi, i) => (wi * SwArray[i]) / Math.max(variance, 1e-9));
  
  const contrib: Record<string, number> = {};
  const classRisk: Record<string, number> = {};
  for(let i=0; i<assetIds.length; i++){
    contrib[assetIds[i]] = contribVec[i];
    const cls = assetClassLabel(assetIds[i], catalog[assetIds[i]]);
    classRisk[cls] = (classRisk[cls] || 0) + contribVec[i];
  }

  return { mu, sigma, sigma_naive: sigmaNaive, sharpe, var_95: var95, var_99: var99, contrib, class_risk: classRisk, asset_ids: assetIds, weights: w, cov: Sigma };
}

// ---- SECTION 9: MONTE CARLO ----
export const SCENARIOS = {
  base: { prob: 0.50, mu_shift: 0.000, vol_mult: 1.00, desc: 'Cenário central' },
  bull: { prob: 0.20, mu_shift: +0.040, vol_mult: 0.85, desc: 'Bull' },
  bear: { prob: 0.15, mu_shift: -0.060, vol_mult: 1.40, desc: 'Bear' },
  high_infl: { prob: 0.10, mu_shift: -0.025, vol_mult: 1.25, desc: 'Inflação alta' },
  high_rates: { prob: 0.05, mu_shift: -0.040, vol_mult: 1.30, desc: 'Juros altos' },
};

export function runMonteCarlo(alloc: Record<string, number>, savings: number, monthly: number, years: number, target: number | null, view: MarketAssumptions, catalog: Record<string, Asset>, nPaths = 10000) {
  const nMonths = Math.round(years * 12);
  const risk = portfolioRisk(alloc, view, catalog, true);
  const muP = risk.mu;
  const sigmaP = risk.sigma;

  const keys = Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[];
  const probs = keys.map(k => SCENARIOS[k].prob);
  const sumP = probs.reduce((a,b)=>a+b,0);
  const normProbs = probs.map(p => p/sumP);

  let successCount = 0;
  let realLossCount = 0;
  let nomLossCount = 0;
  const aportado = savings + monthly * nMonths;
  const realFactor = Math.pow(1 + view.ipca_esperado, years);

  let finalValues = new Float64Array(nPaths);
  let maxDrawdowns = new Float64Array(nPaths);

  for (let p = 0; p < nPaths; p++) {
    const scIdx = randomChoice(normProbs);
    const sc = SCENARIOS[keys[scIdx]];
    
    const muPath = muP + sc.mu_shift;
    const sigPath = sigmaP * sc.vol_mult;

    const muM = Math.pow(1 + Math.max(muPath, -0.99), 1/12) - 1;
    const sigM = sigPath / Math.sqrt(12);
    
    const varFactor = Math.log(1 + Math.pow(sigM, 2) / Math.max(Math.pow(1 + muM, 2), 1e-9));
    const sigLog = Math.sqrt(Math.max(varFactor, 0));
    const muLog = Math.log(Math.max(1 + muM, 1e-9)) - 0.5 * Math.pow(sigLog, 2);

    let bal = savings;
    let maxBal = bal;
    let maxDd = 0;

    for (let t = 0; t < nMonths; t++) {
      const z = standardNormal();
      const logRet = muLog + sigLog * z;
      const monthRet = Math.exp(logRet) - 1;
      
      bal = bal * (1 + monthRet) + monthly;
      if (bal > maxBal) maxBal = bal;
      const dd = (bal - maxBal) / Math.max(maxBal, 1);
      if (dd < maxDd) maxDd = dd;
    }

    finalValues[p] = bal;
    maxDrawdowns[p] = maxDd;

    if (target && bal >= target) successCount++;
    if ((bal / realFactor) < aportado) realLossCount++;
    if (bal < aportado) nomLossCount++;
  }

  finalValues.sort();
  const median = finalValues[Math.floor(nPaths * 0.5)];
  
  return {
    mu: muP, sigma: sigmaP, sharpe: risk.sharpe, var_95: risk.var_95, var_99: risk.var_99,
    prob_meta: target ? successCount / nPaths : null,
    prob_perda_real: realLossCount / nPaths,
    prob_perda_nom: nomLossCount / nPaths,
    aportado, median,
  };
}

// ---- SECTION 11: ANÁLISE DO PLANO (SCORE & TRAFFIC LIGHT) ----
export const RISK_CLASS_BANDS = [
  { lo: 0.00, hi: 0.05, label: 'conservadora' },
  { lo: 0.05, hi: 0.10, label: 'moderada' },
  { lo: 0.10, hi: 0.18, label: 'arrojada' },
  { lo: 0.18, hi: 1.00, label: 'agressiva' },
];

export function classifyPortfolio(sigma: number): string {
  for (const b of RISK_CLASS_BANDS) {
    if (sigma >= b.lo && sigma < b.hi) return b.label;
  }
  return 'agressiva';
}

function profileTargetVol(profile: string): [number, number] {
  const map: Record<string, [number, number]> = {
    conservative: [0.00, 0.06],
    moderate: [0.05, 0.11],
    aggressive: [0.09, 0.18],
    ultra_aggressive: [0.14, 0.30],
  };
  return map[profile] || [0.05, 0.15];
}

function herfindahl(weights: Record<string, number>): number {
  const w = Object.values(weights);
  const sum = w.reduce((a, b) => a + b, 0);
  if (sum === 0) return 1.0;
  return w.reduce((acc, v) => acc + Math.pow(v / sum, 2), 0);
}

function liquidityScore(alloc: Record<string, number>, catalog: Record<string, Asset>): number {
  let liq = 0.0;
  for (const [aid, w] of Object.entries(alloc)) {
    const a = catalog[aid];
    if (a.cat === 'selic' || (['prefixado', 'ipca'].includes(a.cat) && a.anos <= 2)) {
      liq += w;
    }
  }
  return liq;
}

function inflationProtection(alloc: Record<string, number>, catalog: Record<string, Asset>): number {
  return Object.entries(alloc).reduce((sum, [aid, w]) => sum + (['ipca', 'equity'].includes(catalog[aid].cat) ? w : 0), 0);
}

export function planTrafficLight(client: Client, goal: Goal, result: any, sim: any, view: MarketAssumptions, catalog: Record<string, Asset>, risk: any) {
  const alloc = result.alloc;
  const sigma = risk.sigma;
  const realClass = classifyPortfolio(sigma);
  const profile = goal.risk;

  let viab: [string, string, string, number];
  const p = sim.prob_meta;
  if (p === null) viab = ['yellow', 'Sem meta definida', 'Carteira de crescimento.', 0];
  else if (p >= 0.80) viab = ['green', 'Meta com folga', `Probabilidade: ${(p*100).toFixed(0)}%.`, p];
  else if (p >= 0.60) viab = ['yellow', 'Meta apertada', `Probabilidade: ${(p*100).toFixed(0)}%.`, p];
  else viab = ['red', 'Meta em risco', `Probabilidade: ${(p*100).toFixed(0)}%.`, p];

  const [lo, hi] = profileTargetVol(profile);
  let rsk: [string, string, string, number];
  if (sigma >= lo && sigma <= hi) rsk = ['green', 'Risco no perfil', `Compatível.`, sigma];
  else if (sigma > hi) rsk = ['red', 'Risco acima do perfil', `Mais volátil que esperado.`, sigma];
  else rsk = ['yellow', 'Risco abaixo do perfil', `Risco abaixo do potencial.`, sigma];

  const liq = liquidityScore(alloc, catalog);
  const threshold = goal.years <= 3 ? 0.20 : 0.05;
  let lq: [string, string, string, number];
  if (liq >= threshold && liq <= 0.50) lq = ['green', 'Liquidez adequada', `${(liq*100).toFixed(0)}% em liquidez.`, liq];
  else if (liq < threshold) lq = [goal.years <= 3 ? 'red' : 'yellow', 'Liquidez baixa', `Apenas ${(liq*100).toFixed(0)}%.`, liq];
  else lq = ['yellow', 'Excesso de caixa', `${(liq*100).toFixed(0)}% em liquidez.`, liq];

  const inf = inflationProtection(alloc, catalog);
  let ipro: [string, string, string, number];
  if (inf >= 0.50) ipro = ['green', 'Bem protegida', `${(inf*100).toFixed(0)}% protegido.`, inf];
  else if (inf >= 0.30) ipro = ['yellow', 'Proteção parcial', `${(inf*100).toFixed(0)}%.`, inf];
  else ipro = ['red', 'Pouca proteção', `${(inf*100).toFixed(0)}%.`, inf];

  const pM = ['conservative', 'moderate', 'aggressive', 'ultra_aggressive'].indexOf(profile);
  const rC = ['conservadora', 'moderada', 'arrojada', 'agressiva'].indexOf(realClass);
  const diff = Math.abs(pM - rC);
  let ad: [string, string, string, number];
  if (diff === 0) ad = ['green', 'Alinhada ao perfil', `Real: ${realClass}`, diff];
  else if (diff === 1) ad = ['yellow', 'Pequeno desalinhamento', `Real: ${realClass}`, diff];
  else ad = ['red', 'Desalinhada do perfil', `Real: ${realClass}`, diff];

  return {
    viability: { status: viab[0], title: viab[1], desc: viab[2], value: viab[3] },
    portfolio_risk: { status: rsk[0], title: rsk[1], desc: rsk[2], value: rsk[3] },
    liquidity: { status: lq[0], title: lq[1], desc: lq[2], value: lq[3] },
    inflation: { status: ipro[0], title: ipro[1], desc: ipro[2], value: ipro[3] },
    profile_match: { status: ad[0], title: ad[1], desc: ad[2], value: ad[3] },
  };
}

export function planScore(client: Client, goal: Goal, result: any, sim: any, view: MarketAssumptions, catalog: Record<string, Asset>, risk: any) {
  const alloc = result.alloc;
  const p = sim.prob_meta;
  const sProb = p !== null ? Math.min(p / 0.95, 1.0) * 100 : 60.0;

  const sigma = risk.sigma;
  const [lo, hi] = profileTargetVol(goal.risk);
  let sProfile = 100;
  if (sigma > hi) sProfile = Math.max(100 - (sigma - hi) * 500, 0);
  else if (sigma < lo) sProfile = Math.max(80 - (lo - sigma) * 300, 50);

  const liq = liquidityScore(alloc, catalog);
  let sLiq = 100;
  if (liq < 0.10) sLiq = liq / 0.10 * 100;
  else if (liq > 0.30) sLiq = Math.max(100 - (liq - 0.30) * 200, 40);

  const hhi = herfindahl(alloc);
  const sDiv = Math.min(Math.max(0, (1 - hhi) * 100 * 1.4), 100);

  const inf = inflationProtection(alloc, catalog);
  const sInf = Math.min(inf / 0.65 * 100, 100);

  const sharpe = risk.sharpe || 0;
  const sEff = Math.max(0, Math.min(sharpe / 0.40, 1.0)) * 100;

  const components = { prob_meta: sProb, profile_match: sProfile, liquidity: sLiq, diversification: sDiv, inflation: sInf, efficiency: sEff };
  const weights = { prob_meta: 30, profile_match: 15, liquidity: 15, diversification: 15, inflation: 15, efficiency: 10 };
  
  let total = 0;
  let totalW = 0;
  for (const k in components) {
    const w = weights[k as keyof typeof weights];
    total += components[k as keyof typeof components] * w;
    totalW += w;
  }
  total /= totalW;

  let rating = ['Crítico', '#E63946'];
  if (total >= 80) rating = ['Excelente', '#40916C'];
  else if (total >= 65) rating = ['Bom', '#74C69D'];
  else if (total >= 50) rating = ['Regular', '#E9C46A'];
  else if (total >= 35) rating = ['Frágil', '#F4A261'];

  return {
    score: Number(total.toFixed(1)),
    rating: rating[0],
    color: rating[1],
    components: {
      prob_meta: Number(sProb.toFixed(1)), profile_match: Number(sProfile.toFixed(1)), liquidity: Number(sLiq.toFixed(1)),
      diversification: Number(sDiv.toFixed(1)), inflation: Number(sInf.toFixed(1)), efficiency: Number(sEff.toFixed(1))
    },
    weights
  };
}
