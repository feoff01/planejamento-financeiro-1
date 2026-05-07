# Synapta Investimentos — Mapa de Produtos

> Disseção completa do projeto `mvp-com-produtos/synata-felipe`  
> Gerado em: Abril 2026

---

## Visão Geral da Plataforma

**Synapta Investimentos** é uma plataforma fintech brasileira que combina:
- Screening de ações fundamentalistas
- Otimização de carteira (Modelo de Markowitz)
- Diagnóstico financeiro pessoal
- Preços em tempo real (Yahoo Finance)
- Consultor de IA financeiro

**Stack Técnica:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (Auth + DB + Storage)
- Biblioteca de gráficos: Recharts
- Pagamentos: Stripe (configurado, não implementado)
- Internacionalização: i18next

---

## Mapa dos 11 Produtos

| # | Produto | Rota | Status | APIs Externas |
|---|---------|------|--------|---------------|
| 01 | [Autenticação & Perfil](./01-autenticacao-e-perfil.md) | `/auth/login`, `/auth/cadastro` | ✅ Completo | Supabase Auth |
| 02 | [Planejamento Financeiro](./02-planejamento-financeiro.md) | `/onboarding` | ✅ Completo | Supabase DB |
| 03 | [Screening de Ações](./03-screening-de-acoes.md) | `/screening` | ✅ Funcional | Yahoo Finance |
| 04 | [Otimizador de Carteira](./04-otimizador-markowitz.md) | `/markowitz` | ✅ Completo | Nenhuma |
| 05 | [Dashboard Principal](./05-dashboard-principal.md) | `/dashboard` | ✅ Funcional | Supabase DB |
| 06 | [Gestão de Carteira](./06-gestao-de-carteira.md) | `/carteira` | ✅ Funcional | Supabase DB |
| 08 | [Consultor Synapta (Chat IA)](./08-consultor-synapta-chat-ia.md) | `/chat` | ⚠️ Mock (sem IA real) | Nenhuma |
| 09 | [Painel Administrativo](./09-painel-administrativo.md) | `/admin` | ✅ Funcional | Supabase DB |
| 10 | [Landing Page](./10-landing-page-e-servico-de-precos.md) | `/` | ✅ Completa | Nenhuma |
| 11 | [Serviço de Preços ao Vivo](./10-landing-page-e-servico-de-precos.md) | Transversal | ⚠️ Parcial (só Screening) | Yahoo Finance |

---

## Dependências entre Produtos

```
Autenticação (01)
  └── Alimenta: TODOS os outros produtos

Onboarding / Planejamento (02)
  └── Alimenta: Dashboard (05), Chat (08)

Serviço de Preços (11)
  └── Alimenta: Screening (03)
  └── Pendente em: Carteira (06), Dashboard (05)

Carteira (06)
  └── Alimenta: Dashboard (05) [holdings]

Admin (09)
  └── Edita: Carteiras Recomendadas → exibidas em Carteira (06)
```

---

## Banco de Dados (Supabase)

### Tabelas Implementadas

| Tabela | Produto responsável | CRUD |
|--------|---------------------|------|
| `profiles` | Autenticação (01) | R/U via useAuth |
| `onboarding_data` | Planejamento (02) | C/R/U |
| `transacoes` | Carteira (06) | C/R |
| `carteiras_recomendadas` | Admin (09) | R/U |
| `carteira_ativos` | Admin (09) | R/U |

### Tabelas Planejadas (ainda não integradas)

| Tabela | Produto | Status |
|--------|---------|--------|
| `chat_historico` | Chat IA (08) | Definida, não integrada |
| `ativos` | Screening (03) | Não criada (usa mock) |
| `precos_historicos` | Otimizador de Carteira (04) | Não criada (usa simulação) |
| `alertas` | Dashboard (05) | Não criada (calculado localmente) |
| `limites_setor` | Otimizador de Carteira (04) | Não criada (configurado na UI) |
| `relatorios_ativo` | Admin (09) | Não criada |

---

## APIs e Integrações Externas

| API / Serviço | Produtos que usam | Status |
|---------------|-------------------|--------|
| **Supabase Auth** | Autenticação (01) | ✅ Ativo |
| **Supabase Database** | Maioria | ✅ Ativo |
| **Yahoo Finance** | Screening (03), Preços (11) | ✅ Ativo (sujeito a CORS) |
| **Stripe** | Não implementado | ❌ Configurado no package.json apenas |
| **Firebase** | Não implementado | ❌ No package.json, não usado |
| **i18next** | Toda a plataforma | ⚠️ Configurado, uso mínimo |
| **OpenAI/Anthropic** | Chat IA (08) | ❌ Não conectado |

---

## Variáveis de Ambiente Necessárias

```env
# Supabase (OBRIGATÓRIO)
VITE_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...

# Firebase (configurado, não usado ativamente)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...

# Stripe (configurado, não implementado)
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## Grandes Lacunas (GAPs Críticos)

| # | Problema | Produto afetado | Impacto |
|---|----------|-----------------|---------|
| 1 | Chat IA sem LLM real | Chat (08) | Produto mais fraco — só pattern-matching |
| 2 | Preços ao vivo só no Screening | Carteira (06), Dashboard (05) | Holdings e patrim. com preços desatualizados |
| 3 | Dados fundamentalistas mockados | Screening (03) | Dados não reais de P/L, ROE, etc. |
| 4 | CORS no Yahoo Finance | Preços (11) | Pode falhar no browser em produção |
| 5 | Carteiras admin não integradas na Carteira | Carteira (06), Admin (09) | Admin edita mas cliente não vê em tempo real |
| 6 | Gráfico de patrimônio mockado | Dashboard (05), Financeiro (07) | Evolução histórica é fake |
| 7 | Preços Otimizador de Carteira simulados | Otimizador de Carteira (04) | Resultado educativo, não para trading real |
| 8 | Stripe sem implementação | — | Monetização não funciona |

---

## Fases de Desenvolvimento (do project_plan.md)

| Fase | Status | Escopo |
|------|--------|--------|
| Fase 1: Landing + Estrutura | ✅ Completa | Landing page + rotas |
| Fase 2: Auth + Planejamento | ✅ Completa | Login + diagnóstico |
| Fase 3: Screening + Ativo | ✅ Parcial | Screening ok, página `/acao/:ticker` ausente |
| Fase 4: Dashboard + Carteira | ✅ Funcional | Preços estáticos |
| Fase 5: Otimizador de Carteira | ✅ Completa | Engine total em TypeScript |
| Fase 6: Chat IA + Dashboard | ⚠️ Parcial | Dashboard ok, Chat sem IA |
| Fase 7: Admin Panel | ✅ Funcional | Sem upload de PDFs |
| Fase 8: Polimento + Deploy | ❌ Pendente | — |

---

## Scripts Disponíveis

```bash
npm run dev        # Inicia servidor de desenvolvimento (Vite)
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # Lint com ESLint
npm run type-check # Verificação de tipos TypeScript
```
