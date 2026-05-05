# -*- coding: utf-8 -*-
"""
═══════════════════════════════════════════════════════════════════════════════
 PORTFOLIO BUILDER — VERSÃO INSTITUCIONAL 2.0
 ───────────────────────────────────────────────────────────────────────────
 Motor de alocação para wealth management privado / family office.

 ARQUITETURA EM 5 CAMADAS:

   1. PREMISSAS DO GESTOR    → visão macro estruturada (curva real,
                                IPCA, Selic, prêmios de risco, matriz de
                                covariância, convicção)
   2. OBJETIVOS DO CLIENTE   → prazo + prioridade + essencial/aspiracional
                                + liquidez. Cada objetivo gera REGRAS
                                concretas de alocação.
   3. CONSTRUÇÃO DE CARTEIRA → floor com Tesouro casado no prazo +
                                upside diversificado + tilts do gestor
                                + overrides pontuais.
   4. RISCO & SIMULAÇÃO      → covariância correta (não soma de variâncias!),
                                Monte Carlo lognormal com cenários macro,
                                VaR, drawdown máximo, risco de perda real,
                                Sharpe ratio.
   5. OUTPUT INSTITUCIONAL   → resumo executivo, narrativa, riscos,
                                análise de sensibilidade, aporte requerido.

 Roda em Google Colab. Runtime → Run all.
═══════════════════════════════════════════════════════════════════════════════
"""

# !pip install -q numpy pandas matplotlib ipywidgets tesouro-direto-br

from __future__ import annotations
from dataclasses import dataclass, field, replace
from datetime import datetime, date
from typing import Optional, Literal
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import matplotlib.patches as mpatches
import ipywidgets as widgets
from IPython.display import display, HTML, clear_output
import warnings, logging

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO, format='%(message)s')
log = logging.getLogger('pb2')

plt.rcParams.update({
    'figure.facecolor': '#0a0a0a', 'axes.facecolor': '#0e0e0e',
    'axes.edgecolor': '#333', 'axes.labelcolor': '#999',
    'text.color': '#ccc', 'xtick.color': '#666', 'ytick.color': '#666',
    'grid.color': '#1a1a1a', 'font.family': 'monospace', 'font.size': 9,
})


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 1 — PREMISSAS DO GESTOR  (CAMADA 1)
# ───────────────────────────────────────────────────────────────────────────
# Toda a visão macro do gestor está concentrada em UMA estrutura.
# Mudar um número aqui se propaga por todo o sistema (precificação,
# Monte Carlo, sensibilidade). É o ponto de "calibrar a casa".
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class MarketAssumptions:
    """Premissas macro do gestor — ponto único de verdade do modelo."""

    # ── Inflação e juros nominais ──────────────────────────────────────
    ipca_esperado:    float = 0.0420   # IPCA esperado de longo prazo (a.a.)
    ipca_vol:         float = 0.0150   # vol da inflação realizada
    selic_esperada:   float = 0.0975   # Selic média esperada (a.a.)
    selic_vol:        float = 0.0040   # vol da carry da Selic

    # ── Curva real de juros (NTN-B implícita) por prazo, em a.a. ──────
    # São os números do GESTOR — overrides do mercado se ele não topar.
    # Usados para precificar o floor quando não há título exato.
    real_curve: dict = field(default_factory=lambda: {
        2:  0.0680,   # 2 anos
        5:  0.0700,   # 5 anos
        10: 0.0715,   # 10 anos — sweet spot de duration na visão do gestor
        20: 0.0700,   # 20 anos
        30: 0.0680,   # 30+ anos
    })

    # ── Equity: decomposição dividendo + crescimento ──────────────────
    # Total nominal = (1 + DY) × (1 + IPCA) × (1 + g_real) − 1
    eq_dividend_yield:  float = 0.065   # DY do book de dividendos
    eq_real_growth:     float = 0.030   # crescimento real de lucros esperado
    eq_growth_premium:  float = 0.060   # extra para carteira de crescimento
    eq_div_vol:         float = 0.16    # vol carteira dividendos
    eq_growth_vol:      float = 0.28    # vol carteira crescimento

    # ── Convicção do gestor ───────────────────────────────────────────
    # 0.0 = 100% algoritmo (sem opinião);  1.0 = 100% tese
    conviction:         float = 0.60

    # ── Tilts macro por categoria (escalados pela convicção) ──────────
    macro_tilts: dict = field(default_factory=lambda: {
        'selic':     -0.05,
        'prefixado': -0.05,
        'ipca':      +0.15,
        'equity':    -0.05,
    })

    # ── Limites duros (nunca violados) ────────────────────────────────
    selic_min:        float = 0.05
    equity_max:       float = 0.85
    single_max:       float = 0.40

    # ── Custos e tributação ────────────────────────────────────────────
    taxa_b3:          float = 0.0020   # custódia Tesouro
    ir_equity:        float = 0.15     # IR sobre ganho de capital

    # ────────────────────────────────────────────────────────────────────
    def real_yield_for(self, years: float) -> float:
        """Interpolação linear da curva real."""
        ks = sorted(self.real_curve.keys())
        if years <= ks[0]:  return self.real_curve[ks[0]]
        if years >= ks[-1]: return self.real_curve[ks[-1]]
        for a, b in zip(ks, ks[1:]):
            if a <= years <= b:
                t = (years - a) / (b - a)
                return self.real_curve[a] * (1 - t) + self.real_curve[b] * t
        return self.real_curve[ks[-1]]

    def equity_expected_return(self, kind: str = 'div') -> float:
        """Retorno NOMINAL esperado de equity."""
        infl = 1 + self.ipca_esperado
        if kind == 'div':
            real = (1 + self.eq_dividend_yield) * (1 + self.eq_real_growth) - 1
        else:  # growth
            real = ((1 + self.eq_dividend_yield) * (1 + self.eq_real_growth)
                    * (1 + self.eq_growth_premium)) - 1
        return (1 + real) * infl - 1


VIEW = MarketAssumptions()


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 2 — MATRIZ DE CORRELAÇÃO E COVARIÂNCIA
# ───────────────────────────────────────────────────────────────────────────
# Diversificação só funciona se modelarmos correlações REAIS.
# Aqui declaramos a matriz por CLASSE; a expansão para ativos individuais
# usa correlação intra-classe alta (mas <1) para capturar basis de duration.
# ═══════════════════════════════════════════════════════════════════════════

CORR_CLASSES = ['selic', 'prefixado', 'ipca', 'equity_div', 'equity_growth']

# Matriz por CLASSE — calibrada para o mercado brasileiro:
#   • selic vs prefixado: 0.20  (carry × MtM)
#   • prefixado vs ipca:  0.55  (compartilham fator juros nominal)
#   • ipca vs equity:     0.20  (regimes de inflação afetam ambos)
#   • prefixado vs equity: -0.05 (taxa pra cima, equity pra baixo)
#   • equity_div vs equity_growth: 0.65 (ambos RV mas estilos distintos)
CORR_MATRIX_CLASSES = np.array([
    #   selic  prefix  ipca   eq_d   eq_g
    [   1.00,  0.20,   0.15,  0.05,  0.00 ],   # selic
    [   0.20,  1.00,   0.55, -0.05, -0.05 ],   # prefixado
    [   0.15,  0.55,   1.00,  0.20,  0.15 ],   # ipca
    [   0.05, -0.05,   0.20,  1.00,  0.65 ],   # equity_div
    [   0.00, -0.05,   0.15,  0.65,  1.00 ],   # equity_growth
])

# Dentro da MESMA classe, correlação alta mas <1 (basis de duration etc.)
INTRACLASS_CORR = 0.92


def asset_class_label(asset_id: str, asset) -> str:
    """Mapeia ativo individual → uma das 5 classes da matriz."""
    if asset.cat == 'equity':
        return 'equity_div' if 'dividend' in asset_id else 'equity_growth'
    return asset.cat


def build_cov_matrix(asset_ids: list, catalog: dict) -> np.ndarray:
    """
    Σ_ij = ρ_ij × σ_i × σ_j

    Esta é a substituição correta para `var = Σ (w_i × σ_i)²`, que assume
    correlação zero (subestima fortemente o risco em carteiras com IPCA+
    de durations diferentes ou equity heterogêneo).
    """
    n = len(asset_ids)
    Sigma = np.zeros((n, n))
    for i, ai in enumerate(asset_ids):
        ci = CORR_CLASSES.index(asset_class_label(ai, catalog[ai]))
        for j, aj in enumerate(asset_ids):
            cj = CORR_CLASSES.index(asset_class_label(aj, catalog[aj]))
            if i == j:
                rho = 1.0
            elif ci == cj:
                rho = INTRACLASS_CORR
            else:
                rho = CORR_MATRIX_CLASSES[ci, cj]
            Sigma[i, j] = rho * catalog[ai].vol * catalog[aj].vol
    return Sigma


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 3 — DADOS DE MERCADO (Tesouro Transparente) + TRIBUTAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class Bond:
    tipo: str; nome: str; venc: date; taxa: float; pu: float
    data: date; anos: float

    @property
    def label(self) -> str:
        v = self.venc.strftime('%Y')
        x = ''
        if 'Juros Semestrais' in self.tipo: x = ' c/ cupom'
        elif 'PRINCIPAL' in self.nome:      x = ' princ.'
        return f'{self.nome} {v}{x}'

    @property
    def cat(self) -> str:
        if 'Selic' in self.tipo: return 'selic'
        if 'IPCA' in self.tipo or 'NTN-B' in self.nome: return 'ipca'
        if 'Prefixado' in self.tipo or self.nome in ('LTN', 'NTN-F'): return 'prefixado'
        return 'outro'


_FALLBACK = [
    ('Tesouro Selic', 'LFT', '2028-03-01', 0.0025, 0),
    ('Tesouro Prefixado', 'LTN', '2027-01-01', 0.1450, 0),
    ('Tesouro Prefixado com Juros Semestrais', 'NTN-F', '2029-01-01', 0.1380, 0),
    ('Tesouro Prefixado com Juros Semestrais', 'NTN-F', '2033-01-01', 0.1360, 0),
    ('Tesouro Prefixado com Juros Semestrais', 'NTN-F', '2035-01-01', 0.1340, 0),
    ('Tesouro IPCA+', 'NTN-B PRINCIPAL', '2029-05-15', 0.0750, 0),
    ('Tesouro IPCA+ com Juros Semestrais', 'NTN-B', '2032-08-15', 0.0720, 0),
    ('Tesouro IPCA+', 'NTN-B PRINCIPAL', '2035-05-15', 0.0710, 0),
    ('Tesouro IPCA+ com Juros Semestrais', 'NTN-B', '2040-08-15', 0.0700, 0),
    ('Tesouro IPCA+', 'NTN-B PRINCIPAL', '2045-05-15', 0.0690, 0),
    ('Tesouro IPCA+ com Juros Semestrais', 'NTN-B', '2055-05-15', 0.0680, 0),
    ('Tesouro IPCA+', 'NTN-B PRINCIPAL', '2060-05-15', 0.0670, 0),
]


def fetch_bonds() -> list:
    today = date.today()
    try:
        from tesouro_direto_br import busca_tesouro_direto, nomeclatura_titulos
        df = busca_tesouro_direto(tipo='venda').reset_index()
        nomes = nomeclatura_titulos()
        if 'Data Base' in df.columns:
            idx = df.groupby(['Tipo Titulo', 'Data Vencimento'])['Data Base'].idxmax()
            df = df.loc[idx]
        bonds = []
        for _, r in df.iterrows():
            try:
                tipo = r['Tipo Titulo']
                if any(x in tipo for x in ['Renda', 'Educa', 'IGPM']): continue
                venc = pd.to_datetime(r['Data Vencimento']).date()
                a = (venc - today).days / 365.25
                if a < 0.08: continue
                tc = r.get('Taxa Compra Manha', r.get('Taxa Compra', 0))
                if isinstance(tc, (int, float)) and tc > 1: tc /= 100
                bonds.append(Bond(tipo, nomes.get(tipo, tipo), venc, tc,
                                   r.get('PU Compra Manha', 0),
                                   pd.to_datetime(r['Data Base']).date(), round(a, 2)))
            except Exception:
                continue
        bonds.sort(key=lambda b: (b.cat, b.venc))
        if bonds:
            log.info(f'✓ {len(bonds)} títulos do Tesouro Transparente')
            return bonds
    except Exception as e:
        log.warning(f'⚠ Tesouro offline ({e.__class__.__name__}) — usando fallback')
    bonds = []
    for tipo, nome, vs, tc, pu in _FALLBACK:
        venc = datetime.strptime(vs, '%Y-%m-%d').date()
        a = (venc - today).days / 365.25
        if a < 0.08: continue
        bonds.append(Bond(tipo, nome, venc, tc, pu, today, round(a, 2)))
    log.info(f'✓ {len(bonds)} títulos (fallback)')
    return bonds


# IR regressivo (renda fixa)
_IR_TABLE = [(180, 0.225), (360, 0.200), (720, 0.175), (99999, 0.150)]

def ir_rate_rf(dias: int) -> float:
    for d, r in _IR_TABLE:
        if dias <= d: return r
    return 0.15


def gross_to_net_rf(gross_aa: float, anos: float, taxa_b3: float) -> float:
    """Bruto a.a. → Líquido a.a. com IR regressivo + custódia B3."""
    if anos <= 0: return 0.0
    dias = int(anos * 365)
    ir = ir_rate_rf(dias)
    acum = (1 + gross_aa) ** anos - 1
    liq = acum * (1 - ir)
    liq -= taxa_b3 * anos
    return max((1 + liq) ** (1 / anos) - 1, 0.0) if liq > -1 else 0.0


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 4 — CATÁLOGO DE ATIVOS  (precificado pelas premissas)
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class Asset:
    id: str; label: str; cat: str
    ret_b: float          # retorno bruto a.a.
    ret_l: float          # retorno líquido a.a.
    vol:   float          # vol anual (MtM)
    color: str
    anos:  float          # duration aproximada


def _ipca_color(a: float) -> str:
    if a <= 5:  return '#40916C'
    if a <= 10: return '#52B788'
    if a <= 20: return '#74C69D'
    if a <= 30: return '#95D5B2'
    return '#B7E4C7'


def _vol_for(cat: str, anos: float) -> float:
    """Vol anualizada do MtM (não da carry). Aproxima ~ duration × σ_yield."""
    if cat == 'selic':     return 0.005
    if cat == 'prefixado': return min(0.025 + anos * 0.011, 0.20)
    if cat == 'ipca':      return min(0.030 + anos * 0.009, 0.20)
    return 0.05


def build_catalog(bonds: list, view: MarketAssumptions) -> dict:
    """Constrói catálogo de ativos com retornos e vols derivados das premissas."""
    C: dict = {}

    for b in bonds:
        cat = b.cat
        if cat == 'outro': continue
        if cat == 'ipca':
            rb = (1 + b.taxa) * (1 + view.ipca_esperado) - 1
        elif cat == 'selic':
            rb = view.selic_esperada + b.taxa
        else:
            rb = b.taxa
        rl = gross_to_net_rf(rb, b.anos, view.taxa_b3)
        vol = _vol_for(cat, b.anos)
        if cat == 'prefixado':
            color = '#264653' if b.anos < 5 else '#2A9D8F'
        elif cat == 'ipca':
            color = _ipca_color(b.anos)
        else:
            color = '#1B4332'
        aid = f"{b.nome}_{b.venc.year}".lower().replace(' ', '_').replace('-', '')
        C[aid] = Asset(aid, b.label, cat, round(rb, 4), round(rl, 4),
                       round(vol, 4), color, b.anos)

    # Equity — derivado da view do gestor
    div_ret = view.equity_expected_return('div')
    grw_ret = view.equity_expected_return('growth')
    C['dividend_portfolio'] = Asset(
        'dividend_portfolio', 'Carteira Dividendos', 'equity',
        round(div_ret, 4), round(div_ret, 4),
        view.eq_div_vol, '#D4A017', 0,
    )
    C['portfolio_z'] = Asset(
        'portfolio_z', 'Portfolio Z (Crescimento)', 'equity',
        round(grw_ret, 4), round(grw_ret * (1 - view.ir_equity), 4),
        view.eq_growth_vol, '#E63946', 0,
    )
    return C


RAW_BONDS = fetch_bonds()
CATALOG   = build_catalog(RAW_BONDS, VIEW)


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 5 — MODELO DO CLIENTE E OBJETIVOS  (CAMADA 2)
# ───────────────────────────────────────────────────────────────────────────
# Cada Goal carrega 5 dimensões que afetam REGRAS de alocação:
#   • prazo (curto/médio/longo)        → duration alvo
#   • prioridade (1-5)                  → tolerância a risco do objetivo
#   • essencial vs aspiracional         → piso de proteção
#   • necessidade de liquidez           → mínimo em Selic
#   • perfil de risco do cliente        → teto de equity
# ═══════════════════════════════════════════════════════════════════════════

GoalNature    = Literal['essential', 'aspirational']
LiquidityNeed = Literal['low', 'medium', 'high']

@dataclass
class Goal:
    name:      str
    target:    float
    years:     float
    risk:      str = 'moderate'
    priority:  int = 3                        # 1 = mais alta, 5 = mais baixa
    nature:    GoalNature  = 'aspirational'
    liquidity: LiquidityNeed = 'medium'

    @property
    def horizon_class(self) -> str:
        if self.years <= 3:  return 'short'
        if self.years <= 10: return 'medium'
        return 'long'


@dataclass
class EmergencyFund:
    """
    Reserva de emergência — CAMADA ZERO da gestão patrimonial.

    Antes de pensar em metas longas, garantir cobertura de despesas em
    ativos super-líquidos (Selic). Se não há reserva, não há otimização.
    """
    months_target: int = 6                          # 3, 6 ou 12 meses
    balance: Optional[float] = None                  # R$ atual em reserva
    target_asset_id: str = 'lft_2028'                # ativo da reserva

    def required(self, expenses: float) -> float:
        """Valor necessário para cobrir N meses de despesa."""
        return float(expenses * self.months_target)

    def progress(self, expenses: float) -> float:
        """% completado (0–1+)."""
        req = self.required(expenses)
        if req <= 0 or self.balance is None:
            return 0.0
        return self.balance / req

    def deficit(self, expenses: float) -> float:
        """Quanto falta em R$ (>=0)."""
        return max(0.0, self.required(expenses) - (self.balance or 0))

    def status(self, expenses: float) -> str:
        """Estado conceitual da reserva."""
        p = self.progress(expenses)
        if p < 0.50:  return 'incomplete'    # < metade — prioridade absoluta
        if p < 1.00:  return 'partial'        # construindo — split aporte
        if p < 1.50:  return 'complete'       # OK, 100–150%
        return 'excess'                        # >150% — excesso de caixa

    def months_to_complete(self, expenses: float, monthly_contrib: float) -> Optional[float]:
        """Estima em quantos meses a reserva fica pronta com aporte 100%."""
        d = self.deficit(expenses)
        if d <= 0 or monthly_contrib <= 0:
            return None
        return d / monthly_contrib


@dataclass
class Client:
    id:       str
    name:     str
    age:      int
    income:   float
    expenses: float
    savings:  float
    monthly:  float
    goals:    list = field(default_factory=list)
    emergency: Optional[EmergencyFund] = None

    @property
    def emergency_target(self) -> float:
        """Compat: target em R$. Usa fund se definido, senão default 6 meses."""
        f = self.emergency or EmergencyFund()
        return f.required(self.expenses)


def get_emergency_fund(client: Client) -> EmergencyFund:
    """
    Resolve a EmergencyFund de um Client, criando default se não houver.

    Heurística do default: assume que parte do `savings` está coberta como
    reserva (até o target). Cliente pode passar EmergencyFund explícito
    com balance real para sobrescrever.
    """
    if client.emergency is not None:
        return client.emergency
    target = client.expenses * 6
    inferred_balance = min(client.savings, target)
    return EmergencyFund(months_target=6, balance=inferred_balance)


