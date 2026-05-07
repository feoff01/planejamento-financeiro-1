# Produto 04 — Otimizador de Carteira

## O que é?
Um **motor matemático de otimização de portfólio** implementado em TypeScript puro, fiel ao modelo de Harry Markowitz (1952 — vencedor do Nobel de Economia). Calcula a carteira ideal para maximizar retorno com o menor risco, usando simulação Monte Carlo para gerar a **Fronteira Eficiente**.

---

## O que faz?

| Função | Descrição |
|--------|-----------|
| **Seleção de ativos** | Escolha de 2 a 10 ações da lista disponível |
| **Configuração de parâmetros** | Taxa livre de risco (Selic), peso máximo por ativo, limite por setor |
| **Simulação Monte Carlo** | Gera 2.000 carteiras aleatórias com restrições |
| **Fronteira Eficiente** | Plota os pontos risco × retorno no gráfico de dispersão |
| **3 Carteiras Otimizadas** | Máximo Sharpe, Mínima Variância, Máximo Retorno |
| **Alocação Detalhada** | Exibe o peso percentual de cada ativo na carteira escolhida |
| **Controle de setores** | Respeita limite máximo de exposição por setor |

---

## Como funciona internamente?

### Fluxo completo de cálculo

```
1. Usuário seleciona tickers + configura parâmetros
         ↓
2. gerarPrecosSimulados(ticker, 252)
   → Gera 252 preços históricos simulados (1 ano de pregões)
   → Usa seed baseada no ticker para consistência
         ↓
3. calcularRetornos(precos)
   → Retornos diários: r_t = P_t / P_{t-1} - 1
         ↓
4. retornosEsperados(assets)
   → Média dos retornos diários × 252 pregões
         ↓
5. matrizCovariancia(assets)
   → Covariância amostral entre cada par de ativos × 252
         ↓
6. frontieraEficiente(assets, 2000, rfRate, maxPeso, limitesSetor)
   → Loop Monte Carlo: gera 2.000 combinações aleatórias de pesos
   → Para cada combinação:
       · Verifica restrição de setor (descarta se viola)
       · Calcula: retorno, volatilidade, Sharpe
   → Retorna array de EfficientFrontierPoint
         ↓
7. minimaVariancia(pontos) → Ponto com menor volatilidade
   maximoSharpe(pontos)   → Ponto com maior Sharpe Ratio
   maximoRetorno(pontos)  → Ponto com maior retorno esperado
         ↓
8. Exibe gráfico + cards das 3 carteiras + alocação detalhada
```

---

## Matemática por Trás

### Retornos Diários
```
r_t = P_t / P_{t-1} - 1
```

### Retorno Esperado Anualizado
```
E(r) = mean(retornos_diários) × 252
```

### Variância da Carteira
```
σ²(p) = wᵀ · Σ · w
```
Onde `w` = vetor de pesos, `Σ` = matriz de covariância anualizada

### Volatilidade da Carteira
```
σ(p) = √σ²(p)
```

### Sharpe Ratio
```
Sharpe = (E(r) - Rf) / σ(p)
```
Onde `Rf` = taxa livre de risco (Selic, configurável de 5% a 20%)

### Limites por Setor
```
Para cada setor s:
  Σ(pesos dos ativos do setor s) ≤ limite_setor (configurável)
```

---

## Parâmetros Configuráveis

| Parâmetro | Padrão | Mín | Máx | Descrição |
|-----------|--------|-----|-----|-----------|
| Taxa livre de risco | 10% | 5% | 20% | Referência Selic |
| Peso máximo por ativo | 40% | 10% | 100% | Concentração máxima |
| Limite por setor | 40% | 20% | 100% | Exposição máxima por setor |
| Nº de simulações | 2.000 | — | — | Pontos na fronteira eficiente |

---

## As 3 Carteiras Geradas

| Carteira | Critério | Melhor Para |
|---------|----------|-------------|
| **Máximo Sharpe** | Maior Sharpe Ratio | Maioria dos investidores — melhor risco/retorno |
| **Mínima Variância** | Menor volatilidade | Conservadores — quer o mínimo de oscilação |
| **Máximo Retorno** | Maior retorno esperado | Arrojados — aceita alto risco por alto retorno |

