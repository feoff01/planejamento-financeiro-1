# Produto 05 — Dashboard Principal

## O que é?
A **tela central** da plataforma Synapta, exibida imediatamente após o login. Funciona como um painel de controle que consolida em um lugar só: patrimônio, carteira, metas, alertas e atalhos para os principais produtos.

---

## O que faz?

| Função | Descrição |
|--------|-----------|
| **Saudação personalizada** | Exibe o primeiro nome do usuário e a data atual |
| **Alertas inteligentes** | Avisa sobre reserva de emergência insuficiente e outros alertas |
| **Cards de métricas** | Patrimônio total, ganho/perda, ativos na carteira, perfil de risco |
| **Gráfico de evolução** | Curva do patrimônio nos últimos 12 meses |
| **Alocação por setor** | Gráfico de pizza com a distribuição da carteira |
| **Metas financeiras** | Exibe as 3 principais metas com barra de progresso |
| **Ações rápidas** | Atalhos para Screening, Otimizador de Carteira, Chat IA e Nova Transação |

---

## Fluxo de Dados

```
Usuário abre /dashboard
     ↓
loadData() [Promise.all de 3 queries paralelas]:
  1. supabase.from('transacoes').select('*').eq('user_id', user.id)
  2. supabase.from('metas').select('*').eq('user_id', user.id)
  3. supabase.from('onboarding_data').select('patrimonio_total, gastos_mensais, meses_reserva')
     ↓
calcularHoldings(transacoes)
  → Processa compras/vendas em ordem cronológica
  → Calcula preço médio e quantidade de cada ativo
     ↓
Métricas calculadas na memória:
  · totalPatrimonio = Σ(qtd × preçoAtual)
  · totalInvestido  = Σ(qtd × preçoMédio)
  · ganhoTotal = totalPatrimonio - totalInvestido
  · ganhoPercent = (ganhoTotal / totalInvestido) × 100
  · alocaçãoSetor = agrupamento por setor
     ↓
Renderiza UI com dados reais (ou mock se carteira vazia)
```

---

## Métricas Exibidas

### Cards de Resumo (4 cards)

| Métrica | Fonte | Cálculo |
|---------|-------|---------|
| Patrimônio Total | Supabase `transacoes` + `onboarding_data` | Valor atual da carteira. Se vazia, usa o declarado no onboarding |
| Ganho/Perda Total | Calculado localmente | `(valor_atual - valor_investido) / valor_investido × 100` |
| Ativos na Carteira | Calculado localmente | Contagem de tickers com posição positiva |
| Perfil de Risco | Supabase `profiles` | Conservador, Moderado ou Arrojado |

---

### Gráfico de Evolução do Patrimônio

**Tipo:** AreaChart (Recharts)
**Dados:** `mockEvolucaoPatrimonio` — array estático de 12 meses
**Período:** Jan/24 a Dez/24

> ⚠️ Atualmente usa dados mockados estáticos. Em produção viria de snapshots mensais reais do patrimônio.

---

### Gráfico de Alocação por Setor

**Tipo:** PieChart com Donut (Recharts)
**Dados:** Calculado dinamicamente a partir das transações reais do usuário

Setores mapeados com cores:
| Setor | Cor |
|-------|-----|
| Petróleo, Gás e Biocombustíveis | Verde (#84CC16) |
| Materiais Básicos | Teal (#14B8A6) |
| Financeiro | Dourado (#D4AF37) |
| Bens Industriais | Rosa (#EC4899) |
| Utilidade Pública | Esmeralda (#10B981) |
| Serviços | Âmbar (#F59E0B) |
| Saúde | Ciano (#06B6D4) |
| Tecnologia | Violeta (#8B5CF6) |
| Agronegócio | Verde (#22C55E) |

---

## Sistema de Alertas

O dashboard gera alertas inteligentes baseados nos dados do usuário:

### Alerta de Reserva de Emergência
```typescript
// Condição de disparo:
if (gastos_mensais > 0 && reserva_atual < gastos_mensais * 6) {
  // Mostra alerta informando quantos meses de reserva tem e que a meta é 6 meses
}
```

**Tipos de alerta:**
- `aviso` → Âmbar (situação preocupante)
- `info` → Azul (informação útil)
- `sucesso` → Verde (conquista atingida)

---

## Ações Rápidas (4 botões)

| Ação | Destino | Cor |
|------|---------|-----|
| Buscar Ações | `/screening` | Dourado |
| Otimizar Carteira | `/markowitz` | Esmeralda |
| Consultor IA | `/chat` | Azul |
| Nova Transação | `/carteira` | Rosa |

---

## Onde mora o código?

| Arquivo | Função |
|---------|--------|
| `src/pages/dashboard/page.tsx` | Página completa (375 linhas) |
| `src/mocks/portfolio.ts` | `mockEvolucaoPatrimonio` (gráfico de evolução) |
| `src/hooks/useAuth.ts` | Dados do usuário (nome, perfil) |
| `src/lib/supabase.ts` | Client para queries |

---

## Estrutura de Dados Consumida

### Tabelas do Supabase

| Tabela | Campos | Uso |
|--------|--------|-----|
| `transacoes` | `ticker, tipo, quantidade, preco, data, total` | Calcular holdings e ganho |
| `metas` | `nome, atual, meta, prazo, cor` | Exibir barra de progresso |
| `onboarding_data` | `patrimonio_total, gastos_mensais, meses_reserva` | Patrimônio declarado e alertas |
| `profiles` | `nome, perfil, onboarding_completo` | Saudação e perfil exibido |

### Referência local de preços (hardcoded no componente)

```typescript
const tickerInfo = {
  PETR4: { setor: '...', precoAtual: 38.42, variacao: 1.23 },
  VALE3: { setor: '...', precoAtual: 62.18, variacao: -0.87 },
  // ...14 tickers no total
}
```

> ⚠️ Os preços atuais no dashboard **não são ao vivo** — são valores hardcoded no componente. O Screening tem os preços ao vivo, não o Dashboard.

---

## Algoritmo: calcularHoldings

```
Para cada transação ordenada cronologicamente:
  SE compra:
    mapa[ticker].qtd += quantidade
    mapa[ticker].custoTotal += quantidade × preco
  SE venda:
    precoMedio = custoTotal / (qtdAnterior + qtdVenda)
    mapa[ticker].qtd -= quantidade
    mapa[ticker].custoTotal -= quantidade × precoMedio

Retorna: posições com qtd > 0, com preço médio calculado por FIFO
```

---

## APIs e Integrações Externas

| Integração | Uso |
|------------|-----|
| **Supabase DB** | `transacoes`, `metas`, `onboarding_data` |

> Sem APIs externas de preços. Os preços no dashboard são estáticos.

---

## Status de Implementação

- [x] Cards de métricas
- [x] Saudação personalizada
- [x] Alertas de reserva de emergência
- [x] Gráfico de evolução do patrimônio
- [x] Alocação por setor (pie chart)
- [x] Metas financeiras com progresso
- [x] Ações rápidas
- [x] Cálculo de holdings a partir de transações reais
- [ ] Preços ao vivo no dashboard (atualmente estáticos)
- [ ] Alertas de concentração de setor
- [ ] Histórico de alertas
- [ ] Notificação de dividendos
- [ ] Widgets customizáveis

---

## Observações

> O Dashboard é o **único ponto que consolida dados de múltiplos produtos**. Serve como "home" do usuário logado.

> O gráfico de evolução do patrimônio usa dados **mockados** (`mockEvolucaoPatrimonio`). Em produção, precisaria ser gerado a partir de snapshots históricos armazenados no banco.