def goal_to_rules(goal: Goal) -> dict:
    """
    Traduz objetivo do cliente em REGRAS CONCRETAS de alocação.

    Devolve um dict com:
        max_equity     teto de RV
        min_liquidity  piso de Selic/caixa
        duration_band  (min, max) de duration desejada para a parcela RF
        floor_min      piso mínimo de proteção (% da carteira)
        target_prob    probabilidade alvo de atingir a meta no Monte Carlo
    """
    # 1. NATUREZA do objetivo (essencial vs aspiracional)
    if goal.nature == 'essential':
        max_eq, floor_min, target_p = 0.30, 0.70, 0.85
    else:
        max_eq, floor_min, target_p = 0.85, 0.20, 0.65

    # 2. PRIORIDADE — refina
    if goal.priority <= 1:
        max_eq    = min(max_eq, 0.40)
        floor_min = max(floor_min, 0.60)
        target_p  = max(target_p, 0.80)
    elif goal.priority >= 4:
        max_eq    = min(max_eq + 0.10, 0.85)
        floor_min = max(floor_min - 0.10, 0.10)

    # 3. LIQUIDEZ
    min_liq = {'low': 0.03, 'medium': 0.08, 'high': 0.20}[goal.liquidity]

    # 4. PRAZO → duration band
    band = {
        'short':  (0.5, 3),
        'medium': (2,   8),
        'long':   (5,   25),
    }[goal.horizon_class]

    # 5. PERFIL DE RISCO do cliente arredonda
    risk_eq = {'conservative': 0.20, 'moderate': 0.45,
               'aggressive':   0.70, 'ultra_aggressive': 0.85}.get(goal.risk, 0.45)
    max_eq = min(max_eq, risk_eq)

    # 6. PISO ESTRATÉGICO MÍNIMO DE AÇÕES — filosofia "ações como motor de
    # crescimento". Default = 20% para qualquer carteira. Ajustes finos:
    #   - objetivo curtíssimo (≤2a) → cai para 10% (override possível via gestor)
    #   - reserva pura de emergência → cai para 0 quando target=0 e priority=1
    if goal.years <= 2 and goal.nature == 'essential':
        min_eq_floor = 0.10
    elif goal.target == 0 and goal.priority == 1:
        min_eq_floor = 0.00       # reserva pura — não força equity
    else:
        min_eq_floor = 0.20       # padrão estratégico da casa

    # max_equity nunca pode ficar abaixo do mínimo estratégico
    max_eq = max(max_eq, min_eq_floor)

    return {
        'max_equity':    max_eq,
        'min_equity':    min_eq_floor,
        'min_liquidity': min_liq,
        'duration_band': band,
        'floor_min':     floor_min,
        'target_prob':   target_p,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 6 — FLOOR REALISTA COM TESOURO CASADO  (CAMADA 3a)
# ───────────────────────────────────────────────────────────────────────────
# Substituição do antigo "FLOOR_RATE_REAL = 0.07" por um floor que:
#   1) seleciona o NTN-B com vencimento mais próximo do prazo do objetivo
#   2) usa a taxa real desse título (líquida de IR no resgate)
#   3) garante compatibilidade prazo-meta (carrega-até-o-vencimento)
#   4) aplica margem de segurança para risco de inflação/reinvestimento
# ═══════════════════════════════════════════════════════════════════════════

def select_floor_anchor(years: float, catalog: dict) -> Optional[Asset]:
    """Escolhe o título-âncora do floor: NTN-B Principal mais próximo do prazo."""
    # 1ª preferência: NTN-B Principal (sem cupom — casa direto com a meta)
    principals = [a for a in catalog.values()
                  if a.cat == 'ipca' and 'princ' in a.label.lower()]
    if principals:
        return min(principals, key=lambda a: abs(a.anos - years))
    # 2ª: qualquer IPCA+
    ipca = [a for a in catalog.values() if a.cat == 'ipca']
    if ipca:
        return min(ipca, key=lambda a: abs(a.anos - years))
    # 3ª: prefixado
    pref = [a for a in catalog.values() if a.cat == 'prefixado']
    if pref:
        return min(pref, key=lambda a: abs(a.anos - years))
    return None


def build_real_floor(target: float, savings: float, monthly: float,
                     years: float, view: MarketAssumptions,
                     catalog: dict, safety_margin: float = 1.05) -> dict:
    """
    Dimensiona o floor usando ATIVO REAL (NTN-B casado), não taxa fictícia.

    Retorna dict com floor_pct/upside_pct, título-âncora, taxa usada,
    excesso de cobertura, e — se inviável — aporte mínimo necessário.
    """
    anchor = select_floor_anchor(years, catalog)

    if anchor is not None:
        net_aa = anchor.ret_l         # já líquido (IR + B3)
        anchor_id = anchor.id
        anchor_label = anchor.label
        real_yield_used = (anchor.ret_b - view.ipca_esperado) / (1 + view.ipca_esperado) \
            if anchor.cat == 'ipca' else None
    else:
        # Fallback: usar curva real do gestor
        real = view.real_yield_for(years)
        nominal = (1 + real) * (1 + view.ipca_esperado) - 1
        net_aa = gross_to_net_rf(nominal, years, view.taxa_b3)
        anchor_id = None
        anchor_label = f'curva real {years:.0f}a (sintético)'
        real_yield_used = real

    # Acumulação do floor (capital + aporte mensal)
    r_m = (1 + net_aa) ** (1 / 12) - 1 if net_aa > 0 else 0
    n   = int(round(years * 12))
    fv_lump = savings * (1 + r_m) ** n
    fv_ann  = monthly * (((1 + r_m) ** n - 1) / r_m if r_m > 0 else n)
    fv_total = fv_lump + fv_ann

    twm = target * safety_margin

    if fv_total >= twm:
        floor_pct = min(twm / fv_total, 1.0)
        return {
            'achievable':       True,
            'floor_pct':        round(floor_pct, 4),
            'upside_pct':       round(1 - floor_pct, 4),
            'anchor_id':        anchor_id,
            'anchor_label':     anchor_label,
            'net_yield_used':   net_aa,
            'real_yield_used':  real_yield_used,
            'fv_at_floor':      fv_total,
            'excess':           round(fv_total / twm, 3),
            'deficit':          0.0,
            'monthly_needed':   monthly,
            'floor_monthly':    round(monthly * floor_pct, 2),
            'upside_monthly':   round(monthly * (1 - floor_pct), 2),
            'safety_margin':    safety_margin,
        }

    # Inviável: calcular aporte mínimo
    if r_m > 0:
        need = (twm - savings * (1 + r_m) ** n) / (((1 + r_m) ** n - 1) / r_m)
    else:
        need = (twm - savings) / max(n, 1)
    return {
        'achievable':       False,
        'floor_pct':        1.0,
        'upside_pct':       0.0,
        'anchor_id':        anchor_id,
        'anchor_label':     anchor_label,
        'net_yield_used':   net_aa,
        'real_yield_used':  real_yield_used,
        'fv_at_floor':      fv_total,
        'excess':           round(fv_total / twm, 3),
        'deficit':          twm - fv_total,
        'monthly_needed':   max(need, 0),
        'floor_monthly':    monthly,
        'upside_monthly':   0.0,
        'safety_margin':    safety_margin,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 7 — MOTOR DE ALOCAÇÃO (3 sub-camadas: algo + gestor + override)
# ═══════════════════════════════════════════════════════════════════════════

def _find_best(cat: str, min_a: float, max_a: float, catalog: dict) -> Optional[str]:
    """Acha o melhor ativo (maior retorno líquido) na faixa de duration."""
    best = None
    for aid, p in catalog.items():
        if p.cat != cat or not (min_a <= p.anos <= max_a): continue
        if best is None or p.ret_l > catalog[best].ret_l:
            best = aid
    return best


def _selic_id(catalog: dict) -> str:
    for aid, p in catalog.items():
        if p.cat == 'selic': return aid
    return list(catalog.keys())[0]


def _resolve_fi_split(years: float, rules: dict, catalog: dict) -> dict:
    """
    Mix da parcela de RF respeitando a duration_band do objetivo.

    Estratégia: cobrir 3 buckets de duration dentro da banda permitida,
    com peso maior no bucket central (matching do prazo).
    """
    s = _selic_id(catalog)
    band_min, band_max = rules['duration_band']
    center = (band_min + band_max) / 2

    # Selic sempre presente (liquidez)
    mix = {s: rules['min_liquidity']}
    remaining = 1.0 - mix[s]

    if years <= 3:
        # Curto prazo: dominado por Selic + prefixado curto
        pc = _find_best('prefixado', 0, 4, catalog) or s
        ic = _find_best('ipca', 0, 5, catalog) or s
        mix[pc] = mix.get(pc, 0) + remaining * 0.55
        mix[ic] = mix.get(ic, 0) + remaining * 0.45
    elif years <= 10:
        # Médio prazo: barbell entre IPCA curto/médio + cuponada
        ic   = _find_best('ipca', max(band_min, 2),  min(band_max, 6),  catalog) or s
        im   = _find_best('ipca', max(band_min, 5),  min(band_max, 10), catalog) or ic
        # cuponada de média duration
        icup = None
        for aid, p in catalog.items():
            if p.cat == 'ipca' and 'cupom' in p.label.lower() and 6 <= p.anos <= 12:
                if icup is None or p.ret_l > catalog[icup].ret_l: icup = aid
        icup = icup or im
        mix[ic]   = mix.get(ic,   0) + remaining * 0.30
        mix[im]   = mix.get(im,   0) + remaining * 0.30
        mix[icup] = mix.get(icup, 0) + remaining * 0.40
    else:
        # Longo prazo: NTN-B longa + cuponada
        im   = _find_best('ipca', max(band_min, 5),  15, catalog) or s
        il   = _find_best('ipca', 10, min(band_max, 25), catalog) or im
        iu   = _find_best('ipca', 20, max(band_max, 40), catalog) or il
        icup = None
        for aid, p in catalog.items():
            if p.cat == 'ipca' and 'cupom' in p.label.lower() and 8 <= p.anos <= 25:
                if icup is None or p.ret_l > catalog[icup].ret_l: icup = aid
        icup = icup or il
        mix[im]   = mix.get(im,   0) + remaining * 0.15
        mix[icup] = mix.get(icup, 0) + remaining * 0.35
        mix[il]   = mix.get(il,   0) + remaining * 0.30
        mix[iu]   = mix.get(iu,   0) + remaining * 0.20

    # normalizar
    total = sum(mix.values())
    return {k: v / total for k, v in mix.items() if k in catalog}


def algo_allocation(target: float, savings: float, monthly: float,
                    years: float, rules: dict, view: MarketAssumptions,
                    catalog: dict) -> tuple:
    """
    CAMADA 3a — Alocação puramente algorítmica.

    Pipeline:
      1. Construir floor com NTN-B casado
      2. Dimensionar peso floor / upside (respeitando floor_min do goal)
      3. Distribuir RF dentro do floor (duration band)
      4. Distribuir RV no upside (cap de equity do goal)
    """
    if target and target > 0:
        floor = build_real_floor(target, savings, monthly, years, view, catalog)
        fp = max(floor['floor_pct'], rules['floor_min'])
    else:
        # Sem meta financeira → carteira de crescimento
        floor = None
        fp = rules['floor_min']

    fp = min(fp, 1.0 - (1.0 - rules['max_equity']) * 0)   # placeholder
    # Garantir que upside não exceda max_equity
    up = min(1.0 - fp, rules['max_equity'])
    fp = 1.0 - up

    # ── Parcela RF ────────────────────────────────────────────────────
    fi_mix = _resolve_fi_split(years, rules, catalog)
    weights = {k: fp * v for k, v in fi_mix.items()}

    # ── Parcela RV ────────────────────────────────────────────────────
    # Split equity entre dividendos e crescimento conforme perfil
    div_share = {
        'conservative':     1.00,
        'moderate':         0.65,
        'aggressive':       0.35,
        'ultra_aggressive': 0.20,
    }.get(rules.get('risk', 'moderate'), 0.50)

    # Recuperar risk do cliente (passado via rules indireto):
    # Como goal_to_rules não inclui risk explicitamente, deduzimos do cap:
    if rules['max_equity'] >= 0.80:   div_share = 0.20
    elif rules['max_equity'] >= 0.60: div_share = 0.35
    elif rules['max_equity'] >= 0.35: div_share = 0.65
    else:                              div_share = 1.00

    weights['dividend_portfolio'] = up * div_share
    weights['portfolio_z']        = up * (1 - div_share)

    return weights, floor


def apply_manager_view(algo_w: dict, view: MarketAssumptions,
                       catalog: dict) -> dict:
    """
    CAMADA 3b — Visão do gestor (tilts + convicção + limites duros).
    """
    if view.conviction == 0:
        return dict(algo_w)

    w = dict(algo_w)

    # Tilts por categoria
    for cat, tilt in view.macro_tilts.items():
        actual = tilt * view.conviction
        cat_assets = [(k, v) for k, v in w.items()
                      if k in catalog and catalog[k].cat == cat]
        if not cat_assets: continue
        total = sum(v for _, v in cat_assets)
        if total > 0:
            for aid, weight in cat_assets:
                share = weight / total
                w[aid] = max(weight + actual * share, 0)

    # Limites duros
    sid = _selic_id(catalog)
    if w.get(sid, 0) < view.selic_min:
        deficit = view.selic_min - w.get(sid, 0)
        w[sid] = view.selic_min
        others = [(k, v) for k, v in w.items() if k != sid and v > 0.01]
        ot = sum(v for _, v in others)
        if ot > 0:
            for k, v in others:
                w[k] = v - deficit * (v / ot)

    # Equity cap global da view
    eq_total = sum(v for k, v in w.items()
                   if k in catalog and catalog[k].cat == 'equity')
    if eq_total > view.equity_max:
        scale = view.equity_max / eq_total
        excess = eq_total - view.equity_max
        fi_keys = [k for k in w if k in catalog and catalog[k].cat != 'equity' and w[k] > 0]
        fi_tot = sum(w[k] for k in fi_keys)
        for k in list(w.keys()):
            if k in catalog and catalog[k].cat == 'equity':
                w[k] *= scale
        if fi_tot > 0:
            for k in fi_keys:
                w[k] += excess * (w[k] / fi_tot)

    # Single asset cap
    for k in list(w.keys()):
        if w[k] > view.single_max:
            w[k] = view.single_max

    return w


def apply_override(w: dict, override: dict) -> dict:
    """CAMADA 3c — Override pontual por cliente (trava pesos específicos)."""
    pinned = {k: v for k, v in override.items() if v is not None}
    ps = sum(pinned.values())
    res = max(1 - ps, 0)
    unp = [k for k in w if k not in pinned and w[k] > 0.003]
    us = sum(w[k] for k in unp)
    out = dict(pinned)
    if us > 0 and res > 0:
        for k in unp:
            out[k] = res * (w[k] / us)
    return out


# ═══════════════════════════════════════════════════════════════════════════
# CAMADA 3d — PISO ESTRATÉGICO DE AÇÕES (filosofia "equity-first")
# ───────────────────────────────────────────────────────────────────────────
# A casa adota ações como principal motor de crescimento. Toda carteira
# final deve ter NO MÍNIMO 20% em equity (`dividend_portfolio` + `portfolio_z`),
# salvo casos explicitamente excluídos via `min_equity` em rules.
#
# Quando o pipeline algo→manager→override produz equity abaixo do mínimo,
# esta camada retira peso PROPORCIONALMENTE da renda fixa e direciona para
# ações, respeitando `min_liquidity` quando possível e nunca produzindo
# pesos negativos.
# ═══════════════════════════════════════════════════════════════════════════

def enforce_min_equity_allocation(weights: dict, goal: 'Goal', rules: dict,
                                    catalog: dict,
                                    min_equity: float = 0.20) -> tuple:
    """
    Garante que a carteira tenha no mínimo `min_equity` em ações.

    Args:
        weights:      pesos atuais por asset_id (somam ~1)
        goal:         objetivo do cliente (usado para alertas contextuais)
        rules:        dict de goal_to_rules (consulta `min_liquidity`,
                       `max_equity`, `min_equity`)
        catalog:      catálogo de ativos (precisa do .cat de cada um)
        min_equity:   piso default — sobrescrito por rules['min_equity']
                       se este for menor (ex.: reserva de emergência pura)

    Returns:
        (new_weights, log) onde:
          new_weights: dict {asset_id: peso} ajustado, somando 1.0
          log: {
              'equity_before':     float,
              'equity_after':      float,
              'deficit_corrected': float,
              'reduced_assets':    {asset_id: pp_reduzido},
              'increased_assets':  {asset_id: pp_acrescentado},
              'forced':            bool,    # True se houve ajuste
              'warnings':          [str],   # alertas contextuais
              'min_equity_applied': float,
          }
    """
    # min_equity efetivo: respeita override do goal/rules
    rule_min_eq = rules.get('min_equity', min_equity)
    eff_min = max(rule_min_eq, min_equity) if rule_min_eq > 0 else 0.0

    # Identifica equity vs RF no catálogo
    equity_ids = [aid for aid, a in catalog.items() if a.cat == 'equity']
    selic_ids  = [aid for aid, a in catalog.items() if a.cat == 'selic']
    other_rf_ids = [aid for aid, a in catalog.items()
                     if a.cat in ('ipca', 'prefixado')]

    new_w = {k: float(v) for k, v in weights.items()}
    eq_before = sum(new_w.get(aid, 0) for aid in equity_ids)

    log = {
        'equity_before':      eq_before,
        'equity_after':       eq_before,
        'deficit_corrected':  0.0,
        'reduced_assets':     {},
        'increased_assets':   {},
        'forced':             False,
        'warnings':           [],
        'min_equity_applied': eff_min,
    }

    # Caso 1: regra desligada (eff_min = 0) ou já cumprida
    if eff_min <= 0 or eq_before >= eff_min - 1e-9:
        return new_w, log

    # ── Há déficit: precisa elevar equity ──────────────────────────────
    deficit = eff_min - eq_before
    log['deficit_corrected'] = deficit
    log['forced'] = True

    # 1) Determina de onde RETIRAR — RF não-Selic primeiro, Selic só se preciso
    other_rf_total = sum(new_w.get(aid, 0) for aid in other_rf_ids)
    selic_total    = sum(new_w.get(aid, 0) for aid in selic_ids)
    min_liq        = rules.get('min_liquidity', 0.0)
    selic_disponivel = max(0, selic_total - min_liq)

    if other_rf_total + selic_disponivel < deficit - 1e-9:
        # min_liquidity pode precisar ser violado para cumprir min_equity
        # — registramos o aviso, mas a regra estratégica prevalece
        if other_rf_total + selic_total >= deficit - 1e-9:
            log['warnings'].append(
                f'Para suprir min_equity ({eff_min:.0%}), foi necessário '
                f'reduzir Selic abaixo do piso de liquidez ({min_liq:.0%}).'
            )
            selic_disponivel = max(0, deficit - other_rf_total)
        else:
            # Cenário extremo: não há RF suficiente. Limita-se ao possível.
            log['warnings'].append(
                'Não há renda fixa suficiente para elevar equity ao mínimo. '
                'Carteira já está acima ou no limite — verifique build_portfolio.'
            )
            return new_w, log

    # Estratégia em 2 passos: tira de RF não-Selic primeiro
    cut_from_other = min(deficit, other_rf_total)
    cut_from_selic = max(0, deficit - cut_from_other)

    # Reduz proporcional dentro de RF não-Selic
    if cut_from_other > 0 and other_rf_total > 0:
        for aid in other_rf_ids:
            w = new_w.get(aid, 0)
            if w <= 0: continue
            cut = w * (cut_from_other / other_rf_total)
            new_w[aid] = max(0.0, w - cut)
            log['reduced_assets'][aid] = cut

    # Reduz proporcional dentro de Selic, se preciso
    if cut_from_selic > 0 and selic_total > 0:
        for aid in selic_ids:
            w = new_w.get(aid, 0)
            if w <= 0: continue
            cut = w * (cut_from_selic / selic_total)
            new_w[aid] = max(0.0, w - cut)
            log['reduced_assets'][aid] = cut

    # 2) Determina como DISTRIBUIR o adicional em equity.
    #    Reusa a lógica de div_share de algo_allocation:
    max_eq = rules.get('max_equity', 0.5)
    if   max_eq >= 0.80: div_share = 0.20
    elif max_eq >= 0.60: div_share = 0.35
    elif max_eq >= 0.35: div_share = 0.65
    else:                div_share = 1.00

    # Para perfil conservador, prioriza dividendos (mais defensivo)
    if goal.risk == 'conservative':
        div_share = max(div_share, 0.80)

    div_id = 'dividend_portfolio'
    z_id   = 'portfolio_z'

    add_div = deficit * div_share
    add_z   = deficit * (1 - div_share)

    if div_id in catalog:
        new_w[div_id] = new_w.get(div_id, 0) + add_div
        log['increased_assets'][div_id] = add_div
    else:
        add_z += add_div  # fallback: tudo para Z
        add_div = 0.0

    if z_id in catalog and add_z > 0:
        new_w[z_id] = new_w.get(z_id, 0) + add_z
        log['increased_assets'][z_id] = add_z

    # 3) Defesas finais: zera negativos, normaliza para somar 1.0
    for k, v in list(new_w.items()):
        if v < 0:
            new_w[k] = 0.0

    total = sum(new_w.values())
    if total > 0 and abs(total - 1.0) > 1e-6:
        new_w = {k: v / total for k, v in new_w.items()}

    log['equity_after'] = sum(new_w.get(aid, 0) for aid in equity_ids)

    # 4) Avisos contextuais — para alimentar o dashboard cliente
    if goal.risk == 'conservative':
        log['warnings'].append(
            f'Cliente conservador — a regra estratégica de mínimo '
            f'{eff_min:.0%} em ações elevou a volatilidade da carteira '
            'acima do esperado para o perfil. Trade-off: maior crescimento '
            'esperado de longo prazo em troca de oscilação mensal.'
        )
    if goal.years <= 3 and eq_before < eff_min:
        log['warnings'].append(
            f'Objetivo de prazo curto ({goal.years:.0f}a) — pode haver '
            'incompatibilidade entre a parcela de ações e o horizonte. '
            'Considere override do gestor reduzindo equity, ou '
            'desacoplar este objetivo da regra estratégica via '
            "rules['min_equity'] = 0."
        )

    return new_w, log


def _clean(w: dict, catalog: dict, min_w: float = 0.005) -> dict:
    c = {k: v for k, v in w.items() if v >= min_w and k in catalog}
    t = sum(c.values()) or 1
    return {k: round(v / t, 4) for k, v in sorted(c.items(), key=lambda x: -x[1])}


def build_portfolio(goal: Optional[Goal], client: Client,
                    view: MarketAssumptions, catalog: dict,
                    override: Optional[dict] = None) -> dict:
    """
    Pipeline completo de construção de carteira.

      goal = None         → carteira de crescimento padrão
      override            → trava pesos por ativo (camada 3c)
    """
    if goal is None:
        goal = Goal('Crescimento', 0, 10, 'aggressive', 5, 'aspirational', 'medium')

    rules = goal_to_rules(goal)

    algo_w, floor = algo_allocation(
        goal.target, client.savings, client.monthly, goal.years,
        rules, view, catalog,
    )

    gestor_w  = apply_manager_view(algo_w, view, catalog)
    after_ovr = apply_override(gestor_w, override) if override else gestor_w

    # ── CAMADA 3d: piso estratégico de ações ─────────────────────────
    # Limpa antes do enforce para o log refletir os pesos reais (>= min_w)
    after_ovr_clean = _clean(after_ovr, catalog)
    final_w, enforce_log = enforce_min_equity_allocation(
        after_ovr_clean, goal, rules, catalog, min_equity=0.20,
    )

    return {
        'alloc':       _clean(final_w, catalog),
        'algo_alloc':  _clean(algo_w, catalog),
        'pre_enforce': after_ovr_clean,             # carteira antes da regra 20%
        'rules':       rules,
        'floor':       floor,
        'goal':        goal,
        'enforce_log': enforce_log,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 8 — MOTOR DE RISCO  (CAMADA 4a)
# ───────────────────────────────────────────────────────────────────────────
# Volatilidade da carteira via COVARIÂNCIA (não soma de variâncias).
# VaR paramétrico, contribuição de risco por classe, Sharpe, vol marginal.
# ═══════════════════════════════════════════════════════════════════════════

def portfolio_risk(alloc: dict, view: MarketAssumptions, catalog: dict,
                   liquid: bool = True) -> dict:
    """
    Métricas de risco de uma carteira:
      mu          retorno esperado a.a.
      sigma       vol a.a. (covariância correta)
      sigma_naive vol que o método antigo (sem correlação) daria — para comparar
      sharpe      (mu - rf) / sigma
      var_95      VaR 1 ano paramétrico (perda)
      var_99      VaR 1 ano paramétrico (perda)
      contrib     contribuição marginal de risco por ativo
      class_risk  decomposição do risco por classe
    """
    asset_ids = list(alloc.keys())
    if not asset_ids:
        return {'mu': 0, 'sigma': 0, 'sharpe': 0, 'var_95': 0, 'var_99': 0,
                'contrib': {}, 'class_risk': {}, 'sigma_naive': 0}

    w = np.array([alloc[a] for a in asset_ids])
    rk = 'ret_l' if liquid else 'ret_b'
    rets = np.array([getattr(catalog[a], rk) for a in asset_ids])

    Sigma = build_cov_matrix(asset_ids, catalog)
    mu = float(w @ rets)
    var = float(w @ Sigma @ w)
    sigma = float(np.sqrt(max(var, 0)))

    # Vol "ingênua" (método antigo, sem correlação): subestima fortemente
    sigma_naive = float(np.sqrt(sum((w[i] * catalog[asset_ids[i]].vol) ** 2
                                     for i in range(len(asset_ids)))))

    rf = view.selic_esperada
    sharpe = (mu - rf) / max(sigma, 1e-6)

    z95, z99 = 1.645, 2.326
    var_95 = max(z95 * sigma - mu, 0)
    var_99 = max(z99 * sigma - mu, 0)

    # Contribuição marginal de risco: cada ativo contribui com w_i * (Σw)_i / σ
    Sw = Sigma @ w
    contrib_vec = (w * Sw) / max(var, 1e-9)        # share do risco total
    contrib = {asset_ids[i]: float(contrib_vec[i]) for i in range(len(asset_ids))}

    # Risco por classe
    class_risk: dict = {}
    for i, aid in enumerate(asset_ids):
        cls = asset_class_label(aid, catalog[aid])
        class_risk[cls] = class_risk.get(cls, 0) + float(contrib_vec[i])

    return {
        'mu':          mu,
        'sigma':       sigma,
        'sigma_naive': sigma_naive,
        'sharpe':      sharpe,
        'var_95':      var_95,
        'var_99':      var_99,
        'contrib':     contrib,
        'class_risk':  class_risk,
        'asset_ids':   asset_ids,
        'weights':     w,
        'cov':         Sigma,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 9 — MONTE CARLO COM CENÁRIOS MACRO  (CAMADA 4b)
# ───────────────────────────────────────────────────────────────────────────
# Substitui a simulação normal simples por:
#   • retornos LOGNORMAIS (não negativos)
#   • CENÁRIOS macro (base/bull/bear/inflação alta/juros altos) com pesos
#   • DRAWDOWN máximo medido em cada path
#   • risco de PERDA REAL (vs IPCA) e nominal (vs aportado)
# ═══════════════════════════════════════════════════════════════════════════

SCENARIOS = {
    'base': {
        'prob': 0.50, 'mu_shift': 0.000, 'vol_mult': 1.00,
        'descricao': 'Cenário central — premissas do gestor se realizam',
    },
    'bull': {
        'prob': 0.20, 'mu_shift': +0.040, 'vol_mult': 0.85,
        'descricao': 'Bull — Selic cai mais rápido, equity rerratera',
    },
    'bear': {
        'prob': 0.15, 'mu_shift': -0.060, 'vol_mult': 1.40,
        'descricao': 'Bear — recessão, equity em drawdown profundo',
    },
    'high_infl': {
        'prob': 0.10, 'mu_shift': -0.025, 'vol_mult': 1.25,
        'descricao': 'Inflação alta — IPCA acelera, prefixado machuca',
    },
    'high_rates': {
        'prob': 0.05, 'mu_shift': -0.040, 'vol_mult': 1.30,
        'descricao': 'Juros altos persistentes — pressão na curva',
    },
}


def run_monte_carlo(alloc: dict, savings: float, monthly: float,
                    years: float, target: Optional[float],
                    view: MarketAssumptions, catalog: dict,
                    n_paths: int = 10_000, seed: int = 42) -> dict:
    """Monte Carlo lognormal com cenários macro."""
    rng = np.random.default_rng(seed)
    n_months = int(round(years * 12))

    # Estatísticas da carteira via covariância correta
    risk = portfolio_risk(alloc, view, catalog, liquid=True)
    mu_p, sigma_p = risk['mu'], risk['sigma']

    # Cenários: cada path recebe um cenário random com a probabilidade dada
    keys = list(SCENARIOS.keys())
    probs = np.array([SCENARIOS[k]['prob'] for k in keys])
    probs = probs / probs.sum()
    chosen = rng.choice(len(keys), size=n_paths, p=probs)

    mu_shifts = np.array([SCENARIOS[k]['mu_shift'] for k in keys])[chosen]
    vol_mults = np.array([SCENARIOS[k]['vol_mult'] for k in keys])[chosen]

    mu_path  = mu_p + mu_shifts
    sig_path = sigma_p * vol_mults

    # Mensalização + parametrização lognormal
    mu_m  = (1 + np.maximum(mu_path, -0.99)) ** (1 / 12) - 1
    sig_m = sig_path / np.sqrt(12)
    var_factor = np.log(1 + (sig_m ** 2) / np.maximum((1 + mu_m) ** 2, 1e-9))
    sig_log = np.sqrt(np.maximum(var_factor, 0))
    mu_log  = np.log(np.maximum(1 + mu_m, 1e-9)) - 0.5 * sig_log ** 2

    Z = rng.standard_normal((n_paths, n_months))
    log_rets = mu_log[:, None] + sig_log[:, None] * Z
    monthly_rets = np.exp(log_rets) - 1

    # Evolução do saldo com aporte mensal
    bal = np.empty((n_paths, n_months + 1))
    bal[:, 0] = savings
    for t in range(n_months):
        bal[:, t + 1] = bal[:, t] * (1 + monthly_rets[:, t]) + monthly

    final = bal[:, -1]
    aportado = savings + monthly * n_months

    # Drawdown
    running_max = np.maximum.accumulate(bal, axis=1)
    drawdowns = (bal - running_max) / np.maximum(running_max, 1)
    max_dd_per_path = drawdowns.min(axis=1)   # negativo

    # Probabilidades
    prob_meta      = float(np.mean(final >= target)) if (target and target > 0) else None
    real_factor    = (1 + view.ipca_esperado) ** years
    final_real     = final / real_factor
    prob_perda_real = float(np.mean(final_real < aportado))
    prob_perda_nom  = float(np.mean(final < aportado))

    # Percentis ao longo do tempo (para plot)
    sample_idx = np.linspace(0, n_paths - 1, min(n_paths, 800), dtype=int)
    sample = bal[sample_idx]
    pcts = {f'p{p}': np.percentile(sample, p, axis=0) for p in [10, 25, 50, 75, 90]}

    # Distribuição por cenário (qual cenário levou onde)
    by_scenario = {}
    for i, k in enumerate(keys):
        mask = (chosen == i)
        if mask.sum() > 0:
            by_scenario[k] = {
                'count':  int(mask.sum()),
                'median': float(np.median(final[mask])),
                'p10':    float(np.percentile(final[mask], 10)),
                'p90':    float(np.percentile(final[mask], 90)),
                'prob_meta': float(np.mean(final[mask] >= target)) if (target and target > 0) else None,
            }

    return {
        'mu':              mu_p,
        'sigma':           sigma_p,
        'sharpe':          risk['sharpe'],
        'var_95':          risk['var_95'],
        'var_99':          risk['var_99'],
        'prob_meta':       prob_meta,
        'prob_perda_real': prob_perda_real,
        'prob_perda_nom':  prob_perda_nom,
        'final':           final,
        'aportado':        aportado,
        'median':          float(np.median(final)),
        'p10':             float(np.percentile(final, 10)),
        'p25':             float(np.percentile(final, 25)),
        'p75':             float(np.percentile(final, 75)),
        'p90':             float(np.percentile(final, 90)),
        'max_dd_mean':     float(max_dd_per_path.mean()),
        'max_dd_p95':      float(np.percentile(max_dd_per_path, 5)),  # pior 5%
        'pcts':            pcts,
        'months':          n_months,
        'target':          target,
        'paths_sample':    sample,
        'by_scenario':     by_scenario,
        'risk':            risk,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 10 — ANÁLISE DE SENSIBILIDADE  (CAMADA 5a)
# ───────────────────────────────────────────────────────────────────────────
# Como a probabilidade de sucesso muda quando você varia:
#   • aporte mensal      (-50% / -25% / 0 / +25% / +50%)
#   • retorno esperado   (-200bps / -100bps / 0 / +100bps / +200bps)
#   • horizonte          (-3a / 0 / +3a)
# E: qual aporte mínimo é necessário para P(meta) ≥ 80%?
# ═══════════════════════════════════════════════════════════════════════════

def sensitivity_analysis(alloc: dict, savings: float, monthly: float,
                          years: float, target: float,
                          view: MarketAssumptions, catalog: dict,
                          n_paths: int = 3_000) -> dict:
    """Tabela de sensibilidade da P(meta) a 3 alavancas."""
    if not (target and target > 0):
        return {}

    base = run_monte_carlo(alloc, savings, monthly, years, target,
                           view, catalog, n_paths=n_paths)

    out: dict = {'base': base['prob_meta']}

    # 1. Aporte
    aporte_var = {}
    for delta in [-0.50, -0.25, 0.0, +0.25, +0.50]:
        m = monthly * (1 + delta)
        sim = run_monte_carlo(alloc, savings, m, years, target,
                              view, catalog, n_paths=n_paths)
        aporte_var[delta] = sim['prob_meta']
    out['aporte'] = aporte_var

    # 2. Retorno (shift) — replica MC com mu_shift global
    # Implementação: rodar MC trocando catalog. Mais simples: shiftar in-place
    ret_var = {}
    for shift in [-0.02, -0.01, 0.0, +0.01, +0.02]:
        # Hack: cria catalog modificado
        cat2 = {k: replace(v, ret_l=max(v.ret_l + shift, 0)) for k, v in catalog.items()}
        sim = run_monte_carlo(alloc, savings, monthly, years, target,
                              view, cat2, n_paths=n_paths)
        ret_var[shift] = sim['prob_meta']
    out['retorno'] = ret_var

    # 3. Horizonte
    horizon_var = {}
    for d in [-3, -1, 0, +1, +3]:
        y = max(years + d, 0.5)
        sim = run_monte_carlo(alloc, savings, monthly, y, target,
                              view, catalog, n_paths=n_paths)
        horizon_var[d] = sim['prob_meta']
    out['horizonte'] = horizon_var

    return out


def required_monthly_for_prob(alloc: dict, savings: float, years: float,
                               target: float, view: MarketAssumptions,
                               catalog: dict, target_prob: float = 0.80,
                               n_paths: int = 2_000) -> dict:
    """
    Busca binária pelo aporte mínimo que atinge P(meta) ≥ target_prob.

    Retorna dict com 'monthly' (None se inviável dentro de R$50k/mês).
    """
    if not (target and target > 0):
        return {'monthly': None, 'achieved_prob': None}

    lo, hi = 0.0, 50_000.0

    # Sanity: P com hi precisa ser >= target_prob, senão retorna inviável
    sim_hi = run_monte_carlo(alloc, savings, hi, years, target, view,
                              catalog, n_paths=n_paths)
    if sim_hi['prob_meta'] < target_prob:
        return {'monthly': None, 'achieved_prob': sim_hi['prob_meta']}

    sim_lo = run_monte_carlo(alloc, savings, lo, years, target, view,
                              catalog, n_paths=n_paths)
    if sim_lo['prob_meta'] >= target_prob:
        return {'monthly': 0.0, 'achieved_prob': sim_lo['prob_meta']}

    for _ in range(18):   # ~precisão R$0,20 em [0, 50k]
        mid = (lo + hi) / 2
        sim = run_monte_carlo(alloc, savings, mid, years, target, view,
                              catalog, n_paths=n_paths)
        if sim['prob_meta'] >= target_prob:
            hi = mid
        else:
            lo = mid

    sim = run_monte_carlo(alloc, savings, hi, years, target, view,
                          catalog, n_paths=n_paths)
    return {'monthly': hi, 'achieved_prob': sim['prob_meta']}


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 11 — ANÁLISE DO PLANO (CAMADA DE PRODUTO)
# ───────────────────────────────────────────────────────────────────────────
# Score 0–100, semáforo de 6 dimensões, classificação automática, alertas
# e sugestões. Toda a lógica desta seção opera sobre OUTPUTS do motor —
# não depende de premissas internas. É o que vai virar o "rosto" do plano
# para o cliente.
# ═══════════════════════════════════════════════════════════════════════════

# Classificação real da carteira pela vol observada (não pelo input do cliente)
RISK_CLASS_BANDS = [
    (0.00, 0.05, 'conservadora'),
    (0.05, 0.10, 'moderada'),
    (0.10, 0.18, 'arrojada'),
    (0.18, 1.00, 'agressiva'),
]


def classify_portfolio(sigma: float) -> str:
    """Classifica a carteira pela vol anual realizada."""
    for lo, hi, label in RISK_CLASS_BANDS:
        if lo <= sigma < hi:
            return label
    return 'agressiva'


def _profile_target_vol(profile: str) -> tuple:
    """Faixa de vol esperada para cada perfil declarado pelo cliente."""
    return {
        'conservative':     (0.00, 0.06),
        'moderate':         (0.05, 0.11),
        'aggressive':       (0.09, 0.18),
        'ultra_aggressive': (0.14, 0.30),
    }.get(profile, (0.05, 0.15))


def _herfindahl(weights: dict) -> float:
    """Índice HHI normalizado (0 = perfeitamente diversificado, 1 = concentrado)."""
    w = np.array(list(weights.values()))
    if w.sum() == 0:
        return 1.0
    w = w / w.sum()
    return float((w ** 2).sum())


def _liquidity_score(alloc: dict, catalog: dict) -> float:
    """% da carteira em ativos com liquidez imediata (Selic) ou < 2 anos."""
    liq = 0.0
    for aid, w in alloc.items():
        a = catalog[aid]
        if a.cat == 'selic' or (a.cat in ('prefixado', 'ipca') and a.anos <= 2):
            liq += w
    return liq


def _inflation_protection(alloc: dict, catalog: dict) -> float:
    """% protegido contra inflação: IPCA+ + parcela equity."""
    return sum(w for aid, w in alloc.items()
               if catalog[aid].cat in ('ipca', 'equity'))


def plan_traffic_light(client: 'Client', goal: 'Goal', result: dict,
                        sim: dict, sens: Optional[dict],
                        view: 'MarketAssumptions', catalog: dict,
                        risk: dict) -> dict:
    """
    Semáforo do plano em 6 dimensões. Cada dimensão devolve:
       status: 'green' | 'yellow' | 'red'
       title:  título curto p/ exibição
       desc:   explicação simples (sem jargão)
       value:  número de referência
    """
    alloc = result['alloc']
    sigma = risk['sigma']
    real_class = classify_portfolio(sigma)
    profile = goal.risk

    # 1) VIABILIDADE da meta
    p = sim.get('prob_meta')
    if p is None:
        viab = ('yellow', 'Sem meta definida',
                'Carteira de crescimento — sem alvo financeiro específico.', 0)
    elif p >= 0.80:
        viab = ('green',  'Meta com folga',
                f'Probabilidade de atingir o objetivo: {p:.0%}.', p)
    elif p >= 0.60:
        viab = ('yellow', 'Meta apertada',
                f'Probabilidade de atingir o objetivo: {p:.0%} — apertado.', p)
    else:
        viab = ('red',    'Meta em risco',
                f'Probabilidade de atingir o objetivo: {p:.0%} — baixa.', p)

    # 2) RISCO DA CARTEIRA vs perfil declarado
    lo, hi = _profile_target_vol(profile)
    if lo <= sigma <= hi:
        rsk = ('green',  'Risco no perfil',
               f'Volatilidade da carteira ({sigma:.1%}) compatível com o perfil.', sigma)
    elif sigma > hi:
        rsk = ('red',    'Risco acima do perfil',
               f'Carteira mais volátil ({sigma:.1%}) do que o esperado para o perfil.', sigma)
    else:
        rsk = ('yellow', 'Risco abaixo do perfil',
               f'Carteira com risco abaixo ({sigma:.1%}) do potencial do perfil.', sigma)

    # 3) LIQUIDEZ
    liq = _liquidity_score(alloc, catalog)
    short_term = goal.years <= 3
    threshold = 0.20 if short_term else 0.05
    if liq >= threshold and liq <= 0.50:
        lq = ('green',  'Liquidez adequada',
              f'{liq:.0%} da carteira em ativos de alta liquidez.', liq)
    elif liq < threshold:
        lq = ('red' if short_term else 'yellow', 'Liquidez baixa',
              f'Apenas {liq:.0%} em ativos líquidos — pode dificultar resgates.', liq)
    else:
        lq = ('yellow', 'Excesso de caixa',
              f'{liq:.0%} em liquidez — pode estar custando retorno.', liq)

    # 4) PROTEÇÃO CONTRA INFLAÇÃO
    inf = _inflation_protection(alloc, catalog)
    if inf >= 0.50:
        ipro = ('green',  'Bem protegida da inflação',
                f'{inf:.0%} em ativos que reagem à inflação (IPCA+ e ações).', inf)
    elif inf >= 0.30:
        ipro = ('yellow', 'Proteção parcial',
                f'{inf:.0%} em ativos protegidos da inflação.', inf)
    else:
        ipro = ('red',    'Pouca proteção inflacionária',
                f'Apenas {inf:.0%} em ativos protegidos da inflação.', inf)

    # 5) DEPENDÊNCIA DE APORTE
    if sens and 'aporte' in sens:
        p_50 = sens['aporte'].get(-0.50, p or 0)
        p_now = sens['aporte'].get(0.0, p or 0)
        drop = p_now - p_50
        if drop < 0.10:
            ap = ('green',  'Pouco sensível ao aporte',
                  'O plano permanece viável mesmo com aportes reduzidos.', drop)
        elif drop < 0.25:
            ap = ('yellow', 'Sensibilidade moderada ao aporte',
                  'Reduzir aportes pelos próximos meses tem impacto material.', drop)
        else:
            ap = ('red',    'Muito dependente de aporte',
                  'Plano é muito sensível à continuidade dos aportes mensais.', drop)
    else:
        ap = ('yellow', 'Sensibilidade não calculada', '—', 0)

    # 6) ADEQUAÇÃO AO PERFIL (carteira real vs declarado)
    declared_class_idx = ['conservative', 'moderate', 'aggressive', 'ultra_aggressive'].index(profile) \
        if profile in ['conservative', 'moderate', 'aggressive', 'ultra_aggressive'] else 1
    real_class_idx = ['conservadora', 'moderada', 'arrojada', 'agressiva'].index(real_class)
    diff = abs(real_class_idx - declared_class_idx)
    if diff == 0:
        ad = ('green',  'Carteira alinhada ao perfil',
              f'Perfil declarado e perfil real da carteira batem ({real_class}).', diff)
    elif diff == 1:
        ad = ('yellow', 'Pequeno desalinhamento',
              f'Carteira é {real_class}, perfil declarado é diferente.', diff)
    else:
        ad = ('red',    'Carteira desalinhada do perfil',
              f'Carteira ficou {real_class}, mas perfil declarado é distante.', diff)

    return {
        'viability':         {'status': viab[0], 'title': viab[1], 'desc': viab[2], 'value': viab[3]},
        'portfolio_risk':    {'status': rsk[0],  'title': rsk[1],  'desc': rsk[2],  'value': rsk[3]},
        'liquidity':         {'status': lq[0],   'title': lq[1],   'desc': lq[2],   'value': lq[3]},
        'inflation':         {'status': ipro[0], 'title': ipro[1], 'desc': ipro[2], 'value': ipro[3]},
        'contrib_dependency':{'status': ap[0],   'title': ap[1],   'desc': ap[2],   'value': ap[3]},
        'profile_match':     {'status': ad[0],   'title': ad[1],   'desc': ad[2],   'value': ad[3]},
    }


# Pesos do score consolidado 0–100
SCORE_WEIGHTS = {
    'prob_meta':       30,
    'profile_match':   15,
    'liquidity':       15,
    'diversification': 15,
    'inflation':       15,
    'efficiency':      10,
}


def plan_score(client: 'Client', goal: 'Goal', result: dict, sim: dict,
               view: 'MarketAssumptions', catalog: dict, risk: dict) -> dict:
    """Score consolidado 0–100 com decomposição por dimensão."""
    alloc = result['alloc']

    # 1) Probabilidade de atingir a meta (linear até 95%)
    p = sim.get('prob_meta')
    s_prob = min(p / 0.95, 1.0) * 100 if p is not None else 60.0

    # 2) Adequação ao perfil
    sigma = risk['sigma']
    lo, hi = _profile_target_vol(goal.risk)
    if lo <= sigma <= hi:
        s_profile = 100
    elif sigma > hi:
        s_profile = max(100 - (sigma - hi) * 500, 0)
    else:
        s_profile = max(80 - (lo - sigma) * 300, 50)

    # 3) Liquidez (peak em 15–25%, com tolerância)
    liq = _liquidity_score(alloc, catalog)
    if 0.10 <= liq <= 0.30:
        s_liq = 100
    elif liq < 0.10:
        s_liq = liq / 0.10 * 100
    else:
        s_liq = max(100 - (liq - 0.30) * 200, 40)

    # 4) Diversificação (HHI invertido)
    hhi = _herfindahl(alloc)
    s_div = max(0, (1 - hhi) * 100 * 1.4)
    s_div = min(s_div, 100)

    # 5) Proteção contra inflação
    inf = _inflation_protection(alloc, catalog)
    s_inf = min(inf / 0.65 * 100, 100)

    # 6) Eficiência risco-retorno (Sharpe normalizado: 0 = ruim, 0.4 = ótimo)
    sharpe = risk.get('sharpe', 0)
    s_eff = max(0, min(sharpe / 0.40, 1.0)) * 100

    components = {
        'prob_meta':       s_prob,
        'profile_match':   s_profile,
        'liquidity':       s_liq,
        'diversification': s_div,
        'inflation':       s_inf,
        'efficiency':      s_eff,
    }
    total = sum(components[k] * SCORE_WEIGHTS[k] for k in components) / sum(SCORE_WEIGHTS.values())

    if   total >= 80: rating = ('Excelente', '#40916C')
    elif total >= 65: rating = ('Bom',       '#74C69D')
    elif total >= 50: rating = ('Regular',   '#E9C46A')
    elif total >= 35: rating = ('Frágil',    '#F4A261')
    else:             rating = ('Crítico',   '#E63946')

    return {
        'score':      round(total, 1),
        'rating':     rating[0],
        'color':      rating[1],
        'components': {k: round(v, 1) for k, v in components.items()},
        'weights':    SCORE_WEIGHTS,
    }


def generate_alerts(client: 'Client', goal: 'Goal', result: dict, sim: dict,
                    sens: Optional[dict], view: 'MarketAssumptions',
                    catalog: dict, risk: dict) -> list:
    """Lista de alertas em ordem de severidade (crítico → leve)."""
    alerts: list = []
    alloc = result['alloc']
    sigma = risk['sigma']

    # 0) Avisos vindos da regra estratégica de mínimo 20% em ações
    enforce_log = result.get('enforce_log', {})
    if enforce_log.get('forced'):
        eq_b = enforce_log['equity_before']
        eq_a = enforce_log['equity_after']
        deficit = enforce_log['deficit_corrected']
        alerts.append({
            'level':  'medium',
            'title':  f'Piso estratégico de ações aplicado ({eq_a:.0%})',
            'msg':    f'A casa exige no mínimo {enforce_log["min_equity_applied"]:.0%} em ações '
                      f'em toda carteira. Equity foi elevada de {eq_b:.0%} para {eq_a:.0%} '
                      f'(+{deficit*100:.0f} p.p.) para alinhar à filosofia equity-first.',
        })
        for w in enforce_log.get('warnings', []):
            alerts.append({
                'level':  'medium',
                'title':  'Atenção sobre o piso de ações',
                'msg':    w,
            })

    # 1) Inviabilidade (mesmo com aporte 50% maior)
    p = sim.get('prob_meta')
    if p is not None and p < 0.50:
        alerts.append({
            'level':  'critical',
            'title':  'Meta com baixa probabilidade',
            'msg':    f'Com o aporte atual, a chance de atingir a meta é de apenas '
                      f'{p:.0%}. Aumentar aporte ou estender o prazo é recomendado.',
        })

    # 2) Concentração excessiva (HHI > 0.40)
    hhi = _herfindahl(alloc)
    if hhi > 0.40:
        worst = max(alloc.items(), key=lambda x: x[1])
        alerts.append({
            'level':  'high',
            'title':  'Carteira concentrada',
            'msg':    f'{catalog[worst[0]].label} representa {worst[1]:.0%} da carteira. '
                      'Recomendado distribuir mais.',
        })

    # 3) Liquidez insuficiente para horizonte curto
    liq = _liquidity_score(alloc, catalog)
    if goal.years <= 3 and liq < 0.20:
        alerts.append({
            'level':  'high',
            'title':  'Liquidez baixa para o prazo',
            'msg':    f'Objetivo de {goal.years:.0f} anos com apenas {liq:.0%} '
                      'em ativos líquidos.',
        })

    # 4) Risco acima do perfil
    lo, hi = _profile_target_vol(goal.risk)
    if sigma > hi:
        alerts.append({
            'level':  'high',
            'title':  'Risco acima do perfil declarado',
            'msg':    f'Volatilidade da carteira ({sigma:.1%}) excede o teto '
                      f'do perfil ({hi:.0%}).',
        })

    # 5) Prazo curto com ativos longos
    long_dur_w = sum(w for aid, w in alloc.items()
                     if catalog[aid].cat in ('ipca', 'prefixado')
                     and catalog[aid].anos > goal.years + 5)
    if goal.years <= 5 and long_dur_w > 0.20:
        alerts.append({
            'level':  'medium',
            'title':  'Duration acima do prazo',
            'msg':    f'{long_dur_w:.0%} em títulos com vencimento muito além do '
                      'objetivo — aumenta risco de marcação a mercado no resgate.',
        })

    # 6) Risco alto de perda real (vs IPCA)
    if sim.get('prob_perda_real', 0) > 0.30:
        alerts.append({
            'level':  'medium',
            'title':  'Risco de perda real',
            'msg':    f'{sim["prob_perda_real"]:.0%} dos cenários terminam abaixo da '
                      'inflação acumulada — preservação real comprometida.',
        })

    # 7) Drawdown profundo no pior cenário
    if sim.get('max_dd_p95', 0) < -0.30:
        alerts.append({
            'level':  'medium',
            'title':  'Drawdown elevado em cenários adversos',
            'msg':    f'No pior 5% dos cenários, queda transitória pode chegar a '
                      f'{abs(sim["max_dd_p95"]):.0%}.',
        })

    return alerts


def generate_suggestions(client: 'Client', goal: 'Goal', result: dict,
                         sim: dict, sens: Optional[dict],
                         view: 'MarketAssumptions', catalog: dict,
                         risk: dict, alerts: list) -> list:
    """Sugestões automáticas de ajuste — concretas, com números."""
    sugg: list = []
    alloc = result['alloc']

    p = sim.get('prob_meta')

    # Aporte requerido para 80%
    if p is not None and p < 0.80 and goal.target > 0:
        req = required_monthly_for_prob(
            alloc, client.savings, goal.years, goal.target, view, catalog,
            target_prob=0.80, n_paths=1500,
        )
        if req['monthly'] is not None:
            delta = req['monthly'] - client.monthly
            if delta > 0:
                sugg.append({
                    'type':  'increase_contribution',
                    'title': 'Aumentar o aporte mensal',
                    'msg':   f'Aporte de R$ {req["monthly"]:,.0f}/mês '
                             f'(R$ {delta:,.0f} a mais) eleva a probabilidade '
                             'de sucesso para 80%.',
                    'delta': delta,
                })
        else:
            sugg.append({
                'type':  'extend_horizon',
                'title': 'Estender prazo ou rever meta',
                'msg':   'Mesmo elevando muito o aporte, a meta atual no prazo '
                         'definido não atinge 80% de probabilidade. '
                         'Sugestão: estender prazo em 3–5 anos ou reduzir o alvo.',
            })

    # Subutilizando o perfil
    sigma = risk['sigma']
    lo, hi = _profile_target_vol(goal.risk)
    if sigma < lo - 0.02 and (p is None or p < 0.85):
        sugg.append({
            'type':  'increase_risk',
            'title': 'Considerar mais risco',
            'msg':   f'Carteira ({sigma:.1%}) está abaixo do potencial do perfil. '
                     'Aceitar mais ações pode aumentar a probabilidade de meta.',
        })

    # Risco acima do perfil
    if sigma > hi + 0.02:
        sugg.append({
            'type':  'reduce_risk',
            'title': 'Reduzir o risco da carteira',
            'msg':   f'Carteira ({sigma:.1%}) acima do teto do perfil. '
                     'Migrar parte do equity para IPCA+ casado com o prazo.',
        })

    # Liquidez insuficiente
    liq = _liquidity_score(alloc, catalog)
    if goal.years <= 3 and liq < 0.20:
        sugg.append({
            'type':  'add_liquidity',
            'title': 'Reforçar liquidez',
            'msg':   'Aumentar reserva em Tesouro Selic para acomodar o '
                     'horizonte curto e imprevistos.',
        })

    # Folga: relaxar floor para mais upside
    if p is not None and p > 0.92 and goal.years > 8:
        sugg.append({
            'type':  'allow_more_upside',
            'title': 'Folga para mais retorno',
            'msg':   f'Plano com {p:.0%} de probabilidade — há espaço para '
                     'aumentar levemente a parcela de ações em busca de retorno '
                     'adicional sem comprometer a meta.',
        })

    return sugg


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 12 — MULTI-OBJETIVO, REBALANCEAMENTO E APORTES INTELIGENTES
# ═══════════════════════════════════════════════════════════════════════════

def consolidate_portfolios(client: 'Client', view: 'MarketAssumptions',
                            catalog: dict) -> dict:
    """
    Quando o cliente tem múltiplos objetivos, calcula uma carteira CONSOLIDADA
    ponderada pelos aportes alocáveis a cada objetivo (com peso por priority).
    """
    if not client.goals:
        # Sem metas: carteira de crescimento
        goal = Goal('Crescimento patrimonial', 0, 10, 'aggressive', 5,
                    'aspirational', 'medium')
        result = build_portfolio(goal, client, view, catalog)
        return {
            'mode':       'single',
            'consolidated': result['alloc'],
            'breakdown':  [(goal, result, 1.0)],
        }

    if len(client.goals) == 1:
        result = build_portfolio(client.goals[0], client, view, catalog)
        return {
            'mode':       'single',
            'consolidated': result['alloc'],
            'breakdown':  [(client.goals[0], result, 1.0)],
        }

    # Múltiplos objetivos: pesos por priority (1=mais alta) e essenciais
    weights = []
    for g in client.goals:
        w = (6 - g.priority)
        if g.nature == 'essential':
            w *= 1.5
        weights.append(w)
    tot = sum(weights)
    weights = [w / tot for w in weights]

    breakdown = []
    consolidated: dict = {}
    for g, gw in zip(client.goals, weights):
        result = build_portfolio(g, client, view, catalog)
        breakdown.append((g, result, gw))
        for aid, w in result['alloc'].items():
            consolidated[aid] = consolidated.get(aid, 0) + gw * w

    # Renormaliza (proteção contra erros de arredondamento)
    s = sum(consolidated.values())
    if s > 0:
        consolidated = {k: v / s for k, v in consolidated.items()}

    return {
        'mode':       'consolidated',
        'consolidated': consolidated,
        'breakdown':  breakdown,
    }


# Bandas de tolerância para rebalanceamento (por classe)
REBAL_BANDS_PP = {
    'conservadora': 3.0,    # ±3 p.p.
    'moderada':     5.0,
    'arrojada':     6.0,
    'agressiva':    7.5,
}


def rebalance_rules(real_class: str) -> dict:
    """Regras de rebalanceamento conforme classe real da carteira."""
    band = REBAL_BANDS_PP.get(real_class, 5.0)
    return {
        'frequency':      'Trimestral',
        'review_period':  'Anual',
        'band_pp':        band,
        'rule':           f'Rebalancear quando uma classe sair mais de {band:.0f} p.p. '
                          f'do alvo, ou trimestralmente — o que vier primeiro.',
    }


def smart_contribution_split(alloc: dict, current: dict, monthly: float,
                              catalog: dict) -> list:
    """
    Como dividir o próximo aporte mensal de forma inteligente.

    Para cada classe: aporte vai PRIMEIRO para classes abaixo do alvo,
    proporcional ao gap. Se todas equilibradas, distribui pelo alvo.
    """
    # Agrega por classe
    target_class: dict = {}
    for aid, w in alloc.items():
        cls = catalog[aid].cat
        target_class[cls] = target_class.get(cls, 0) + w

    # Atual (se houver)
    current_class: dict = {}
    if current:
        tot_curr = sum(current.values())
        if tot_curr > 0:
            for aid, v in current.items():
                cls = catalog.get(aid, type('A', (), {'cat': 'outro'})).cat
                current_class[cls] = current_class.get(cls, 0) + v / tot_curr

    # Calcula gaps positivos (onde estamos abaixo do alvo)
    gaps = {}
    for cls, tgt in target_class.items():
        cur = current_class.get(cls, 0)
        if tgt - cur > 0:
            gaps[cls] = tgt - cur

    if gaps and sum(gaps.values()) > 0.01:
        tot_gap = sum(gaps.values())
        split = [(cls, monthly * (g / tot_gap), g) for cls, g in gaps.items()]
    else:
        split = [(cls, monthly * w, 0) for cls, w in target_class.items()]

    return sorted(split, key=lambda x: -x[1])


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 13 — COMPARAÇÃO COM CARTEIRA ATUAL DO CLIENTE
# ═══════════════════════════════════════════════════════════════════════════

def compare_current_vs_recommended(current: dict, recommended: dict,
                                    savings: float, monthly: float,
                                    years: float, target: float,
                                    view: 'MarketAssumptions',
                                    catalog: dict, n_paths: int = 2000) -> dict:
    """
    Compara carteira atual do cliente com a recomendada.
    `current`: dict {asset_id: valor_em_R$}  → será normalizado p/ pesos
    """
    if not current or sum(current.values()) == 0:
        return {'has_current': False}

    tot = sum(current.values())
    cur_w = {aid: v / tot for aid, v in current.items() if aid in catalog}
    s = sum(cur_w.values())
    if s > 0:
        cur_w = {k: v / s for k, v in cur_w.items()}
    else:
        return {'has_current': False}

    # Risco e MC para a carteira atual
    risk_cur = portfolio_risk(cur_w, view, catalog, liquid=True)
    sim_cur = run_monte_carlo(cur_w, savings, monthly, years,
                                target if target > 0 else None,
                                view, catalog, n_paths=n_paths)

    risk_rec = portfolio_risk(recommended, view, catalog, liquid=True)
    sim_rec = run_monte_carlo(recommended, savings, monthly, years,
                                target if target > 0 else None,
                                view, catalog, n_paths=n_paths)

    return {
        'has_current':       True,
        'current_alloc':     cur_w,
        'current_risk':      risk_cur,
        'current_sim':       sim_cur,
        'recommended_risk':  risk_rec,
        'recommended_sim':   sim_rec,
        'delta_mu':          risk_rec['mu'] - risk_cur['mu'],
        'delta_sigma':       risk_rec['sigma'] - risk_cur['sigma'],
        'delta_sharpe':      risk_rec['sharpe'] - risk_cur['sharpe'],
        'delta_prob':        ((sim_rec.get('prob_meta') or 0) -
                              (sim_cur.get('prob_meta') or 0))
                             if target and target > 0 else None,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 13b — CAMADA ZERO: RESERVA DE EMERGÊNCIA
# ───────────────────────────────────────────────────────────────────────────
# Antes de qualquer otimização de carteira, validar a reserva. Se incompleta,
# direcionar 100% do aporte (e parcela do patrimônio se preciso) para Selic.
# Se completa, liberar para o motor de objetivos.
#
# A camada ZERO é PRÉ-CONDIÇÃO: não negociável, não otimizável, vem antes.
# ═══════════════════════════════════════════════════════════════════════════

def analyze_emergency_fund(client: Client) -> dict:
    """
    Análise completa da reserva de emergência.

    Returns:
      {
        'status':           'incomplete' | 'partial' | 'complete' | 'excess',
        'balance':          R$ atual,
        'target':           R$ necessário,
        'deficit':          R$ faltante,
        'progress':         0–1.5,
        'months_target':    int,
        'months_to_complete': float ou None,
        'recommended_split': dict {
            'to_emergency':  R$/mês para reserva
            'to_goals':       R$/mês para metas
        },
        'message':          str (resumo amigável),
        'severity':         'critical' | 'high' | 'medium' | 'ok',
      }
    """
    fund = get_emergency_fund(client)
    progress = fund.progress(client.expenses)
    status = fund.status(client.expenses)
    deficit = fund.deficit(client.expenses)
    target = fund.required(client.expenses)
    balance = fund.balance or 0.0
    eta = fund.months_to_complete(client.expenses, client.monthly)

    # Split do aporte mensal entre reserva e metas
    if status == 'incomplete':
        # Reserva crítica: 100% do aporte vai para reserva
        split = {'to_emergency': client.monthly, 'to_goals': 0.0}
        severity = 'critical'
        msg = (f'Reserva incompleta ({progress*100:.0f}% do necessário). '
               f'Sua prioridade absoluta hoje é construir essa reserva antes '
               f'de qualquer outro objetivo.')
    elif status == 'partial':
        # 70/30 para reserva, mantém algum fluxo para metas
        split = {'to_emergency': client.monthly * 0.70,
                 'to_goals':     client.monthly * 0.30}
        severity = 'high'
        msg = (f'Reserva em construção ({progress*100:.0f}% do necessário). '
               f'A maior parte do aporte continua indo para a reserva.')
    elif status == 'complete':
        split = {'to_emergency': 0.0, 'to_goals': client.monthly}
        severity = 'ok'
        msg = (f'Reserva completa ({progress*100:.0f}% do necessário). '
               f'Aportes liberados integralmente para os objetivos.')
    else:  # excess
        split = {'to_emergency': 0.0, 'to_goals': client.monthly}
        severity = 'medium'
        excess_value = balance - target
        msg = (f'Excesso de reserva (R$ {excess_value:,.0f} além do necessário). '
               f'Considere migrar parte para investimentos com mais retorno.')

    return {
        'status':              status,
        'balance':             balance,
        'target':              target,
        'deficit':             deficit,
        'progress':            progress,
        'months_target':       fund.months_target,
        'months_to_complete':  eta,
        'recommended_split':   split,
        'message':             msg,
        'severity':            severity,
        'fund':                fund,
    }


def emergency_action_plan(client: Client, ef_analysis: dict) -> list:
    """Lista de ações concretas para a reserva (linguagem cliente)."""
    actions = []
    status = ef_analysis['status']
    fund = ef_analysis['fund']

    if status == 'incomplete':
        eta = ef_analysis['months_to_complete']
        if eta is not None:
            actions.append({
                'icon':  '🎯',
                'title': 'Direcione 100% do aporte para a reserva',
                'detail': f'R$ {client.monthly:,.0f}/mês em Tesouro Selic. '
                          f'A reserva fica pronta em {eta:.0f} meses.',
            })
        if ef_analysis['deficit'] > client.monthly * 12:
            extra_needed = ef_analysis['deficit'] - client.monthly * 12
            actions.append({
                'icon':  '⚡',
                'title': 'Considere aporte único adicional',
                'detail': f'Para acelerar, um aporte extra de R$ {extra_needed:,.0f} '
                          f'reduz o tempo de construção pela metade.',
            })

    elif status == 'partial':
        split = ef_analysis['recommended_split']
        actions.append({
            'icon':  '⚖',
            'title': 'Split do aporte mensal',
            'detail': f'Continue R$ {split["to_emergency"]:,.0f} para reserva e '
                      f'já comece R$ {split["to_goals"]:,.0f} para os objetivos.',
        })

    elif status == 'complete':
        actions.append({
            'icon':  '✓',
            'title': 'Reserva pronta — foco mudou',
            'detail': f'R$ {client.monthly:,.0f}/mês agora vão integralmente '
                      f'para os objetivos. Revisar a reserva anualmente.',
        })

    elif status == 'excess':
        target = ef_analysis['target']
        excess = ef_analysis['balance'] - target
        actions.append({
            'icon':  '💡',
            'title': 'Migrar excesso para investimentos',
            'detail': f'Manter R$ {target:,.0f} em Selic (cobertura de '
                      f'{fund.months_target} meses) e direcionar R$ {excess:,.0f} '
                      f'para a carteira de objetivos.',
        })

    return actions


def emergency_should_block_goals(client: Client) -> bool:
    """
    Indica se a reserva está crítica a ponto de o sistema NÃO mostrar
    metas de longo prazo até resolver. Threshold: progress < 30%.
    """
    fund = get_emergency_fund(client)
    return fund.progress(client.expenses) < 0.30


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 13c — PERSISTÊNCIA E TRACKING (SQLite)
# ───────────────────────────────────────────────────────────────────────────
# Armazena snapshots periódicos para que o sistema pare de ser stateless.
# Cada snapshot = (cliente, data, score, métricas, alocação alvo, premissas).
# Permite gráficos de evolução, marcos, attribution e governança histórica.
#
# Uso:
#   init_db()                        # uma vez (idempotente)
#   save_snapshot(client, ...)       # dentro de generate_report quando save=True
#   load_history(client_id)          # automático se o histórico tiver 2+ pontos
# ═══════════════════════════════════════════════════════════════════════════

import sqlite3
import json
from datetime import datetime, date

DEFAULT_DB_PATH = 'portfolio_history.db'


def init_db(db_path: str = DEFAULT_DB_PATH) -> None:
    """Cria as tabelas se não existirem. Idempotente."""
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS snapshots (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id       TEXT    NOT NULL,
            client_name     TEXT,
            timestamp       TEXT    NOT NULL,
            goal_name       TEXT,
            goal_target     REAL,
            goal_years      REAL,
            score           REAL,
            score_rating    TEXT,
            score_components TEXT,
            mu              REAL,
            sigma           REAL,
            sharpe          REAL,
            var_95          REAL,
            prob_meta       REAL,
            prob_perda_real REAL,
            patrimony       REAL,
            monthly_contrib REAL,
            real_class      TEXT,
            emergency_status TEXT,
            emergency_progress REAL,
            emergency_balance REAL,
            emergency_target REAL,
            alloc_target    TEXT,
            alerts_count    INTEGER,
            view_ipca       REAL,
            view_selic      REAL,
            view_conviction REAL,
            enforce_forced  INTEGER
        )
    ''')
    c.execute('CREATE INDEX IF NOT EXISTS idx_client_time ON snapshots(client_id, timestamp)')
    conn.commit()
    conn.close()


def save_snapshot(client: Client, goal: Goal, result: dict, sim: dict,
                   risk: dict, score: dict, ef_analysis: dict,
                   view: MarketAssumptions, alerts: list,
                   db_path: str = DEFAULT_DB_PATH,
                   timestamp: Optional[str] = None) -> int:
    """
    Persiste um snapshot da sessão atual.

    Returns:
        id do snapshot inserido
    """
    init_db(db_path)
    ts = timestamp or datetime.now().isoformat()
    real_class = classify_portfolio(risk['sigma'])

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''
        INSERT INTO snapshots (
            client_id, client_name, timestamp, goal_name, goal_target, goal_years,
            score, score_rating, score_components,
            mu, sigma, sharpe, var_95, prob_meta, prob_perda_real,
            patrimony, monthly_contrib, real_class,
            emergency_status, emergency_progress, emergency_balance, emergency_target,
            alloc_target, alerts_count,
            view_ipca, view_selic, view_conviction, enforce_forced
        ) VALUES (?, ?, ?, ?, ?, ?,  ?, ?, ?,  ?, ?, ?, ?, ?, ?,
                  ?, ?, ?,  ?, ?, ?, ?,  ?, ?,  ?, ?, ?, ?)
    ''', (
        client.id, client.name, ts, goal.name, goal.target, goal.years,
        score['score'], score['rating'], json.dumps(score['components']),
        risk['mu'], risk['sigma'], risk['sharpe'], risk.get('var_95'),
        sim.get('prob_meta'), sim.get('prob_perda_real'),
        client.savings, client.monthly, real_class,
        ef_analysis['status'], ef_analysis['progress'],
        ef_analysis['balance'], ef_analysis['target'],
        json.dumps(result['alloc']), len(alerts),
        view.ipca_esperado, view.selic_esperada, view.conviction,
        int(result.get('enforce_log', {}).get('forced', False)),
    ))
    snapshot_id = c.lastrowid
    conn.commit()
    conn.close()
    return snapshot_id


def load_history(client_id: str, goal_name: Optional[str] = None,
                  db_path: str = DEFAULT_DB_PATH, limit: int = 24) -> list:
    """
    Retorna lista de snapshots, ordem cronológica (mais antigo primeiro).
    Se a base não existir ainda, retorna [].
    """
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        q = '''SELECT id, timestamp, goal_name, score, score_rating,
                       mu, sigma, sharpe, prob_meta, patrimony, monthly_contrib,
                       real_class, emergency_status, emergency_progress,
                       emergency_balance, alerts_count, alloc_target,
                       view_ipca, view_selic, enforce_forced
               FROM snapshots WHERE client_id = ?'''
        params = [client_id]
        if goal_name:
            q += ' AND goal_name = ?'
            params.append(goal_name)
        q += ' ORDER BY timestamp ASC LIMIT ?'
        params.append(limit)
        c.execute(q, params)
        rows = c.fetchall()
        conn.close()

        cols = ['id', 'timestamp', 'goal_name', 'score', 'rating',
                'mu', 'sigma', 'sharpe', 'prob_meta', 'patrimony',
                'monthly', 'real_class', 'emergency_status',
                'emergency_progress', 'emergency_balance', 'alerts_count',
                'alloc_target', 'view_ipca', 'view_selic', 'enforce_forced']
        return [dict(zip(cols, r)) for r in rows]
    except (sqlite3.OperationalError, sqlite3.DatabaseError):
        return []


def history_summary(history: list) -> dict:
    """
    Sumário do histórico para alimentar UI de evolução.

    Returns:
      {
        'count':          n_snapshots,
        'first_date':     str,
        'last_date':      str,
        'score_delta':    delta vs primeiro,
        'score_trend':    'up' | 'down' | 'flat',
        'patrimony_delta': delta R$ vs primeiro,
        'milestones':     lista de eventos importantes,
      }
    """
    if len(history) < 2:
        return {'count': len(history)}

    first, last = history[0], history[-1]

    score_delta = (last['score'] or 0) - (first['score'] or 0)
    if   score_delta > 3:  trend = 'up'
    elif score_delta < -3: trend = 'down'
    else:                  trend = 'flat'

    patr_delta = (last['patrimony'] or 0) - (first['patrimony'] or 0)

    # Detecta marcos: mudança de status reserva, perfil real, view_ipca
    milestones = []
    for i in range(1, len(history)):
        prev, cur = history[i-1], history[i]
        if prev['emergency_status'] != cur['emergency_status']:
            milestones.append({
                'date': cur['timestamp'][:10],
                'kind': 'emergency',
                'label': f'Reserva: {prev["emergency_status"]} → {cur["emergency_status"]}',
            })
        if prev['real_class'] != cur['real_class']:
            milestones.append({
                'date': cur['timestamp'][:10],
                'kind': 'risk',
                'label': f'Carteira: {prev["real_class"]} → {cur["real_class"]}',
            })
        if abs((cur['view_ipca'] or 0) - (prev['view_ipca'] or 0)) > 0.005:
            milestones.append({
                'date': cur['timestamp'][:10],
                'kind': 'macro',
                'label': f'Premissa IPCA: {prev["view_ipca"]*100:.1f}% → {cur["view_ipca"]*100:.1f}%',
            })

    return {
        'count':            len(history),
        'first_date':       first['timestamp'][:10],
        'last_date':        last['timestamp'][:10],
        'first_score':      first['score'] or 0,
        'last_score':       last['score'] or 0,
        'score_delta':      score_delta,
        'score_trend':      trend,
        'patrimony_first':  first['patrimony'] or 0,
        'patrimony_last':   last['patrimony'] or 0,
        'patrimony_delta':  patr_delta,
        'milestones':       milestones,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 14 — HELPERS DE OUTPUT (formatadores e blocos HTML reutilizáveis)
# ═══════════════════════════════════════════════════════════════════════════

def fmt(x: float) -> str:
    """Formata valor monetário em BRL."""
    if x is None:
        return '—'
    if abs(x) >= 1_000_000:
        return f'R$ {x/1_000_000:,.2f}M'.replace(',', '.').replace('.', ',', 1).replace(',', 'X', 1).replace('.', ',').replace('X', '.')
    return f'R$ {x:,.0f}'.replace(',', '.')


def pct(x: float, d: int = 1) -> str:
    """Formata percentual."""
    if x is None:
        return '—'
    return f'{x*100:.{d}f}%'


# Cores institucionais (paleta financeira sóbria)
PALETTE = {
    'bg':        '#0a0f0d',
    'bg_card':   '#101a16',
    'bg_card2':  '#0d1411',
    'border':    '#1e3a2e',
    'border_lt': '#26473a',
    'text':      '#e8efe9',
    'text_dim':  '#9aa6a0',
    'text_lt':   '#c5d0c8',
    'green':     '#40916C',
    'green_lt':  '#74C69D',
    'yellow':    '#E9C46A',
    'orange':    '#F4A261',
    'red':       '#E63946',
    'gold':      '#D4A017',
    'blue':      '#4895EF',
}

STATUS_COLOR = {
    'green':  PALETTE['green'],
    'yellow': PALETTE['yellow'],
    'red':    PALETTE['red'],
}

STATUS_DOT = {
    'green':  '🟢',
    'yellow': '🟡',
    'red':    '🔴',
}


def _card(title: str, body: str, badge: str = '', color: str = None) -> str:
    """Card HTML padrão para o dashboard cliente."""
    bcolor = color or PALETTE['green']
    badge_html = (f'<span style="background:{bcolor}22;color:{bcolor};padding:2px 8px;'
                  f'border-radius:10px;font-size:10px;margin-left:8px;letter-spacing:1px">'
                  f'{badge}</span>' if badge else '')
    return (f'<div style="background:{PALETTE["bg_card"]};border:1px solid {PALETTE["border"]};'
            f'border-radius:10px;padding:18px 22px;margin:12px 0;'
            f'font-family:-apple-system,BlinkMacSystemFont,sans-serif">'
            f'<div style="color:{bcolor};font-size:10px;letter-spacing:2px;'
            f'text-transform:uppercase;font-weight:700;margin-bottom:10px">'
            f'● {title}{badge_html}</div>'
            f'{body}</div>')


def asset_role(a: 'Asset', goal: 'Goal') -> str:
    """Papel narrativo de cada ativo na carteira (linguagem cliente)."""
    if a.cat == 'selic':
        return 'Reserva e liquidez imediata'
    if a.cat == 'ipca':
        if 'princ' in a.label.lower():
            return f'Âncora real — protege contra inflação até {a.anos:.0f}a'
        return f'Proteção real de longo prazo ({a.anos:.0f}a)'
    if a.cat == 'prefixado':
        return f'Trava nominal de {a.anos:.0f}a — beneficia se Selic cair'
    if a.cat == 'equity':
        if 'div' in a.id:
            return 'Renda recorrente via dividendos'
        return 'Crescimento real de longo prazo'
    return '—'


def asset_liquidity_label(a: 'Asset') -> str:
    if a.cat == 'selic':                    return 'Alta'
    if a.cat == 'equity':                   return 'Alta (D+2)'
    if a.cat in ('prefixado', 'ipca') and a.anos <= 2: return 'Alta'
    if a.cat in ('prefixado', 'ipca') and a.anos <= 7: return 'Média'
    return 'Baixa (carregar até venc.)'


def asset_risk_label(a: 'Asset') -> str:
    if a.vol < 0.03:  return 'Muito baixo'
    if a.vol < 0.07:  return 'Baixo'
    if a.vol < 0.12:  return 'Moderado'
    if a.vol < 0.20:  return 'Alto'
    return 'Muito alto'


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 15 — DASHBOARD DO CLIENTE  (HTML institucional, sem premissas)
# ───────────────────────────────────────────────────────────────────────────
# Tudo aqui usa apenas RESULTADOS do motor — não expõe IPCA, Selic, curva,
# convicção, correlação, tilts, alpha, etc. A linguagem é direta e foca
# no que o cliente precisa entender e decidir.
# ═══════════════════════════════════════════════════════════════════════════

def client_header_card(client: 'Client', goal: 'Goal',
                        score: dict, real_class: str) -> str:
    """Card de cabeçalho: identidade do plano e status global."""
    body = f"""
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:8px">
      <div><div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Cliente</div>
           <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:2px">{client.name}</div></div>
      <div><div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Objetivo</div>
           <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:2px">{goal.name}</div></div>
      <div><div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Prazo</div>
           <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:2px">{goal.years:.0f} anos</div></div>
      <div><div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Meta</div>
           <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:2px">
              {fmt(goal.target) if goal.target > 0 else 'Crescimento'}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px">
      <div><div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Patrimônio inicial</div>
           <div style="color:{PALETTE['text']};font-size:16px;font-weight:500;margin-top:2px">{fmt(client.savings)}</div></div>
      <div><div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Aporte mensal</div>
           <div style="color:{PALETTE['text']};font-size:16px;font-weight:500;margin-top:2px">{fmt(client.monthly)}</div></div>
      <div><div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Perfil</div>
           <div style="color:{PALETTE['text']};font-size:16px;font-weight:500;margin-top:2px">{goal.risk.title()}</div></div>
      <div><div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Carteira real</div>
           <div style="color:{PALETTE['text']};font-size:16px;font-weight:500;margin-top:2px;text-transform:capitalize">{real_class}</div></div>
    </div>
    """
    return _card('Resumo do Plano', body, color=PALETTE['green'])


def client_score_card(score: dict) -> str:
    """Card de score 0–100 com decomposição."""
    s, color, rating = score['score'], score['color'], score['rating']
    bar_html = ''
    labels = {
        'prob_meta':       'Probabilidade da meta',
        'profile_match':   'Adequação ao perfil',
        'liquidity':       'Liquidez',
        'diversification': 'Diversificação',
        'inflation':       'Proteção inflação',
        'efficiency':      'Eficiência risco/retorno',
    }
    for k, v in score['components'].items():
        c = (PALETTE['green'] if v >= 75 else
             PALETTE['green_lt'] if v >= 60 else
             PALETTE['yellow'] if v >= 45 else
             PALETTE['orange'] if v >= 30 else PALETTE['red'])
        bar_html += f"""
        <div style="display:grid;grid-template-columns:160px 1fr 50px;gap:10px;align-items:center;margin:6px 0">
          <div style="color:{PALETTE['text_lt']};font-size:12px">{labels[k]}</div>
          <div style="background:#0a0a0a;border-radius:4px;height:8px;overflow:hidden">
            <div style="background:{c};height:100%;width:{min(v,100):.0f}%;border-radius:4px"></div>
          </div>
          <div style="color:{c};font-size:12px;font-weight:600;text-align:right">{v:.0f}</div>
        </div>
        """
    body = f"""
    <div style="display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:center">
      <div style="text-align:center;padding:14px 0">
        <div style="font-size:62px;font-weight:700;color:{color};line-height:1">{s:.0f}</div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:2px;margin-top:4px">SCORE / 100</div>
        <div style="color:{color};font-size:14px;font-weight:600;margin-top:8px">{rating}</div>
      </div>
      <div>{bar_html}</div>
    </div>
    """
    return _card('Score do Plano', body, badge=rating, color=color)


def client_traffic_light_card(tl: dict) -> str:
    """Semáforo de 6 dimensões."""
    items = [
        ('viability',          'Viabilidade da meta'),
        ('portfolio_risk',     'Risco da carteira'),
        ('liquidity',          'Liquidez'),
        ('inflation',          'Proteção inflação'),
        ('contrib_dependency', 'Dependência do aporte'),
        ('profile_match',      'Adequação ao perfil'),
    ]
    rows = ''
    for key, label in items:
        d = tl[key]
        c = STATUS_COLOR[d['status']]
        rows += f"""
        <div style="display:grid;grid-template-columns:24px 200px 1fr;gap:12px;align-items:start;margin:10px 0;
                    padding:12px 0;border-bottom:1px solid {PALETTE['border']}33">
          <div style="font-size:14px">{STATUS_DOT[d['status']]}</div>
          <div>
            <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">{label}</div>
            <div style="color:{c};font-size:14px;font-weight:600;margin-top:2px">{d['title']}</div>
          </div>
          <div style="color:{PALETTE['text_lt']};font-size:13px;line-height:1.5">{d['desc']}</div>
        </div>
        """
    return _card('Diagnóstico do Plano', rows, color=PALETTE['blue'])


def client_allocation_card(alloc: dict, savings: float, monthly: float,
                            catalog: dict, goal: 'Goal') -> str:
    """Tabela final pronta para o cliente."""
    # Agrupa por classe
    by_class: dict = {}
    for aid, w in alloc.items():
        a = catalog[aid]
        cls_label = {
            'selic':     'Selic / Liquidez',
            'prefixado': 'Prefixado',
            'ipca':      'IPCA+ (inflação)',
            'equity':    'Ações',
        }.get(a.cat, a.cat)
        by_class.setdefault(cls_label, []).append((aid, a, w))

    rows = ''
    for cls, items in by_class.items():
        cls_w = sum(x[2] for x in items)
        rows += f"""
        <tr style="background:{PALETTE['bg_card2']}">
          <td style="padding:10px 12px;color:{PALETTE['text']};font-weight:600;font-size:12px;
                     border-top:1px solid {PALETTE['border']}" colspan="7">
            {cls} — {cls_w*100:.1f}% · {fmt(savings*cls_w)} alocado · {fmt(monthly*cls_w)}/mês
          </td>
        </tr>"""
        for aid, a, w in sorted(items, key=lambda x: -x[2]):
            rows += f"""
        <tr style="border-bottom:1px solid {PALETTE['border']}55">
          <td style="padding:8px 12px;color:{PALETTE['text_lt']};font-size:12px">{a.label}</td>
          <td style="padding:8px 12px;color:{PALETTE['text']};font-size:12px;text-align:right;font-variant-numeric:tabular-nums">{w*100:.1f}%</td>
          <td style="padding:8px 12px;color:{PALETTE['text']};font-size:12px;text-align:right;font-variant-numeric:tabular-nums">{fmt(savings*w)}</td>
          <td style="padding:8px 12px;color:{PALETTE['text']};font-size:12px;text-align:right;font-variant-numeric:tabular-nums">{fmt(monthly*w)}</td>
          <td style="padding:8px 12px;color:{PALETTE['text_dim']};font-size:11px">{asset_role(a, goal)}</td>
          <td style="padding:8px 12px;color:{PALETTE['text_dim']};font-size:11px">{asset_risk_label(a)}</td>
          <td style="padding:8px 12px;color:{PALETTE['text_dim']};font-size:11px">{asset_liquidity_label(a)}</td>
        </tr>"""

    table = f"""
    <table style="width:100%;border-collapse:collapse;font-family:monospace;margin-top:10px">
      <thead>
        <tr style="border-bottom:2px solid {PALETTE['border']}">
          <th style="text-align:left;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">ATIVO</th>
          <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">PESO</th>
          <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">VALOR INICIAL</th>
          <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">APORTE/MÊS</th>
          <th style="text-align:left;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">PAPEL</th>
          <th style="text-align:left;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">RISCO</th>
          <th style="text-align:left;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">LIQUIDEZ</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
    """
    return _card('Carteira Recomendada', table, color=PALETTE['gold'])


def client_strategy_card(alloc: dict, catalog: dict, goal: 'Goal') -> str:
    """O QUE essa carteira busca fazer (linguagem simples)."""
    inf = _inflation_protection(alloc, catalog)
    liq = _liquidity_score(alloc, catalog)
    eq  = sum(w for aid, w in alloc.items() if catalog[aid].cat == 'equity')
    floor_w = sum(w for aid, w in alloc.items() if catalog[aid].cat in ('ipca','selic'))

    bullets = [
        ('🛡', 'Proteger a meta',
         f'Aproximadamente {floor_w*100:.0f}% da carteira em ativos de renda fixa '
         'que tendem a entregar resultado mais previsível ao longo do prazo.'),
        ('💧', 'Preservar liquidez',
         f'{liq*100:.0f}% em ativos de alta liquidez para imprevistos e flexibilidade.'),
        ('📈', 'Buscar crescimento',
         f'{eq*100:.0f}% em ações dividida entre dividendos (renda) e crescimento '
         '(retorno de longo prazo).' if eq > 0 else 'Sem exposição a renda variável neste plano.'),
        ('🌡', 'Proteger contra a inflação',
         f'{inf*100:.0f}% em ativos que reagem ao IPCA, de forma a preservar '
         'o poder de compra ao longo do prazo.'),
        ('⚖', 'Limitar concentração',
         'Alocação dividida entre múltiplos ativos e classes para reduzir o impacto '
         'de qualquer evento isolado.'),
    ]
    body = ''
    for icon, t, d in bullets:
        body += f"""
        <div style="display:grid;grid-template-columns:30px 1fr;gap:12px;margin:10px 0;align-items:start">
          <div style="font-size:18px">{icon}</div>
          <div>
            <div style="color:{PALETTE['text']};font-size:13px;font-weight:600">{t}</div>
            <div style="color:{PALETTE['text_dim']};font-size:12px;line-height:1.5;margin-top:2px">{d}</div>
          </div>
        </div>
        """
    return _card('O que essa carteira busca fazer', body, color=PALETTE['green_lt'])


def client_rationale_card(alloc: dict, catalog: dict, goal: 'Goal') -> str:
    """Por que cada classe foi escolhida (sem mostrar premissas)."""
    classes_present = set(catalog[aid].cat for aid in alloc)
    blocks = []
    if 'selic' in classes_present:
        blocks.append(('● Tesouro Selic / Liquidez',
            'Reserva de curto prazo. Acompanha a Selic e tem oscilação mínima — '
            'serve para emergências, ajustes de curso e janelas de oportunidade. '
            'É a parte da carteira que você acessa rápido sem se preocupar com timing.'))
    if 'ipca' in classes_present:
        blocks.append(('● IPCA+ (Tesouro IPCA)',
            f'Trava um juro real (acima da inflação) até o vencimento. '
            f'Como o seu objetivo é em {goal.years:.0f} anos, escolhemos um título '
            'com prazo casado: o pior cenário é levar até o fim e receber a taxa contratada. '
            'Funciona como âncora do plano.'))
    if 'prefixado' in classes_present:
        blocks.append(('● Prefixado',
            'Trava uma taxa nominal hoje. Tende a ganhar valor de mercado se o '
            'cenário de juros melhorar (Selic caindo). Carregando até o vencimento, '
            'entrega exatamente a taxa contratada.'))
    if 'equity' in classes_present:
        blocks.append(('● Ações',
            'Parcela de crescimento. No curto prazo oscila bastante, mas no horizonte '
            'do seu objetivo tende a ser o que faz o patrimônio crescer acima da inflação. '
            'Dividida em duas estratégias: dividendos (renda recorrente) e crescimento '
            '(empresas com potencial de valorização).'))
    blocks.append(('● Por que não concentrar tudo num único ativo',
        'Cada classe reage de forma diferente a cenários de inflação, juros e atividade. '
        'Combinando-as, a carteira fica mais resiliente: quando um ativo enfrenta vento '
        'contrário, outro tende a compensar.'))

    body = ''
    for t, d in blocks:
        body += f"""
        <div style="margin:14px 0;padding:12px 14px;background:{PALETTE['bg_card2']};
                    border-left:3px solid {PALETTE['green']};border-radius:4px">
          <div style="color:{PALETTE['text']};font-size:13px;font-weight:600;margin-bottom:4px">{t}</div>
          <div style="color:{PALETTE['text_lt']};font-size:12px;line-height:1.55">{d}</div>
        </div>
        """
    return _card('Por que essa carteira foi escolhida', body, color=PALETTE['green'])


def client_risks_card(alerts: list, sim: dict, risk: dict) -> str:
    """Principais riscos em linguagem cliente."""
    risk_items = [
        ('Risco de mercado',
         f'Volatilidade anual da carteira: {risk["sigma"]*100:.1f}%. '
         'Em períodos curtos, o saldo pode oscilar para baixo antes de se recuperar.'),
        ('Risco de marcação a mercado',
         'Títulos prefixados e IPCA+ oscilam de preço diariamente. '
         'Se você precisar resgatar antes do vencimento, pode haver perda — '
         'por isso esse plano foi montado para carregar até o prazo do objetivo.'),
        ('Risco de inflação',
         f'Em cerca de {sim.get("prob_perda_real",0)*100:.0f}% dos cenários, '
         'o resultado final, ajustado pela inflação, fica abaixo do total aportado. '
         'Por isso há proteção via IPCA+ e ações.'),
        ('Risco de aporte insuficiente',
         'A meta depende da continuidade dos aportes mensais. '
         'Interrupções prolongadas exigem revisão do plano.'),
        ('Risco de concentração',
         'Limitamos peso por classe e por ativo, mas eventos sistêmicos podem '
         'afetar várias classes ao mesmo tempo (ex.: choque inflacionário severo).'),
        ('Risco de prazo',
         'Mudanças no prazo do objetivo (antecipar ou adiar) alteram a carteira ideal. '
         'Avise sempre que o horizonte mudar.'),
    ]
    body = ''
    for t, d in risk_items:
        body += f"""
        <div style="margin:10px 0;padding:10px 12px;background:{PALETTE['bg_card2']};border-radius:4px">
          <div style="color:{PALETTE['text']};font-size:12px;font-weight:600;margin-bottom:3px">{t}</div>
          <div style="color:{PALETTE['text_dim']};font-size:11px;line-height:1.5">{d}</div>
        </div>
        """

    if alerts:
        body += f"""
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid {PALETTE['border']}">
          <div style="color:{PALETTE['orange']};font-size:11px;letter-spacing:1.5px;
                      text-transform:uppercase;font-weight:700;margin-bottom:8px">⚠ Alertas deste plano</div>
        """
        for a in alerts:
            color = {'critical': PALETTE['red'], 'high': PALETTE['orange'],
                     'medium': PALETTE['yellow']}.get(a['level'], PALETTE['yellow'])
            body += f"""
          <div style="margin:8px 0;padding:8px 12px;background:{color}15;
                      border-left:3px solid {color};border-radius:4px">
            <div style="color:{color};font-size:12px;font-weight:600">{a['title']}</div>
            <div style="color:{PALETTE['text_lt']};font-size:11px;line-height:1.5;margin-top:2px">{a['msg']}</div>
          </div>"""
        body += '</div>'

    return _card('Principais Riscos', body, color=PALETTE['orange'])


def client_action_plan_card(client: 'Client', goal: 'Goal', alloc: dict,
                              catalog: dict, real_class: str,
                              suggestions: list,
                              current_alloc: Optional[dict] = None) -> str:
    """Plano de ação concreto."""
    rebal = rebalance_rules(real_class)
    splits = smart_contribution_split(alloc, current_alloc or {},
                                       client.monthly, catalog)

    # Tabela de aporte por classe
    cls_label = {
        'selic':     'Selic / Liquidez',
        'prefixado': 'Prefixado',
        'ipca':      'IPCA+',
        'equity':    'Ações',
    }
    splits_html = ''
    for cls, val, gap in splits:
        gap_html = (f'<span style="color:{PALETTE["yellow"]};font-size:10px;margin-left:8px">'
                    f'(gap +{gap*100:.0f} p.p.)</span>' if gap > 0 else '')
        splits_html += f"""
        <div style="display:grid;grid-template-columns:1fr auto;align-items:center;
                    padding:6px 12px;background:{PALETTE['bg_card2']};margin:4px 0;border-radius:4px">
          <div style="color:{PALETTE['text_lt']};font-size:12px">
            {cls_label.get(cls, cls)} {gap_html}
          </div>
          <div style="color:{PALETTE['text']};font-size:12px;font-weight:600;font-variant-numeric:tabular-nums">
            {fmt(val)}/mês
          </div>
        </div>"""

    sugg_html = ''
    if suggestions:
        sugg_html = f'<div style="margin-top:14px;color:{PALETTE["text_dim"]};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700">Sugestões</div>'
        for s in suggestions:
            sugg_html += f"""
            <div style="margin:6px 0;padding:8px 12px;background:{PALETTE['bg_card2']};
                        border-left:3px solid {PALETTE['green']};border-radius:4px">
              <div style="color:{PALETTE['text']};font-size:12px;font-weight:600">{s['title']}</div>
              <div style="color:{PALETTE['text_dim']};font-size:11px;line-height:1.5;margin-top:2px">{s['msg']}</div>
            </div>"""

    body = f"""
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:14px">
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Investimento inicial</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px">{fmt(client.savings)}</div>
        <div style="color:{PALETTE['text_lt']};font-size:11px;margin-top:4px">Distribuir conforme tabela acima.</div>
      </div>
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Aporte mensal</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px">{fmt(client.monthly)}/mês</div>
        <div style="color:{PALETTE['text_lt']};font-size:11px;margin-top:4px">Dividir conforme split inteligente abaixo.</div>
      </div>
    </div>

    <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:6px">
      Como dividir o próximo aporte ({fmt(client.monthly)})
    </div>
    {splits_html}

    <div style="margin-top:14px;padding:10px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
      <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Rebalanceamento</div>
      <div style="color:{PALETTE['text_lt']};font-size:12px;line-height:1.55;margin-top:4px">
        {rebal['rule']}<br>
        <b style="color:{PALETTE['text']}">Frequência:</b> {rebal['frequency']} ·
        <b style="color:{PALETTE['text']}">Revisão completa:</b> {rebal['review_period']}
      </div>
    </div>

    {sugg_html}
    """
    return _card('Plano de Ação', body, color=PALETTE['blue'])


def client_compare_card(comp: dict, target: float) -> Optional[str]:
    """Comparação carteira atual vs recomendada (apenas se houver atual)."""
    if not comp.get('has_current'):
        return None

    cur_r, rec_r = comp['current_risk'], comp['recommended_risk']
    cur_s, rec_s = comp['current_sim'], comp['recommended_sim']

    def cell(v_cur, v_rec, fmt_fn, better='higher'):
        delta = v_rec - v_cur
        good = (delta > 0) if better == 'higher' else (delta < 0)
        c = PALETTE['green'] if good else PALETTE['red']
        sign = '+' if delta > 0 else ''
        return (f'<td style="color:{PALETTE["text_lt"]};text-align:right;padding:6px 10px;font-variant-numeric:tabular-nums">{fmt_fn(v_cur)}</td>'
                f'<td style="color:{PALETTE["text"]};text-align:right;padding:6px 10px;font-variant-numeric:tabular-nums;font-weight:600">{fmt_fn(v_rec)}</td>'
                f'<td style="color:{c};text-align:right;padding:6px 10px;font-variant-numeric:tabular-nums;font-size:11px">{sign}{fmt_fn(delta)}</td>')

    rows = f"""
    <tr style="border-bottom:1px solid {PALETTE['border']}55">
      <td style="color:{PALETTE['text_dim']};padding:6px 10px;font-size:11px">Retorno esperado</td>
      {cell(cur_r['mu'], rec_r['mu'], pct, 'higher')}
    </tr>
    <tr style="border-bottom:1px solid {PALETTE['border']}55">
      <td style="color:{PALETTE['text_dim']};padding:6px 10px;font-size:11px">Volatilidade</td>
      {cell(cur_r['sigma'], rec_r['sigma'], pct, 'lower')}
    </tr>
    <tr style="border-bottom:1px solid {PALETTE['border']}55">
      <td style="color:{PALETTE['text_dim']};padding:6px 10px;font-size:11px">Sharpe</td>
      {cell(cur_r['sharpe'], rec_r['sharpe'], lambda v: f'{v:.2f}', 'higher')}
    </tr>
    """
    if target and target > 0:
        rows += f"""
    <tr>
      <td style="color:{PALETTE['text_dim']};padding:6px 10px;font-size:11px">Probabilidade meta</td>
      {cell(cur_s['prob_meta'], rec_s['prob_meta'], pct, 'higher')}
    </tr>"""

    body = f"""
    <table style="width:100%;border-collapse:collapse;font-family:monospace;margin-top:6px">
      <thead><tr style="border-bottom:2px solid {PALETTE['border']}">
        <th style="text-align:left;padding:8px 10px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px"></th>
        <th style="text-align:right;padding:8px 10px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">ATUAL</th>
        <th style="text-align:right;padding:8px 10px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">RECOMENDADA</th>
        <th style="text-align:right;padding:8px 10px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">DELTA</th>
      </tr></thead>
      <tbody>{rows}</tbody>
    </table>
    """
    return _card('Comparação: Carteira Atual vs Recomendada', body, color=PALETTE['blue'])


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 16 — VISUALIZAÇÃO (matplotlib): cliente vs gestor
# ═══════════════════════════════════════════════════════════════════════════

import matplotlib.pyplot as plt
from matplotlib.patches import Wedge, Rectangle
from matplotlib.gridspec import GridSpec

# Estilo institucional
plt.rcParams.update({
    'figure.facecolor':  PALETTE['bg'],
    'axes.facecolor':    PALETTE['bg_card'],
    'axes.edgecolor':    PALETTE['border'],
    'axes.labelcolor':   PALETTE['text_lt'],
    'axes.titlecolor':   PALETTE['text'],
    'xtick.color':       PALETTE['text_dim'],
    'ytick.color':       PALETTE['text_dim'],
    'text.color':        PALETTE['text'],
    'grid.color':        PALETTE['border'],
    'grid.alpha':        0.4,
    'font.family':       'monospace',
    'font.size':         9,
})

CLASS_LABEL_PT = {
    'selic':     'Selic / Liquidez',
    'prefixado': 'Prefixado',
    'ipca':      'IPCA+',
    'equity':    'Ações',
}
CLASS_COLOR = {
    'selic':     '#1B4332',
    'prefixado': '#2A9D8F',
    'ipca':      '#52B788',
    'equity':    '#D4A017',
}


def plot_client_dashboard(client: 'Client', goal: 'Goal',
                           alloc: dict, sim: dict, catalog: dict,
                           score: dict) -> None:
    """4 painéis para o cliente: donut, retornos por ativo, projeção, distribuição."""
    fig = plt.figure(figsize=(15, 10))
    gs = GridSpec(2, 2, hspace=0.35, wspace=0.30, figure=fig,
                   left=0.06, right=0.97, top=0.93, bottom=0.07)

    # --- Painel 1: DONUT por classe ---
    ax1 = fig.add_subplot(gs[0, 0])
    by_class = {}
    for aid, w in alloc.items():
        cls = catalog[aid].cat
        by_class[cls] = by_class.get(cls, 0) + w
    classes = sorted(by_class.keys(), key=lambda c: -by_class[c])
    sizes = [by_class[c] for c in classes]
    colors = [CLASS_COLOR.get(c, '#777') for c in classes]
    labels = [f'{CLASS_LABEL_PT.get(c, c)}\n{by_class[c]*100:.1f}%' for c in classes]
    wedges, _ = ax1.pie(sizes, colors=colors, startangle=90,
                         wedgeprops=dict(width=0.35, edgecolor=PALETTE['bg']))
    ax1.legend(wedges, labels, loc='center', frameon=False,
                labelcolor=PALETTE['text_lt'], fontsize=10)
    ax1.set_title('Alocação por Classe', fontsize=12, color=PALETTE['text'],
                   pad=15, fontweight='bold')

    # --- Painel 2: BARRAS retorno × risco por ativo ---
    ax2 = fig.add_subplot(gs[0, 1])
    ativos = sorted(alloc.items(), key=lambda x: -x[1])[:8]
    nomes = [catalog[aid].label[:22] for aid, _ in ativos]
    pesos = [w * 100 for _, w in ativos]
    cores = [CLASS_COLOR.get(catalog[aid].cat, '#777') for aid, _ in ativos]
    y = np.arange(len(nomes))
    ax2.barh(y, pesos, color=cores, edgecolor=PALETTE['bg'], height=0.7)
    for i, (aid, w) in enumerate(ativos):
        a = catalog[aid]
        ax2.text(w * 100 + 0.5, i,
                  f' {a.ret_l*100:.1f}% a.a. · vol {a.vol*100:.1f}%',
                  va='center', fontsize=8, color=PALETTE['text_dim'])
    ax2.set_yticks(y)
    ax2.set_yticklabels(nomes, fontsize=9, color=PALETTE['text_lt'])
    ax2.invert_yaxis()
    ax2.set_xlabel('Peso (%)', color=PALETTE['text_dim'])
    ax2.set_title('Alocação por Ativo (com retorno e risco)', fontsize=12,
                   color=PALETTE['text'], pad=15, fontweight='bold')
    ax2.grid(True, axis='x', alpha=0.3)
    ax2.set_axisbelow(True)
    for s in ('top', 'right'):
        ax2.spines[s].set_visible(False)

    # --- Painel 3: Projeção patrimonial 3 cenários ---
    ax3 = fig.add_subplot(gs[1, 0])
    pcts = sim['pcts']
    months = np.arange(sim['months'] + 1)
    years_x = months / 12
    ax3.fill_between(years_x, pcts['p10'], pcts['p90'],
                      alpha=0.15, color=PALETTE['green'], label='Faixa P10–P90')
    ax3.fill_between(years_x, pcts['p25'], pcts['p75'],
                      alpha=0.25, color=PALETTE['green'], label='Faixa P25–P75')
    ax3.plot(years_x, pcts['p50'], color=PALETTE['green'], lw=2.5, label='Cenário base (P50)')
    ax3.plot(years_x, pcts['p10'], color=PALETTE['red'], lw=1.2, ls='--',
              label='Pessimista (P10)', alpha=0.85)
    ax3.plot(years_x, pcts['p90'], color=PALETTE['gold'], lw=1.2, ls='--',
              label='Otimista (P90)', alpha=0.85)
    if sim.get('target'):
        ax3.axhline(sim['target'], color='#fff', ls=':', lw=1.5,
                     alpha=0.6, label=f'Meta: {fmt(sim["target"])}')
    ax3.set_xlabel('Anos', color=PALETTE['text_dim'])
    ax3.set_ylabel('Patrimônio (R$)', color=PALETTE['text_dim'])
    ax3.set_title('Projeção Patrimonial (3 cenários)', fontsize=12,
                   color=PALETTE['text'], pad=15, fontweight='bold')
    ax3.legend(loc='upper left', fontsize=8, frameon=False,
                labelcolor=PALETTE['text_lt'])
    ax3.grid(True, alpha=0.3)
    ax3.set_axisbelow(True)
    ax3.yaxis.set_major_formatter(plt.FuncFormatter(
        lambda v, _: f'R$ {v/1000:.0f}k' if v < 1e6 else f'R$ {v/1e6:.1f}M'))
    for s in ('top', 'right'):
        ax3.spines[s].set_visible(False)

    # --- Painel 4: Distribuição de valor final ---
    ax4 = fig.add_subplot(gs[1, 1])
    final = sim['final']
    ax4.hist(final, bins=60, color=PALETTE['green'],
              edgecolor=PALETTE['bg'], alpha=0.8)
    ax4.axvline(np.median(final), color='#fff', lw=2, label=f'Mediana: {fmt(np.median(final))}')
    if sim.get('target'):
        ax4.axvline(sim['target'], color=PALETTE['gold'], lw=2, ls='--',
                     label=f'Meta: {fmt(sim["target"])}')
    ax4.set_xlabel('Patrimônio final (R$)', color=PALETTE['text_dim'])
    ax4.set_ylabel('Frequência', color=PALETTE['text_dim'])
    ax4.set_title('Distribuição de Cenários', fontsize=12, color=PALETTE['text'],
                   pad=15, fontweight='bold')
    ax4.legend(loc='upper right', fontsize=9, frameon=False,
                labelcolor=PALETTE['text_lt'])
    ax4.grid(True, alpha=0.3)
    ax4.set_axisbelow(True)
    ax4.xaxis.set_major_formatter(plt.FuncFormatter(
        lambda v, _: f'{v/1000:.0f}k' if v < 1e6 else f'{v/1e6:.1f}M'))
    for s in ('top', 'right'):
        ax4.spines[s].set_visible(False)

    score_str = f'Score: {score["score"]:.0f}/100 · {score["rating"]}'
    fig.suptitle(f'{client.name} · {goal.name} · {goal.years:.0f} anos · {score_str}',
                  fontsize=13, color=PALETTE['text'], fontweight='bold', y=0.985)
    plt.show()


def plot_manager_dashboard(client: 'Client', goal: 'Goal',
                            result: dict, sim: dict, catalog: dict,
                            view: 'MarketAssumptions',
                            risk: dict, sens: Optional[dict] = None) -> None:
    """6 painéis técnicos para o gestor: contribuição risco, MC, drawdown, cenários, sensibilidade, delta algo→gestor."""
    fig = plt.figure(figsize=(17, 11))
    gs = GridSpec(2, 3, hspace=0.42, wspace=0.32, figure=fig,
                   left=0.05, right=0.97, top=0.92, bottom=0.07)

    # --- Painel 1: contribuição de risco por classe ---
    ax1 = fig.add_subplot(gs[0, 0])
    cr = risk.get('class_risk', {})
    if cr:
        labels_cr = list(cr.keys())
        vals_cr = [cr[k] * 100 for k in labels_cr]
        cores_cr = [CLASS_COLOR.get(k.lower().split()[0], '#777') for k in labels_cr]
        ax1.barh(labels_cr, vals_cr, color=cores_cr, edgecolor=PALETTE['bg'])
        for i, v in enumerate(vals_cr):
            ax1.text(v + 0.5, i, f'{v:.1f}%', va='center',
                      fontsize=9, color=PALETTE['text_lt'])
    ax1.set_title('Contribuição de risco por classe',
                   fontsize=11, color=PALETTE['text'], fontweight='bold', pad=10)
    ax1.set_xlabel('% do risco total', color=PALETTE['text_dim'])
    ax1.grid(True, axis='x', alpha=0.3)
    for s in ('top', 'right'): ax1.spines[s].set_visible(False)

    # --- Painel 2: MC trajetórias com fan chart ---
    ax2 = fig.add_subplot(gs[0, 1])
    pcts = sim['pcts']; months = np.arange(sim['months'] + 1); yrs = months / 12
    for p_lo, p_hi, alpha in [(10, 90, 0.15), (25, 75, 0.30)]:
        ax2.fill_between(yrs, pcts[f'p{p_lo}'], pcts[f'p{p_hi}'],
                          color=PALETTE['green'], alpha=alpha)
    ax2.plot(yrs, pcts['p50'], color=PALETTE['green'], lw=2)
    if sim.get('target'):
        ax2.axhline(sim['target'], color='#fff', ls=':', lw=1.2, alpha=0.6)
    ax2.set_title('Trajetória Monte Carlo (fan chart)',
                   fontsize=11, color=PALETTE['text'], fontweight='bold', pad=10)
    ax2.set_xlabel('Anos', color=PALETTE['text_dim'])
    ax2.yaxis.set_major_formatter(plt.FuncFormatter(
        lambda v, _: f'{v/1e6:.1f}M' if v >= 1e6 else f'{v/1e3:.0f}k'))
    ax2.grid(True, alpha=0.3)
    for s in ('top', 'right'): ax2.spines[s].set_visible(False)

    # --- Painel 3: Distribuição final ---
    ax3 = fig.add_subplot(gs[0, 2])
    final = sim['final']
    ax3.hist(final, bins=70, color=PALETTE['green'],
              edgecolor=PALETTE['bg'], alpha=0.85)
    ax3.axvline(np.median(final), color='#fff', lw=2, label=f'Med {fmt(np.median(final))}')
    ax3.axvline(sim['p10'], color=PALETTE['red'], lw=1.4, ls='--', label=f'P10 {fmt(sim["p10"])}')
    ax3.axvline(sim['p90'], color=PALETTE['gold'], lw=1.4, ls='--', label=f'P90 {fmt(sim["p90"])}')
    if sim.get('target'):
        ax3.axvline(sim['target'], color='#fff', lw=1.6, label=f'Meta')
    ax3.set_title('Distribuição final', fontsize=11, color=PALETTE['text'],
                   fontweight='bold', pad=10)
    ax3.legend(loc='upper right', fontsize=8, frameon=False, labelcolor=PALETTE['text_lt'])
    ax3.grid(True, alpha=0.3)
    ax3.xaxis.set_major_formatter(plt.FuncFormatter(
        lambda v, _: f'{v/1e6:.1f}M' if v >= 1e6 else f'{v/1e3:.0f}k'))
    for s in ('top', 'right'): ax3.spines[s].set_visible(False)

    # --- Painel 4: Resultado por cenário macro ---
    ax4 = fig.add_subplot(gs[1, 0])
    by_sc = sim.get('by_scenario', {})
    if by_sc:
        sc_keys = list(by_sc.keys())
        sc_meds = [by_sc[k]['median'] for k in sc_keys]
        sc_probs = [by_sc[k]['prob_meta'] or 0 for k in sc_keys]
        sc_colors = ['#40916C', '#74C69D', '#E63946', '#F4A261', '#E9C46A'][:len(sc_keys)]
        x = np.arange(len(sc_keys))
        bars = ax4.bar(x, sc_meds, color=sc_colors, edgecolor=PALETTE['bg'])
        ax4.set_xticks(x)
        ax4.set_xticklabels(sc_keys, fontsize=8, color=PALETTE['text_lt'])
        for i, (b, p) in enumerate(zip(bars, sc_probs)):
            ax4.text(b.get_x() + b.get_width()/2, b.get_height() * 1.02,
                      f'P(meta)={p*100:.0f}%', ha='center',
                      fontsize=8, color=PALETTE['text_lt'])
    ax4.set_title('Mediana por cenário macro', fontsize=11,
                   color=PALETTE['text'], fontweight='bold', pad=10)
    ax4.yaxis.set_major_formatter(plt.FuncFormatter(
        lambda v, _: f'{v/1e6:.1f}M' if v >= 1e6 else f'{v/1e3:.0f}k'))
    ax4.grid(True, axis='y', alpha=0.3)
    for s in ('top', 'right'): ax4.spines[s].set_visible(False)

    # --- Painel 5: Sensibilidade (heatmap aporte × retorno) ---
    ax5 = fig.add_subplot(gs[1, 1])
    if sens and 'aporte' in sens and 'retorno' in sens:
        ap_keys = sorted(sens['aporte'].keys())
        rt_keys = sorted(sens['retorno'].keys())
        # Constrói superfície (aproximação: prob_aporte * prob_retorno / prob_base)
        base = sens.get('base', 0.5) or 0.5
        Z = np.array([[(sens['aporte'][a] * sens['retorno'][r] / max(base, 0.01))
                        for r in rt_keys] for a in ap_keys])
        Z = np.clip(Z, 0, 1)
        im = ax5.imshow(Z, cmap='RdYlGn', vmin=0, vmax=1, aspect='auto')
        ax5.set_xticks(range(len(rt_keys)))
        ax5.set_xticklabels([f'{r*100:+.0f} bps' for r in rt_keys], fontsize=8)
        ax5.set_yticks(range(len(ap_keys)))
        ax5.set_yticklabels([f'{a*100:+.0f}%' for a in ap_keys], fontsize=8)
        ax5.set_xlabel('Δ retorno', color=PALETTE['text_dim'])
        ax5.set_ylabel('Δ aporte', color=PALETTE['text_dim'])
        for i in range(len(ap_keys)):
            for j in range(len(rt_keys)):
                ax5.text(j, i, f'{Z[i,j]*100:.0f}', ha='center', va='center',
                          fontsize=8, color='#000', fontweight='bold')
    ax5.set_title('Sensibilidade P(meta) — aporte × retorno',
                   fontsize=11, color=PALETTE['text'], fontweight='bold', pad=10)

    # --- Painel 6: Delta algo→gestor (overlay com tilts) ---
    ax6 = fig.add_subplot(gs[1, 2])
    algo_w = result['algo_alloc']; final_w = result['alloc']
    all_ids = sorted(set(algo_w) | set(final_w),
                      key=lambda i: -(final_w.get(i, 0)))[:8]
    nm = [catalog[i].label[:18] for i in all_ids]
    a_v = [algo_w.get(i, 0) * 100 for i in all_ids]
    f_v = [final_w.get(i, 0) * 100 for i in all_ids]
    y = np.arange(len(nm))
    h = 0.4
    ax6.barh(y - h/2, a_v, h, label='Algoritmo', color=PALETTE['green_lt'])
    ax6.barh(y + h/2, f_v, h, label='Após visão do gestor',
              color=PALETTE['gold'])
    ax6.set_yticks(y)
    ax6.set_yticklabels(nm, fontsize=8, color=PALETTE['text_lt'])
    ax6.invert_yaxis()
    ax6.legend(loc='lower right', fontsize=8, frameon=False, labelcolor=PALETTE['text_lt'])
    ax6.set_title('Algoritmo vs Visão do gestor',
                   fontsize=11, color=PALETTE['text'], fontweight='bold', pad=10)
    ax6.set_xlabel('Peso (%)', color=PALETTE['text_dim'])
    ax6.grid(True, axis='x', alpha=0.3)
    for s in ('top', 'right'): ax6.spines[s].set_visible(False)

    title = (f'GESTOR — {client.name} · {goal.name} · '
              f'μ={risk["mu"]*100:.2f}% · σ={risk["sigma"]*100:.2f}% · '
              f'Sharpe={risk["sharpe"]:.2f} · P(meta)={(sim.get("prob_meta") or 0)*100:.0f}%')
    fig.suptitle(title, fontsize=12, color=PALETTE['text'],
                  fontweight='bold', y=0.985)
    plt.show()


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 16b — CARDS DA RESERVA DE EMERGÊNCIA (Camada Zero)
# ═══════════════════════════════════════════════════════════════════════════

# Cor por severidade da reserva
EF_COLOR = {
    'critical': PALETTE['red'],
    'high':     PALETTE['orange'],
    'medium':   PALETTE['yellow'],
    'ok':       PALETTE['green'],
}


def client_emergency_card(client: Client, ef: dict) -> str:
    """
    Card hero da reserva de emergência — aparece no TOPO do dashboard cliente
    quando a reserva NÃO está completa. É deliberadamente grande e dominante:
    a hierarquia visual reforça a hierarquia conceitual (camada zero antes de tudo).
    """
    progress = ef['progress']
    status = ef['status']
    color = EF_COLOR[ef['severity']]

    # Mensagem de header conforme status
    if status == 'incomplete':
        header_label = '⚠ ATENÇÃO PRIORITÁRIA'
        header_text  = 'Sua reserva de emergência ainda não está completa'
    elif status == 'partial':
        header_label = '○ EM CONSTRUÇÃO'
        header_text  = 'Continue construindo sua reserva de emergência'
    elif status == 'complete':
        header_label = '✓ RESERVA COMPLETA'
        header_text  = f'Você tem {ef["months_target"]} meses de despesas protegidos'
    else:
        header_label = '◉ EXCESSO DE CAIXA'
        header_text  = 'Sua reserva está acima do necessário'

    # Progress bar
    bar_width = min(progress * 100, 100)
    bar_html = f"""
    <div style="background:#0a0a0a;border-radius:8px;height:18px;overflow:hidden;
                position:relative;margin:14px 0">
      <div style="background:linear-gradient(90deg,{color},{color}cc);
                  height:100%;width:{bar_width:.1f}%;border-radius:8px;
                  transition:width 0.4s"></div>
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;
                  display:flex;align-items:center;justify-content:center;
                  color:#fff;font-size:11px;font-weight:700;font-family:monospace">
        {progress*100:.0f}% completo
      </div>
    </div>
    """

    # Métricas principais
    eta_str = ''
    if ef['months_to_complete'] is not None:
        eta_str = f"""
        <div style="padding:14px;background:{PALETTE['bg_card2']};border-radius:6px">
          <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Tempo p/ completar</div>
          <div style="color:{color};font-size:22px;font-weight:600;margin-top:4px">{ef['months_to_complete']:.0f} meses</div>
          <div style="color:{PALETTE['text_dim']};font-size:11px;margin-top:2px">com aporte atual de R$ {client.monthly:,.0f}/mês</div>
        </div>"""

    metrics = f"""
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px">
      <div style="padding:14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Você tem hoje</div>
        <div style="color:{PALETTE['text']};font-size:22px;font-weight:600;margin-top:4px">{fmt(ef['balance'])}</div>
      </div>
      <div style="padding:14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Necessário ({ef['months_target']}m)</div>
        <div style="color:{PALETTE['text']};font-size:22px;font-weight:600;margin-top:4px">{fmt(ef['target'])}</div>
      </div>
      {eta_str if eta_str else f'''
      <div style="padding:14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase">Status</div>
        <div style="color:{color};font-size:22px;font-weight:600;margin-top:4px">{status.upper()}</div>
      </div>'''}
    </div>
    """

    # Ações
    actions = emergency_action_plan(client, ef)
    actions_html = ''
    for a in actions:
        actions_html += f"""
        <div style="display:grid;grid-template-columns:30px 1fr;gap:14px;align-items:start;
                    margin:12px 0;padding:12px 14px;background:{PALETTE['bg_card2']};
                    border-left:3px solid {color};border-radius:6px">
          <div style="font-size:18px">{a['icon']}</div>
          <div>
            <div style="color:{PALETTE['text']};font-size:13px;font-weight:600">{a['title']}</div>
            <div style="color:{PALETTE['text_lt']};font-size:12px;line-height:1.5;margin-top:3px">{a['detail']}</div>
          </div>
        </div>
        """

    # Mensagem principal
    msg_html = f"""
    <div style="margin:16px 0;padding:14px 16px;background:{color}15;
                border-left:3px solid {color};border-radius:4px">
      <div style="color:{PALETTE['text_lt']};font-size:13px;line-height:1.6">{ef['message']}</div>
    </div>
    """

    # Card grande (estilo hero)
    border_color = color if status in ('incomplete', 'partial') else PALETTE['border']
    border_width = '2px' if status in ('incomplete', 'partial') else '1px'

    return f"""
    <div style="background:{PALETTE['bg_card']};border:{border_width} solid {border_color};
                border-radius:10px;padding:22px 26px;margin:14px 0;
                font-family:-apple-system,BlinkMacSystemFont,sans-serif">
      <div style="color:{color};font-size:10px;letter-spacing:2.5px;
                  text-transform:uppercase;font-weight:700;margin-bottom:6px">
        ● CAMADA ZERO · {header_label}
      </div>
      <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;line-height:1.4">
        {header_text}
      </div>
      {bar_html}
      {msg_html}
      {metrics}
      <div style="margin-top:14px;color:{PALETTE['text_dim']};font-size:10px;
                  letter-spacing:1.5px;text-transform:uppercase;font-weight:700">
        Plano de Ação
      </div>
      {actions_html}
    </div>
    """


def client_emergency_compact(ef: dict) -> str:
    """Versão compacta da reserva — quando completa, mostra como linha discreta."""
    color = EF_COLOR[ef['severity']]
    return f"""
    <div style="background:{PALETTE['bg_card']};border:1px solid {PALETTE['border']};
                border-radius:8px;padding:10px 16px;margin:8px 0;
                display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;
                font-family:-apple-system,BlinkMacSystemFont,sans-serif">
      <div style="color:{color};font-size:13px">✓</div>
      <div style="color:{PALETTE['text_lt']};font-size:12px">
        Reserva de emergência: <b style="color:{PALETTE['text']}">{ef['months_target']} meses cobertos</b> · {fmt(ef['balance'])}
      </div>
      <div style="color:{color};font-size:11px;font-weight:600">{ef['progress']*100:.0f}%</div>
    </div>
    """


def manager_emergency_card(client: Client, ef: dict) -> str:
    """Versão técnica da reserva no dashboard do gestor."""
    color = EF_COLOR[ef['severity']]
    blocks = (
        ('Status',          ef['status'].upper(),                           color),
        ('Progresso',       f"{ef['progress']*100:.1f}%",                    PALETTE['text']),
        ('Saldo atual',     fmt(ef['balance']),                              PALETTE['text']),
        ('Target',          fmt(ef['target']),                               PALETTE['text']),
        ('Déficit',         fmt(ef['deficit']) if ef['deficit'] > 0 else '—', PALETTE['orange'] if ef['deficit'] > 0 else PALETTE['text_dim']),
        ('Meses cobertos',  f"{ef['months_target']}",                        PALETTE['text']),
        ('ETA conclusão',   f"{ef['months_to_complete']:.0f} meses" if ef['months_to_complete'] else '—',
                            PALETTE['text_lt']),
        ('Split aporte',    f"R$ {ef['recommended_split']['to_emergency']:,.0f} reserva / R$ {ef['recommended_split']['to_goals']:,.0f} metas",
                            PALETTE['text_lt']),
    )
    cells = ''
    for label, value, c in blocks:
        cells += f"""
        <div style="padding:10px 12px;background:{PALETTE['bg_card2']};border-radius:6px">
          <div style="color:{PALETTE['text_dim']};font-size:9px;letter-spacing:1.5px;text-transform:uppercase">{label}</div>
          <div style="color:{c};font-size:13px;font-weight:600;margin-top:3px;font-variant-numeric:tabular-nums">{value}</div>
        </div>"""

    body = f"""
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
      {cells}
    </div>
    <div style="margin-top:12px;padding:10px 14px;background:{color}15;
                border-left:3px solid {color};border-radius:4px;
                color:{PALETTE['text_lt']};font-size:12px;line-height:1.5">
      {ef['message']}
    </div>
    """
    return _card('Reserva de Emergência (Camada 0)', body, badge='INTERNO',
                  color=PALETTE['orange'])


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 16c — CARDS DA JORNADA (TRACKING AO LONGO DO TEMPO)
# ═══════════════════════════════════════════════════════════════════════════

def client_journey_card(history: list, summary: dict) -> Optional[str]:
    """
    Card 'Sua Jornada' — só aparece quando há 2+ snapshots.
    Mostra evolução do score com delta, patrimônio, marcos.
    """
    if not summary or summary.get('count', 0) < 2:
        return None

    delta = summary['score_delta']
    trend = summary['score_trend']

    # Cor e ícone do delta
    if   trend == 'up':   d_color, d_icon = PALETTE['green'],  '↑'
    elif trend == 'down': d_color, d_icon = PALETTE['red'],    '↓'
    else:                 d_color, d_icon = PALETTE['text_dim'], '→'

    # Mini-bars do score (sparkline manual em HTML)
    scores = [s['score'] or 0 for s in history if s['score'] is not None]
    if not scores:
        return None
    max_s, min_s = max(scores), min(scores)
    rng = max(max_s - min_s, 10)
    bars_html = ''
    for i, s in enumerate(scores):
        h = ((s - min_s) / rng) * 100 + 10
        c = PALETTE['green'] if i == len(scores) - 1 else PALETTE['green'] + 'aa'
        bars_html += f'<div style="display:inline-block;width:14px;margin-right:3px;height:{h:.0f}px;background:{c};border-radius:2px 2px 0 0;vertical-align:bottom"></div>'

    # Marcos
    milestones_html = ''
    for m in summary.get('milestones', [])[-5:]:
        ic = {'emergency': '🛡', 'risk': '⚖', 'macro': '📊'}.get(m['kind'], '●')
        milestones_html += f"""
        <div style="display:grid;grid-template-columns:24px 90px 1fr;gap:10px;
                    padding:6px 0;border-bottom:1px solid {PALETTE['border']}33;
                    font-size:11px">
          <div>{ic}</div>
          <div style="color:{PALETTE['text_dim']};font-variant-numeric:tabular-nums">{m['date']}</div>
          <div style="color:{PALETTE['text_lt']}">{m['label']}</div>
        </div>"""

    if not milestones_html:
        milestones_html = f'<div style="color:{PALETTE["text_dim"]};font-size:11px;font-style:italic">Sem mudanças significativas no período.</div>'

    # Patrimônio
    pat_first = summary['patrimony_first']
    pat_last = summary['patrimony_last']
    pat_delta = summary['patrimony_delta']
    pat_pct = (pat_delta / pat_first * 100) if pat_first > 0 else 0
    pat_color = PALETTE['green'] if pat_delta >= 0 else PALETTE['red']

    body = f"""
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">

      <!-- Score Evolution -->
      <div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px">EVOLUÇÃO DO SCORE</div>
        <div style="display:flex;align-items:flex-end;gap:14px">
          <div>
            <div style="color:{PALETTE['text']};font-size:36px;font-weight:700;line-height:1">{summary['last_score']:.0f}</div>
            <div style="color:{d_color};font-size:13px;font-weight:600;margin-top:4px">{d_icon} {abs(delta):.1f} pontos</div>
            <div style="color:{PALETTE['text_dim']};font-size:10px;margin-top:2px">vs. {summary['first_score']:.0f} em {summary['first_date']}</div>
          </div>
          <div style="display:flex;align-items:flex-end;height:110px;flex:1">
            {bars_html}
          </div>
        </div>
      </div>

      <!-- Patrimony -->
      <div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px">PATRIMÔNIO</div>
        <div style="color:{PALETTE['text']};font-size:36px;font-weight:700;line-height:1">{fmt(pat_last)}</div>
        <div style="color:{pat_color};font-size:13px;font-weight:600;margin-top:4px">
          {('+' if pat_delta >= 0 else '')}{fmt(pat_delta)} ({('+' if pat_pct >= 0 else '')}{pat_pct:.1f}%)
        </div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;margin-top:2px">no período de {summary['count']} snapshots</div>
      </div>

    </div>

    <div style="margin-top:22px">
      <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px">MARCOS RECENTES</div>
      {milestones_html}
    </div>
    """
    return _card('Sua Jornada', body, badge=f'{summary["count"]} snapshots',
                  color=PALETTE['blue'])


def plot_score_evolution(history: list) -> None:
    """Gráfico de linha da evolução do score ao longo do tempo."""
    if len(history) < 2:
        return

    dates = [datetime.fromisoformat(h['timestamp']) for h in history]
    scores = [h['score'] or 0 for h in history]

    fig, ax = plt.subplots(figsize=(13, 5))
    ax.plot(dates, scores, marker='o', color=PALETTE['green'], lw=2.5,
             markersize=10, markerfacecolor=PALETTE['green_lt'],
             markeredgecolor=PALETTE['bg'], markeredgewidth=2)
    ax.fill_between(dates, scores, alpha=0.15, color=PALETTE['green'])

    # Bandas de rating
    ax.axhspan(80, 100, alpha=0.05, color=PALETTE['green'])
    ax.axhspan(65, 80,  alpha=0.05, color=PALETTE['green_lt'])
    ax.axhspan(50, 65,  alpha=0.05, color=PALETTE['yellow'])
    ax.axhspan(35, 50,  alpha=0.05, color=PALETTE['orange'])
    ax.axhspan(0,  35,  alpha=0.05, color=PALETTE['red'])

    ax.set_ylabel('Score do Plano', color=PALETTE['text_dim'], fontsize=11)
    ax.set_ylim(max(min(scores) - 10, 0), min(max(scores) + 10, 100))
    ax.set_title('Evolução do Score', fontsize=13, color=PALETTE['text'],
                 fontweight='bold', pad=14)
    ax.grid(True, alpha=0.3)
    for s in ('top', 'right'):
        ax.spines[s].set_visible(False)

    # Anota último ponto
    last_d, last_s = dates[-1], scores[-1]
    ax.annotate(f'{last_s:.0f}', (last_d, last_s),
                  textcoords='offset points', xytext=(12, 0),
                  fontsize=14, color=PALETTE['text'], fontweight='bold')

    plt.tight_layout()
    plt.show()


def plot_patrimony_evolution(history: list) -> None:
    """Gráfico do patrimônio ao longo do tempo (snapshots)."""
    if len(history) < 2:
        return

    dates = [datetime.fromisoformat(h['timestamp']) for h in history]
    patr = [h['patrimony'] or 0 for h in history]

    fig, ax = plt.subplots(figsize=(13, 5))
    ax.plot(dates, patr, marker='o', color=PALETTE['gold'], lw=2.5,
             markersize=8, markerfacecolor=PALETTE['gold'],
             markeredgecolor=PALETTE['bg'], markeredgewidth=2)
    ax.fill_between(dates, patr, alpha=0.15, color=PALETTE['gold'])
    ax.set_ylabel('Patrimônio', color=PALETTE['text_dim'], fontsize=11)
    ax.set_title('Evolução do Patrimônio', fontsize=13,
                  color=PALETTE['text'], fontweight='bold', pad=14)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(
        lambda v, _: f'R$ {v/1e6:.1f}M' if v >= 1e6 else f'R$ {v/1e3:.0f}k'))
    ax.grid(True, alpha=0.3)
    for s in ('top', 'right'):
        ax.spines[s].set_visible(False)
    plt.tight_layout()
    plt.show()


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 17 — DASHBOARD DO GESTOR  (HTML técnico, com premissas internas)
# ═══════════════════════════════════════════════════════════════════════════

def manager_assumptions_card(view: 'MarketAssumptions') -> str:
    """Mostra todas as premissas internas — APENAS p/ gestor."""
    curve_html = ''
    for y, r in sorted(view.real_curve.items()):
        curve_html += f'<tr><td style="padding:3px 10px;color:{PALETTE["text_lt"]}">{y}a</td>' \
                       f'<td style="padding:3px 10px;color:{PALETTE["green_lt"]};text-align:right;font-variant-numeric:tabular-nums">{r*100:.2f}%</td></tr>'

    tilts_html = ''
    for cat, tilt in view.macro_tilts.items():
        c = PALETTE['green'] if tilt > 0 else (PALETTE['red'] if tilt < 0 else PALETTE['text_dim'])
        sign = '+' if tilt > 0 else ''
        tilts_html += f'<tr><td style="padding:3px 10px;color:{PALETTE["text_lt"]}">{cat}</td>' \
                       f'<td style="padding:3px 10px;color:{c};text-align:right;font-variant-numeric:tabular-nums">{sign}{tilt*100:.0f}%</td></tr>'

    body = f"""
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
      <div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;margin-bottom:6px">VARIÁVEIS MACRO</div>
        <table style="width:100%;font-size:11px;border-collapse:collapse">
          <tr><td style="color:{PALETTE['text_lt']};padding:3px 0">IPCA esperado</td>
              <td style="color:{PALETTE['text']};text-align:right;font-variant-numeric:tabular-nums">{view.ipca_esperado*100:.2f}%</td></tr>
          <tr><td style="color:{PALETTE['text_lt']};padding:3px 0">Selic esperada</td>
              <td style="color:{PALETTE['text']};text-align:right;font-variant-numeric:tabular-nums">{view.selic_esperada*100:.2f}%</td></tr>
          <tr><td style="color:{PALETTE['text_lt']};padding:3px 0">Convicção</td>
              <td style="color:{PALETTE['text']};text-align:right;font-variant-numeric:tabular-nums">{view.conviction*100:.0f}%</td></tr>
          <tr><td style="color:{PALETTE['text_lt']};padding:3px 0">Equity DY</td>
              <td style="color:{PALETTE['text']};text-align:right;font-variant-numeric:tabular-nums">{view.eq_dividend_yield*100:.1f}%</td></tr>
          <tr><td style="color:{PALETTE['text_lt']};padding:3px 0">Cresc. real ações</td>
              <td style="color:{PALETTE['text']};text-align:right;font-variant-numeric:tabular-nums">{view.eq_real_growth*100:.1f}%</td></tr>
        </table>
      </div>
      <div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;margin-bottom:6px">CURVA REAL (NTN-B)</div>
        <table style="width:100%;font-size:11px;border-collapse:collapse">{curve_html}</table>
      </div>
      <div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;margin-bottom:6px">TILTS MACRO</div>
        <table style="width:100%;font-size:11px;border-collapse:collapse">{tilts_html}</table>
      </div>
    </div>
    """
    return _card('Premissas Internas da Casa', body, badge='INTERNO',
                  color=PALETTE['orange'])


def manager_correlation_card(catalog: dict) -> str:
    """Matriz de correlação por classe — interno."""
    n = len(CORR_CLASSES)
    rows = ''
    for i, ci in enumerate(CORR_CLASSES):
        cells = ''
        for j, cj in enumerate(CORR_CLASSES):
            v = CORR_MATRIX_CLASSES[i, j]
            c = PALETTE['green'] if v > 0.5 else (PALETTE['orange'] if v > 0 else PALETTE['red'])
            if i == j: c = PALETTE['text']
            cells += (f'<td style="padding:6px 10px;color:{c};text-align:right;'
                      f'font-variant-numeric:tabular-nums;font-size:11px">{v:+.2f}</td>')
        rows += f'<tr><td style="padding:6px 10px;color:{PALETTE["text_lt"]};font-size:11px;font-weight:600">{ci}</td>{cells}</tr>'
    header = ''.join(f'<th style="padding:6px 10px;color:{PALETTE["text_dim"]};text-align:right;font-size:10px">{c}</th>' for c in CORR_CLASSES)
    body = f"""
    <table style="width:100%;border-collapse:collapse;font-family:monospace">
      <thead><tr><th></th>{header}</tr></thead>
      <tbody>{rows}</tbody>
    </table>
    """
    return _card('Matriz de Correlação por Classe', body, badge='INTERNO',
                  color=PALETTE['orange'])


def manager_risk_metrics_card(risk: dict, sim: dict) -> str:
    """Métricas técnicas de risco — interno."""
    body = f"""
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">μ ESPERADO</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{risk['mu']*100:.2f}%</div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;margin-top:2px">a.a. líquido</div>
      </div>
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">σ COVARIÂNCIA</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{risk['sigma']*100:.2f}%</div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;margin-top:2px">σ ingênua: {risk['sigma_naive']*100:.2f}%</div>
      </div>
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">SHARPE</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{risk['sharpe']:.3f}</div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;margin-top:2px">rf=Selic</div>
      </div>
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">VaR 95% / 99%</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{risk['var_95']*100:.1f}% / {risk['var_99']*100:.1f}%</div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;margin-top:2px">paramétrico anual</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:12px">
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">P(META)</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{(sim.get('prob_meta') or 0)*100:.1f}%</div>
      </div>
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">P(PERDA REAL)</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{sim.get('prob_perda_real',0)*100:.1f}%</div>
      </div>
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">DD MÉDIO MAX</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{sim.get('max_dd_mean',0)*100:.1f}%</div>
      </div>
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">DD PIOR 5%</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{sim.get('max_dd_p95',0)*100:.1f}%</div>
      </div>
    </div>
    """
    return _card('Métricas de Risco', body, badge='INTERNO', color=PALETTE['orange'])


def manager_scenarios_card(sim: dict) -> str:
    """Resultado por cenário macro."""
    by_sc = sim.get('by_scenario', {})
    if not by_sc:
        return ''
    rows = ''
    for k, v in by_sc.items():
        sc_meta = SCENARIOS.get(k, {})
        rows += f"""
        <tr style="border-bottom:1px solid {PALETTE['border']}55">
          <td style="padding:6px 12px;color:{PALETTE['text']};font-size:12px;font-weight:600">{k}</td>
          <td style="padding:6px 12px;color:{PALETTE['text_dim']};font-size:11px">{sc_meta.get('descricao','—')}</td>
          <td style="padding:6px 12px;color:{PALETTE['text_lt']};text-align:right;font-size:11px;font-variant-numeric:tabular-nums">{sc_meta.get('prob',0)*100:.0f}%</td>
          <td style="padding:6px 12px;color:{PALETTE['text']};text-align:right;font-size:11px;font-variant-numeric:tabular-nums">{fmt(v['median'])}</td>
          <td style="padding:6px 12px;color:{PALETTE['text_lt']};text-align:right;font-size:11px;font-variant-numeric:tabular-nums">{fmt(v['p10'])}</td>
          <td style="padding:6px 12px;color:{PALETTE['text_lt']};text-align:right;font-size:11px;font-variant-numeric:tabular-nums">{fmt(v['p90'])}</td>
          <td style="padding:6px 12px;color:{PALETTE['green'] if (v['prob_meta'] or 0) >= 0.7 else PALETTE['orange']};text-align:right;font-size:11px;font-variant-numeric:tabular-nums">{(v['prob_meta'] or 0)*100:.0f}%</td>
        </tr>"""
    body = f"""
    <table style="width:100%;border-collapse:collapse;font-family:monospace">
      <thead><tr style="border-bottom:2px solid {PALETTE['border']}">
        <th style="text-align:left;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">CENÁRIO</th>
        <th style="text-align:left;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">DESCRIÇÃO</th>
        <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">PROB</th>
        <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">MEDIANA</th>
        <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">P10</th>
        <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">P90</th>
        <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">P(META)</th>
      </tr></thead>
      <tbody>{rows}</tbody>
    </table>
    """
    return _card('Cenários Macro', body, badge='INTERNO', color=PALETTE['orange'])


def manager_sensitivity_card(sens: dict, monthly_atual: float) -> str:
    """Tabela de sensibilidade dos 3 eixos."""
    if not sens:
        return ''

    def cell(p, base):
        if p is None: return '—'
        c = PALETTE['green'] if p >= base else PALETTE['red']
        return f'<span style="color:{c};font-variant-numeric:tabular-nums">{p*100:.0f}%</span>'

    base = sens.get('base', 0.5) or 0.5
    sections_html = ''

    for dim_label, dim_key, fmt_delta in [
        ('Aporte mensal',    'aporte',    lambda d: f'{d*100:+.0f}%'),
        ('Retorno esperado', 'retorno',   lambda d: f'{d*100:+.0f} bps'),
        ('Horizonte',        'horizonte', lambda d: f'{d:+d} ano'),
    ]:
        if dim_key not in sens: continue
        cells_html = ''
        for k in sorted(sens[dim_key].keys()):
            cells_html += f"""
            <td style="padding:8px 12px;text-align:center">
              <div style="color:{PALETTE['text_dim']};font-size:10px">{fmt_delta(k)}</div>
              <div style="font-size:13px;font-weight:600;margin-top:2px">{cell(sens[dim_key][k], base)}</div>
            </td>"""
        sections_html += f"""
        <div style="margin:14px 0">
          <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;margin-bottom:6px">{dim_label.upper()}</div>
          <table style="width:100%;border-collapse:collapse;background:{PALETTE['bg_card2']};border-radius:6px">
            <tr>{cells_html}</tr>
          </table>
        </div>"""

    return _card('Sensibilidade da P(meta)', sections_html, badge='INTERNO',
                  color=PALETTE['orange'])


def manager_alloc_breakdown_card(result: dict, catalog: dict) -> str:
    """Decomposição algoritmo → visão gestor → override."""
    algo = result['algo_alloc']; final = result['alloc']
    all_ids = sorted(set(algo) | set(final), key=lambda i: -final.get(i, 0))
    rows = ''
    for aid in all_ids:
        a = catalog[aid]
        a_w = algo.get(aid, 0)
        f_w = final.get(aid, 0)
        d = f_w - a_w
        c = PALETTE['green'] if d > 0 else (PALETTE['red'] if d < 0 else PALETTE['text_dim'])
        rows += f"""
        <tr style="border-bottom:1px solid {PALETTE['border']}55">
          <td style="padding:6px 12px;color:{PALETTE['text']};font-size:12px">{a.label}</td>
          <td style="padding:6px 12px;color:{PALETTE['text_dim']};font-size:11px">{a.cat}</td>
          <td style="padding:6px 12px;color:{PALETTE['text_lt']};text-align:right;font-size:11px;font-variant-numeric:tabular-nums">{a_w*100:.1f}%</td>
          <td style="padding:6px 12px;color:{PALETTE['text']};text-align:right;font-size:11px;font-variant-numeric:tabular-nums;font-weight:600">{f_w*100:.1f}%</td>
          <td style="padding:6px 12px;color:{c};text-align:right;font-size:11px;font-variant-numeric:tabular-nums">{d*100:+.1f} p.p.</td>
        </tr>"""
    body = f"""
    <table style="width:100%;border-collapse:collapse;font-family:monospace">
      <thead><tr style="border-bottom:2px solid {PALETTE['border']}">
        <th style="text-align:left;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">ATIVO</th>
        <th style="text-align:left;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">CLASSE</th>
        <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">ALGO</th>
        <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">FINAL</th>
        <th style="text-align:right;padding:8px 12px;color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">DELTA</th>
      </tr></thead>
      <tbody>{rows}</tbody>
    </table>
    """
    return _card('Decomposição: Algoritmo → Visão do Gestor', body, badge='INTERNO',
                  color=PALETTE['orange'])


def manager_enforce_card(result: dict, catalog: dict) -> str:
    """Card que mostra o efeito da CAMADA 3d (piso de 20% em ações)."""
    log = result.get('enforce_log', {})
    if not log:
        return ''

    eq_b   = log.get('equity_before', 0) * 100
    eq_a   = log.get('equity_after', 0) * 100
    min_eq = log.get('min_equity_applied', 0) * 100
    forced = log.get('forced', False)

    if not forced:
        body = f"""
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
          <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
            <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">REGRA</div>
            <div style="color:{PALETTE['text']};font-size:14px;font-weight:600;margin-top:4px">Mín. {min_eq:.0f}% em ações</div>
          </div>
          <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
            <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">EQUITY ATUAL</div>
            <div style="color:{PALETTE['text']};font-size:14px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{eq_a:.1f}%</div>
          </div>
          <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
            <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">STATUS</div>
            <div style="color:{PALETTE['green']};font-size:14px;font-weight:600;margin-top:4px">✓ Já cumpria — não houve ajuste</div>
          </div>
        </div>
        """
        return _card('Piso Estratégico de Ações (Camada 3d)', body, badge='INTERNO',
                      color=PALETTE['orange'])

    # Houve ajuste — mostra antes/depois e detalhes
    reduced = log.get('reduced_assets', {})
    increased = log.get('increased_assets', {})

    red_html = ''
    for aid, amt in sorted(reduced.items(), key=lambda x: -x[1]):
        if amt < 1e-4: continue
        red_html += f"""
        <tr><td style="padding:5px 12px;color:{PALETTE['text_lt']};font-size:11px">{catalog[aid].label}</td>
            <td style="padding:5px 12px;color:{PALETTE['red']};text-align:right;font-size:11px;font-variant-numeric:tabular-nums">−{amt*100:.2f} p.p.</td></tr>"""

    inc_html = ''
    for aid, amt in sorted(increased.items(), key=lambda x: -x[1]):
        if amt < 1e-4: continue
        inc_html += f"""
        <tr><td style="padding:5px 12px;color:{PALETTE['text_lt']};font-size:11px">{catalog[aid].label}</td>
            <td style="padding:5px 12px;color:{PALETTE['green']};text-align:right;font-size:11px;font-variant-numeric:tabular-nums">+{amt*100:.2f} p.p.</td></tr>"""

    warn_html = ''
    for w in log.get('warnings', []):
        warn_html += f"""
        <div style="margin:6px 0;padding:8px 12px;background:{PALETTE['yellow']}15;
                    border-left:3px solid {PALETTE['yellow']};border-radius:4px;
                    color:{PALETTE['text_lt']};font-size:11px;line-height:1.5">{w}</div>"""

    body = f"""
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px">
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">EQUITY ANTES</div>
        <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{eq_b:.1f}%</div>
      </div>
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">EQUITY DEPOIS</div>
        <div style="color:{PALETTE['green']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">{eq_a:.1f}%</div>
      </div>
      <div style="padding:12px 14px;background:{PALETTE['bg_card2']};border-radius:6px">
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px">DÉFICIT CORRIGIDO</div>
        <div style="color:{PALETTE['orange']};font-size:18px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums">+{log['deficit_corrected']*100:.2f} p.p.</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
      <div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;margin-bottom:6px">RETIRADO DE</div>
        <table style="width:100%;font-size:11px;border-collapse:collapse">{red_html or '<tr><td style="color:#777;padding:4px 12px;font-size:11px">—</td></tr>'}</table>
      </div>
      <div>
        <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:1.5px;margin-bottom:6px">DIRECIONADO PARA AÇÕES</div>
        <table style="width:100%;font-size:11px;border-collapse:collapse">{inc_html or '<tr><td style="color:#777;padding:4px 12px;font-size:11px">—</td></tr>'}</table>
      </div>
    </div>
    {warn_html}
    """
    return _card(f'Piso Estratégico de Ações Aplicado · {min_eq:.0f}% mín.',
                  body, badge='INTERNO · REGRA DA CASA', color=PALETTE['orange'])


def manager_floor_card(floor: dict) -> str:
    """Detalhes técnicos do floor."""
    if not floor:
        return ''
    body = f"""
    <table style="width:100%;font-size:12px;border-collapse:collapse">
      <tr><td style="padding:5px 12px;color:{PALETTE['text_dim']}">Título-âncora</td>
          <td style="padding:5px 12px;color:{PALETTE['text']};text-align:right">{floor.get('anchor_label','—')}</td></tr>
      <tr><td style="padding:5px 12px;color:{PALETTE['text_dim']}">Atinge meta no floor?</td>
          <td style="padding:5px 12px;text-align:right;color:{PALETTE['green'] if floor.get('achievable') else PALETTE['red']}">{('SIM' if floor.get('achievable') else 'NÃO')}</td></tr>
      <tr><td style="padding:5px 12px;color:{PALETTE['text_dim']}">Floor (% carteira)</td>
          <td style="padding:5px 12px;color:{PALETTE['text']};text-align:right;font-variant-numeric:tabular-nums">{floor.get('floor_pct',0)*100:.1f}%</td></tr>
      <tr><td style="padding:5px 12px;color:{PALETTE['text_dim']}">Upside</td>
          <td style="padding:5px 12px;color:{PALETTE['text']};text-align:right;font-variant-numeric:tabular-nums">{floor.get('upside_pct',0)*100:.1f}%</td></tr>
      <tr><td style="padding:5px 12px;color:{PALETTE['text_dim']}">Taxa líq usada</td>
          <td style="padding:5px 12px;color:{PALETTE['text']};text-align:right;font-variant-numeric:tabular-nums">{floor.get('net_yield_used',0)*100:.2f}% a.a.</td></tr>
      <tr><td style="padding:5px 12px;color:{PALETTE['text_dim']}">Excesso de cobertura</td>
          <td style="padding:5px 12px;color:{PALETTE['text']};text-align:right;font-variant-numeric:tabular-nums">{floor.get('excess',0):.2f}x</td></tr>
    </table>
    """
    return _card('Floor Técnico (NTN-B casado)', body, badge='INTERNO', color=PALETTE['orange'])


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 18 — ORQUESTRADOR (gera relatório completo: cliente, gestor, ou both)
# ═══════════════════════════════════════════════════════════════════════════

def generate_report(client: 'Client', view: 'MarketAssumptions', catalog: dict,
                     mode: str = 'client',
                     run_sensitivity: bool = True,
                     n_paths: int = 5_000,
                     current_portfolio: Optional[dict] = None,
                     override: Optional[dict] = None,
                     plot: bool = True,
                     save: bool = False,
                     db_path: str = DEFAULT_DB_PATH,
                     show_history: bool = True) -> dict:
    """
    Gera relatório completo, integrando 5 camadas:
      0) Reserva de Emergência (pré-condição)
      1) Construção de carteira por objetivo
      2) Análise de risco e simulação
      3) Score e diagnóstico
      4) Output (cliente vs gestor)
      5) Persistência e jornada (se save=True / histórico existe)

    Args:
        mode: 'client' | 'manager' | 'both'
        save: persiste snapshot no SQLite após gerar relatório
        db_path: caminho do SQLite (default: portfolio_history.db)
        show_history: se True e houver 2+ snapshots, mostra card "Sua Jornada"
    """
    assert mode in ('client', 'manager', 'both'), "mode inválido"

    # ═══ CAMADA ZERO — Reserva de Emergência (sempre primeiro) ═══════
    ef_analysis = analyze_emergency_fund(client)
    block_goals = emergency_should_block_goals(client)

    # ═══ CAMADA 5b — Histórico (se houver e show_history=True) ═══════
    history = []
    summary = {}
    if show_history:
        history = load_history(client.id, db_path=db_path)
        summary = history_summary(history)

    # Goals
    goals = client.goals or [
        Goal('Crescimento patrimonial', 0, 10, 'aggressive', 5,
             'aspirational', 'medium')
    ]

    outputs = []

    # ─────────────────────────────────────────────────────────────────
    # HEADER do dashboard cliente — único, no topo
    # ─────────────────────────────────────────────────────────────────
    if mode in ('client', 'both'):
        display(HTML(f"""
        <div style="background:linear-gradient(135deg,{PALETTE['bg']} 0%,{PALETTE['bg_card2']} 100%);
                    padding:24px 28px;border-radius:14px;margin:18px 0 6px 0;
                    border:1px solid {PALETTE['border']};font-family:-apple-system,BlinkMacSystemFont,sans-serif">
          <div style="color:{PALETTE['green_lt']};font-size:10px;letter-spacing:3px;
                      text-transform:uppercase;font-weight:700">● PLANO DE INVESTIMENTOS</div>
          <h1 style="color:{PALETTE['text']};margin:8px 0 0 0;font-size:26px;font-weight:600">
            {client.name}
          </h1>
        </div>
        """))

        # CAMADA ZERO no topo — versão grande quando incompleta, compacta quando OK
        if ef_analysis['status'] in ('incomplete', 'partial', 'excess'):
            display(HTML(client_emergency_card(client, ef_analysis)))
        else:  # 'complete'
            display(HTML(client_emergency_compact(ef_analysis)))

        # JORNADA — quando há histórico relevante
        journey_html = client_journey_card(history, summary)
        if journey_html:
            display(HTML(journey_html))
            if plot:
                plot_score_evolution(history)

        # BLOCKER — se reserva está crítica, NÃO mostrar otimização de metas
        if block_goals:
            display(HTML(f"""
            <div style="background:{PALETTE['bg_card']};border:1px solid {PALETTE['border']};
                        border-radius:10px;padding:18px 22px;margin:14px 0;
                        font-family:-apple-system,BlinkMacSystemFont,sans-serif">
              <div style="color:{PALETTE['text_dim']};font-size:11px;line-height:1.6;
                          font-style:italic">
                ℹ A análise detalhada da carteira de objetivos será gerada quando a reserva de
                emergência atingir 30% do alvo. Antes disso, todo o esforço deve ser direcionado
                para a base de proteção. <b style="color:{PALETTE['text_lt']};font-style:normal">
                Construir reserva primeiro é o que torna o resto sustentável.</b>
              </div>
            </div>
            """))

    # ─────────────────────────────────────────────────────────────────
    # HEADER do dashboard gestor — sempre roda análise técnica completa
    # ─────────────────────────────────────────────────────────────────
    if mode in ('manager', 'both'):
        display(HTML(f"""
        <div style="background:#1a1410;padding:24px 28px;border-radius:14px;
                    margin:18px 0 6px 0;border:1px solid #4a3520;
                    font-family:-apple-system,BlinkMacSystemFont,sans-serif">
          <div style="color:{PALETTE['orange']};font-size:10px;letter-spacing:3px;
                      text-transform:uppercase;font-weight:700">⚙ DASHBOARD GESTOR</div>
          <h1 style="color:{PALETTE['text']};margin:8px 0 0 0;font-size:24px;font-weight:600">
            {client.name}
          </h1>
          <div style="color:{PALETTE['text_dim']};font-size:11px;margin-top:6px">
            Premissas internas, métricas técnicas e decomposição da alocação.
            <b>Não compartilhar com cliente.</b>
          </div>
        </div>
        """))
        display(HTML(manager_emergency_card(client, ef_analysis)))

    # ─────────────────────────────────────────────────────────────────
    # Loop por objetivo — pular metas se reserva crítica (apenas cliente)
    # ─────────────────────────────────────────────────────────────────
    for goal in goals:
        # Construção da carteira
        result = build_portfolio(goal, client, view, catalog, override)
        alloc  = result['alloc']
        floor  = result['floor']

        # Risco e simulação
        risk = portfolio_risk(alloc, view, catalog, liquid=True)
        sim  = run_monte_carlo(alloc, client.savings, client.monthly,
                                goal.years,
                                goal.target if goal.target > 0 else None,
                                view, catalog, n_paths=n_paths)

        # Sensibilidade (apenas se houver meta)
        sens = None
        if run_sensitivity and goal.target > 0:
            sens = sensitivity_analysis(alloc, client.savings, client.monthly,
                                          goal.years, goal.target,
                                          view, catalog, n_paths=2_000)

        # Análise do plano
        score = plan_score(client, goal, result, sim, view, catalog, risk)
        tl    = plan_traffic_light(client, goal, result, sim, sens, view, catalog, risk)
        alerts = generate_alerts(client, goal, result, sim, sens, view, catalog, risk)
        sugg   = generate_suggestions(client, goal, result, sim, sens,
                                        view, catalog, risk, alerts)
        real_class = classify_portfolio(risk['sigma'])

        # Comparação carteira atual
        comp = None
        if current_portfolio:
            comp = compare_current_vs_recommended(
                current_portfolio, alloc,
                client.savings, client.monthly, goal.years, goal.target,
                view, catalog, n_paths=2_000,
            )

        # ─── DASHBOARD CLIENTE — pula se reserva crítica ───────────
        if mode in ('client', 'both') and not block_goals:
            display(HTML(f"""
            <div style="border-top:1px solid {PALETTE['border']};margin:24px 0 12px 0;
                        padding-top:14px;font-family:-apple-system">
              <div style="color:{PALETTE['text_dim']};font-size:10px;letter-spacing:2px;
                          text-transform:uppercase">OBJETIVO</div>
              <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px">
                {goal.name}
              </div>
            </div>
            """))

            display(HTML(client_header_card(client, goal, score, real_class)))
            display(HTML(client_score_card(score)))
            display(HTML(client_traffic_light_card(tl)))
            if plot:
                plot_client_dashboard(client, goal, alloc, sim, catalog, score)
            display(HTML(client_allocation_card(alloc, client.savings,
                                                  client.monthly, catalog, goal)))
            display(HTML(client_strategy_card(alloc, catalog, goal)))
            display(HTML(client_rationale_card(alloc, catalog, goal)))
            display(HTML(client_risks_card(alerts, sim, risk)))
            display(HTML(client_action_plan_card(client, goal, alloc, catalog,
                                                   real_class, sugg,
                                                   current_portfolio)))
            if comp and comp.get('has_current'):
                display(HTML(client_compare_card(comp, goal.target)))

        # ─── DASHBOARD GESTOR ─────────────────────────────────────
        if mode in ('manager', 'both'):
            display(HTML(f"""
            <div style="border-top:1px solid {PALETTE['border']};margin:24px 0 12px 0;
                        padding-top:14px;font-family:-apple-system">
              <div style="color:{PALETTE['orange']};font-size:10px;letter-spacing:2px;
                          text-transform:uppercase">OBJETIVO</div>
              <div style="color:{PALETTE['text']};font-size:18px;font-weight:600;margin-top:4px">
                {goal.name}
              </div>
            </div>
            """))
            display(HTML(manager_assumptions_card(view)))
            display(HTML(manager_correlation_card(catalog)))
            display(HTML(manager_risk_metrics_card(risk, sim)))
            display(HTML(manager_floor_card(floor)))
            display(HTML(manager_alloc_breakdown_card(result, catalog)))
            display(HTML(manager_enforce_card(result, catalog)))
            display(HTML(manager_scenarios_card(sim)))
            if sens:
                display(HTML(manager_sensitivity_card(sens, client.monthly)))
            if plot:
                plot_manager_dashboard(client, goal, result, sim, catalog,
                                         view, risk, sens)

        # ─── PERSISTÊNCIA — se save=True, salva snapshot por goal ───
        snapshot_id = None
        if save:
            try:
                snapshot_id = save_snapshot(
                    client, goal, result, sim, risk, score,
                    ef_analysis, view, alerts, db_path=db_path,
                )
                if mode in ('manager', 'both'):
                    display(HTML(f"""
                    <div style="margin:8px 0;padding:8px 12px;background:{PALETTE['bg_card2']};
                                border-radius:4px;color:{PALETTE['text_dim']};font-size:10px;
                                font-family:monospace">
                      💾 Snapshot #{snapshot_id} salvo em {db_path}
                    </div>"""))
            except Exception as e:
                if mode in ('manager', 'both'):
                    display(HTML(f"""
                    <div style="margin:8px 0;padding:8px 12px;background:{PALETTE['red']}15;
                                border-radius:4px;color:{PALETTE['red']};font-size:11px">
                      ⚠ Erro ao salvar snapshot: {type(e).__name__}: {str(e)[:80]}
                    </div>"""))

        outputs.append({
            'goal':         goal,
            'result':       result,
            'risk':         risk,
            'sim':          sim,
            'sens':         sens,
            'score':        score,
            'tl':           tl,
            'alerts':       alerts,
            'suggestions':  sugg,
            'comparison':   comp,
            'snapshot_id':  snapshot_id,
        })

    return {
        'client':          client,
        'reports':         outputs,
        'emergency_fund':  ef_analysis,
        'history':         history,
        'history_summary': summary,
    }


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 19 — CLIENTES DE EXEMPLO (com carteira atual opcional)
# ═══════════════════════════════════════════════════════════════════════════

CLIENTS = {
    'joao': Client(
        'joao', 'João Silva', 30, 15_000, 8_000, 50_000, 3_000,
        goals=[
            Goal('Comprar carro',         80_000,    3, 'moderate',
                 priority=3, nature='aspirational', liquidity='medium'),
            Goal('Faculdade dos filhos', 1_000_000, 20, 'aggressive',
                 priority=1, nature='essential',    liquidity='low'),
        ],
    ),
    'maria': Client(
        'maria', 'Maria Santos', 25, 10_000, 5_000, 20_000, 2_000,
        goals=[],
    ),
    'pedro': Client(
        'pedro', 'Pedro Costa', 45, 25_000, 15_000, 200_000, 5_000,
        goals=[
            Goal('Aposentadoria', 3_000_000, 25, 'aggressive',
                 priority=1, nature='essential', liquidity='low'),
        ],
    ),
    'ana': Client(
        'ana', 'Ana Rodrigues', 35, 20_000, 12_000, 100_000, 4_000,
        goals=[
            Goal('Reserva de emergência', 120_000,  2, 'conservative',
                 priority=1, nature='essential',    liquidity='high'),
            Goal('Imóvel',                800_000, 10, 'moderate',
                 priority=2, nature='aspirational', liquidity='medium'),
        ],
    ),
}


def example_current_portfolio() -> dict:
    """Exemplo: cliente que tem hoje 80% poupança/Selic + 20% ações concentradas."""
    selic_id = next((aid for aid, a in CATALOG.items() if a.cat == 'selic'), None)
    short_ipca_id = next((aid for aid, a in CATALOG.items()
                           if a.cat == 'ipca' and a.anos < 8), None)
    out = {}
    if selic_id:        out[selic_id] = 60_000
    if short_ipca_id:   out[short_ipca_id] = 10_000
    out['portfolio_z']  = 30_000
    return out


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 20 — DASHBOARD INTERATIVO (Colab + ipywidgets) com toggle CLIENTE/GESTOR
# ═══════════════════════════════════════════════════════════════════════════

def build_interactive_dashboard():
    """Constrói o dashboard interativo com sliders + toggle cliente/gestor."""
    try:
        import ipywidgets as widgets
        from IPython.display import display, clear_output
    except ImportError:
        print('ipywidgets não disponível. Use generate_report() diretamente.')
        return

    out = widgets.Output()

    # === Inputs do cliente ===
    cliente_dd = widgets.Dropdown(
        options=[(c.name, k) for k, c in CLIENTS.items()] + [('Personalizado', 'custom')],
        value='joao', description='Cliente:',
        style={'description_width': '110px'}, layout={'width': '320px'},
    )
    aporte_inicial = widgets.IntSlider(value=50_000, min=5_000, max=2_000_000,
                                          step=5_000, description='Patrim.inicial:',
                                          style={'description_width': '110px'},
                                          layout={'width': '450px'})
    aporte_mensal  = widgets.IntSlider(value=3_000, min=500, max=30_000,
                                          step=500, description='Aporte/mês:',
                                          style={'description_width': '110px'},
                                          layout={'width': '450px'})

    # === Objetivo ===
    obj_nome    = widgets.Text(value='Objetivo principal', description='Objetivo:',
                                  style={'description_width': '110px'},
                                  layout={'width': '450px'})
    obj_valor   = widgets.IntSlider(value=1_000_000, min=10_000, max=10_000_000,
                                       step=10_000, description='Meta:',
                                       style={'description_width': '110px'},
                                       layout={'width': '450px'})
    obj_prazo   = widgets.IntSlider(value=10, min=1, max=40, description='Prazo (a):',
                                       style={'description_width': '110px'},
                                       layout={'width': '450px'})
    obj_perfil  = widgets.Dropdown(
        options=[('Conservador','conservative'),('Moderado','moderate'),
                 ('Arrojado','aggressive'),('Agressivo','ultra_aggressive')],
        value='moderate', description='Perfil:',
        style={'description_width': '110px'}, layout={'width': '320px'})
    obj_priority = widgets.Dropdown(
        options=[('1 — Mais alta', 1), ('2', 2), ('3', 3), ('4', 4), ('5 — Mais baixa', 5)],
        value=1, description='Prioridade:',
        style={'description_width': '110px'}, layout={'width': '320px'})
    obj_nature = widgets.Dropdown(
        options=[('Essencial','essential'), ('Aspiracional','aspirational')],
        value='essential', description='Natureza:',
        style={'description_width': '110px'}, layout={'width': '320px'})
    obj_liquidity = widgets.Dropdown(
        options=[('Alta','high'), ('Média','medium'), ('Baixa','low')],
        value='medium', description='Liquidez:',
        style={'description_width': '110px'}, layout={'width': '320px'})

    # === Premissas (apenas para gestor) ===
    p_ipca = widgets.FloatSlider(value=0.045, min=0.02, max=0.10, step=0.005,
                                    description='IPCA:', readout_format='.1%',
                                    style={'description_width': '110px'},
                                    layout={'width': '450px'})
    p_selic = widgets.FloatSlider(value=0.115, min=0.06, max=0.16, step=0.005,
                                     description='Selic:', readout_format='.1%',
                                     style={'description_width': '110px'},
                                     layout={'width': '450px'})
    p_conv = widgets.FloatSlider(value=0.6, min=0.0, max=1.0, step=0.05,
                                    description='Convicção:', readout_format='.0%',
                                    style={'description_width': '110px'},
                                    layout={'width': '450px'})

    # === Toggle modo cliente / gestor ===
    mode_toggle = widgets.ToggleButtons(
        options=[('Dashboard Cliente', 'client'), ('Dashboard Gestor', 'manager'),
                 ('Cliente + Gestor', 'both')],
        value='client', description='Modo:',
        style={'description_width': '60px', 'button_width': '160px'},
    )

    use_current = widgets.Checkbox(value=False, description='Comparar c/ carteira atual (exemplo)',
                                      indent=False)

    btn = widgets.Button(description='▶ Gerar Plano', button_style='success',
                           layout={'width': '180px', 'height': '38px'})

    def on_click(_):
        with out:
            clear_output(wait=True)
            cid = cliente_dd.value
            if cid != 'custom':
                base = CLIENTS[cid]
                # Substitui inputs do cliente customizando o aporte inicial e mensal se mudaram
                client = Client(base.id, base.name, base.age, base.income,
                                  base.expenses, aporte_inicial.value,
                                  aporte_mensal.value, goals=[])
            else:
                client = Client('custom', 'Cliente personalizado', 35, 0, 0,
                                  aporte_inicial.value, aporte_mensal.value, goals=[])

            client.goals = [Goal(obj_nome.value, obj_valor.value, obj_prazo.value,
                                  obj_perfil.value, priority=obj_priority.value,
                                  nature=obj_nature.value,
                                  liquidity=obj_liquidity.value)]

            # Premissas customizadas
            v = MarketAssumptions(
                ipca_esperado=p_ipca.value,
                selic_esperada=p_selic.value,
                conviction=p_conv.value,
            )
            cat = build_catalog(RAW_BONDS, v)

            cur = example_current_portfolio() if use_current.value else None

            generate_report(client, v, cat,
                              mode=mode_toggle.value,
                              run_sensitivity=True,
                              n_paths=4000,
                              current_portfolio=cur,
                              plot=True)

    btn.on_click(on_click)

    # Layout
    box_client = widgets.VBox([
        widgets.HTML('<h4 style="color:#40916C;margin:6px 0">Cliente</h4>'),
        cliente_dd, aporte_inicial, aporte_mensal,
    ])
    box_goal = widgets.VBox([
        widgets.HTML('<h4 style="color:#40916C;margin:6px 0">Objetivo</h4>'),
        obj_nome, obj_valor, obj_prazo,
        widgets.HBox([obj_perfil, obj_priority]),
        widgets.HBox([obj_nature, obj_liquidity]),
    ])
    box_view = widgets.VBox([
        widgets.HTML('<h4 style="color:#F4A261;margin:6px 0">Premissas Internas '
                       '<span style="font-size:10px;color:#777">(gestor)</span></h4>'),
        p_ipca, p_selic, p_conv,
    ])
    box_actions = widgets.VBox([
        widgets.HTML('<h4 style="color:#4895EF;margin:6px 0">Modo</h4>'),
        mode_toggle, use_current, btn,
    ])

    display(widgets.HTML(
        '<div style="background:linear-gradient(135deg,#0a0f0d,#101a16);'
        'padding:18px 24px;border-radius:12px;border:1px solid #1e3a2e;'
        'margin-bottom:14px"><h2 style="color:#fff;margin:0;font-family:-apple-system">'
        'Portfolio Builder · Wealth Management</h2>'
        '<div style="color:#9aa6a0;font-size:12px;margin-top:4px">'
        'Dashboard institucional com separação cliente / gestor</div></div>'
    ))
    display(widgets.HBox([box_client, box_goal]))
    display(widgets.HBox([box_view, box_actions]))
    display(out)


# ═══════════════════════════════════════════════════════════════════════════
# SEÇÃO 21 — DEMO / EXECUÇÃO PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════

def print_setup_summary():
    """Resumo das premissas e do catálogo (verificação interna)."""
    print('═' * 80)
    print(' PORTFOLIO BUILDER v5 · WEALTH MANAGEMENT'.center(80))
    print(' Camada 0: Reserva · Persistência · Tracking'.center(80))
    print('═' * 80)
    print(f'  IPCA esperado    : {VIEW.ipca_esperado:.2%}')
    print(f'  Selic esperada   : {VIEW.selic_esperada:.2%}')
    print(f'  Convicção        : {VIEW.conviction:.0%}')
    print(f'  Equity DY        : {VIEW.eq_dividend_yield:.1%} '
           f'(crescimento real {VIEW.eq_real_growth:.1%})')
    print(f'  Catálogo         : {len(CATALOG)} ativos')
    print(f'  Clientes demo    : {", ".join(CLIENTS.keys())}')
    print(f'  DB padrão        : {DEFAULT_DB_PATH}')
    print()
    print(' Para usar:')
    print('   build_interactive_dashboard()                          # widget completo')
    print('   generate_report(CLIENTS["joao"], VIEW, CATALOG)        # cliente')
    print('   generate_report(client, VIEW, CATALOG, save=True)      # persiste no DB')
    print('   generate_report(client, VIEW, CATALOG, mode="manager") # técnico')
    print()
    print(' Persistência:')
    print('   init_db()                              # cria tabelas (idempotente)')
    print('   save_snapshot(client, ..., db_path)    # manual')
    print('   load_history(client_id)                # retorna snapshots ordenados')
    print('   plot_score_evolution(history)          # gráfico de evolução')
    print()


def run_demo_client():
    """Demo CLIENTE — relatório limpo para João, persistindo no DB."""
    print_setup_summary()
    generate_report(CLIENTS['joao'], VIEW, CATALOG, mode='client', n_paths=4000,
                     current_portfolio=example_current_portfolio(),
                     save=True)


def run_demo_emergency():
    """
    Demo da CAMADA ZERO — cliente com reserva incompleta.
    Mostra como o dashboard adapta para focar em construir reserva primeiro.
    """
    print_setup_summary()
    print(" Cliente DEMO sem reserva: priorização absoluta da camada zero")
    print()
    cliente_novo = Client(
        id='novo', name='Cliente Iniciante', age=28,
        income=8_000, expenses=4_500,
        savings=3_000,    # << bem abaixo do necessário (target = 27k)
        monthly=1_500,
        goals=[
            Goal('Comprar casa', 500_000, 15, 'aggressive',
                 priority=2, nature='aspirational', liquidity='medium'),
        ],
    )
    generate_report(cliente_novo, VIEW, CATALOG, mode='client',
                     n_paths=2500, save=True)


def run_demo_manager():
    """Demo GESTOR — relatório técnico para Pedro, persistindo."""
    print_setup_summary()
    generate_report(CLIENTS['pedro'], VIEW, CATALOG, mode='manager',
                     n_paths=4000, save=True)


def run_demo_full():
    """Demo COMPLETO — cliente + gestor para Ana."""
    print_setup_summary()
    generate_report(CLIENTS['ana'], VIEW, CATALOG, mode='both',
                     n_paths=4000, save=True)


def run_demo_journey(client_id: str = 'joao', n_snapshots: int = 6,
                      months_apart: int = 1):
    """
    Demo da CAMADA DE JORNADA — gera N snapshots históricos simulando
    meses anteriores e depois roda o relatório, que detectará automaticamente
    o histórico e mostrará o card 'Sua Jornada'.

    Útil para apresentar ao cliente o efeito de revisões mensais ao longo do tempo.
    """
    from datetime import datetime, timedelta
    print_setup_summary()
    print(f" Simulando {n_snapshots} snapshots históricos para {client_id}")
    print(f" (espaçados de {months_apart} mês cada)")
    print()

    init_db()
    base = CLIENTS[client_id]
    goal = base.goals[0] if base.goals else \
           Goal('Crescimento', 0, 10, 'aggressive', 5, 'aspirational', 'medium')

    # Simula evolução: savings crescendo + premissas mudando ligeiramente
    for i in range(n_snapshots):
        days_back = (n_snapshots - i - 1) * months_apart * 30
        ts = (datetime.now() - timedelta(days=days_back)).isoformat()

        # Patrimônio crescendo
        client_t = Client(base.id, base.name, base.age, base.income,
                           base.expenses,
                           base.savings + i * (base.monthly * months_apart * 0.95),
                           base.monthly, base.goals)

        # Premissas evoluindo levemente
        view_t = MarketAssumptions(
            ipca_esperado=VIEW.ipca_esperado + (i % 3) * 0.002,
            selic_esperada=VIEW.selic_esperada,
            conviction=VIEW.conviction,
        )
        cat_t = build_catalog(RAW_BONDS, view_t)

        result = build_portfolio(goal, client_t, view_t, cat_t)
        risk = portfolio_risk(result['alloc'], view_t, cat_t)
        sim = run_monte_carlo(result['alloc'], client_t.savings,
                                client_t.monthly, goal.years,
                                goal.target if goal.target > 0 else None,
                                view_t, cat_t, n_paths=800)
        score = plan_score(client_t, goal, result, sim, view_t, cat_t, risk)
        ef = analyze_emergency_fund(client_t)
        alerts = generate_alerts(client_t, goal, result, sim, None,
                                   view_t, cat_t, risk)
        save_snapshot(client_t, goal, result, sim, risk, score, ef,
                       view_t, alerts, timestamp=ts)
        print(f"  ✓ snapshot {i+1}/{n_snapshots}: {ts[:10]} score={score['score']:.0f}")

    print()
    print(" Rodando relatório atual com histórico carregado:")
    generate_report(base, VIEW, CATALOG, mode='client', n_paths=2000)


# ─────────────────────────────────────────────────────────────────────────
# Para rodar no Colab, descomente UMA das linhas abaixo:
# ─────────────────────────────────────────────────────────────────────────