---

## Onde mora o código?

| Arquivo | Função |
|---------|--------|
| `src/lib/markowitz.ts` | Engine matemático (203 linhas) |
| `src/pages/markowitz/page.tsx` | Interface do otimizador (281 linhas) |
| `src/mocks/acoes.ts` | Lista de ativos disponíveis |

---

## Funções Exportadas do Engine

```typescript
// Utilitários de cálculo
calcularRetornos(precos: number[]): number[]
matrizCovariancia(assets: AssetData[]): number[][]
retornosEsperados(assets: AssetData[]): number[]
volatilidades(assets: AssetData[]): number[]
retornoCarteira(weights, expectedReturns): number
varianciaCarteira(weights, covMatrix): number
volatilidade(weights, covMatrix): number
sharpeRatio(ret, vol, rfRate?): number

// Fronteira Eficiente
frontieraEficiente(assets, nSim, rfRate, maxPeso, limitesSetor?, setores?): EfficientFrontierPoint[]

// Carteiras Ótimas
minimaVariancia(pontos): EfficientFrontierPoint
maximoSharpe(pontos): EfficientFrontierPoint
maximoRetorno(pontos): EfficientFrontierPoint

// Simulação de dados para mock
gerarPrecosSimulados(ticker, n?): number[]
```

---

## Interfaces TypeScript

```typescript
interface AssetData {
  ticker: string;
  returns: number[]; // retornos diários
}

interface PortfolioResult {
  weights: Record<string, number>; // {PETR4: 0.3, VALE3: 0.7}
  expectedReturn: number;           // anualizado
  volatility: number;               // anualizado
  sharpe: number;
  label: string;
}

interface EfficientFrontierPoint {
  volatility: number;
  expectedReturn: number;
  sharpe: number;
  weights: Record<string, number>;
}
```

---

## Gráfico Gerado (Recharts)

**Tipo:** ScatterChart (Gráfico de Dispersão)
- **Eixo X:** Risco (volatilidade anualizada, em %)
- **Eixo Y:** Retorno esperado anualizado (em %)
- **Pontos:** 500 carteiras simuladas (amostra dos 2.000)
- **Linhas de referência:** Indicam a carteira de Máximo Sharpe e Mínima Variância

---

## APIs e Integrações Externas

> **Nenhuma API externa é consumida neste produto.**

Todo o processamento é feito **100% no frontend em TypeScript puro**. Os preços históricos são **simulados** (não reais).

---

## Limitações Conhecidas

| Limitação | Impacto |
|-----------|---------|
| Preços simulados (não históricos reais) | Resultado educativo, não preciso financeiramente |
| Sem otimização analítica (só Monte Carlo) | Pode não encontrar o ótimo exato com poucas simulações |
| Dados fundamentalistas mockados | Setores para restrição vêm do mock, não de banco |
| Performance em dispositivos lentos | 2.000 simulações podem travar por ~100ms |

---

## Status de Implementação

- [x] Engine Markowitz completo (fiel ao Python)
- [x] Retornos diários e anualização por 252 pregões
- [x] Matriz de covariância amostral
- [x] Sharpe Ratio com taxa livre de risco configurável
- [x] Simulação Monte Carlo (2.000 carteiras)
- [x] Fronteira eficiente com gráfico interativo
- [x] 3 carteiras ótimas (Máximo Sharpe / Mínima Variância / Máximo Retorno)
- [x] Limite por ativo (peso máximo)
- [x] Limite por setor
- [x] Alocação detalhada com barra de progresso
- [ ] Preços históricos reais (atualmente simulados)
- [ ] Otimização analítica (scipy-like) — atualmente só Monte Carlo
- [ ] Exportação da carteira para CSV
- [ ] Aplicação direta na carteira do usuário
- [ ] Backtesting da carteira otimizada

---

## Observações

> O produto foi implementado como um **motor TypeScript puro**, sem dependências de bibliotecas de álgebra linear. Isso significa que pode ser facilmente portado para um backend/edge function se necessário.

> A referência do projeto cita que a implementação é **"fiel ao Python"** do template `Markowitz_BR_Template_v2.xlsx`, indicando que existe uma planilha Excel de referência com a lógica original em Python/Python-Excel.
