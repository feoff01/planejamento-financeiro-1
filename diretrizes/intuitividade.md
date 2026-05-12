# 🧠 Diretrizes de Intuitividade — Synapta

> Consulte este documento **sempre que for implementar uma nova tela ou funcionalidade**.  
> O público-alvo são pessoas que **não são do mercado financeiro** — clareza sempre ganha.

---

## 1. Linguagem

- [ ] Usar linguagem humana e direta — **evitar jargão financeiro** sem explicação.
  - ❌ "Rendimento bruto acumulado no período"
  - ✅ "Quanto você ganhou até agora"
- [ ] Valores sempre em real brasileiro formatado: `R$ 1.250,00`.
- [ ] Sempre que houver um input de valor financeiro, inclua formatação de milhar com pontos em tempo real (ex: em vez de `10000`, exibir `10.000`).
- [ ] Datas em formato brasileiro: `11 de abril de 2026`.
- [ ] Textos de erro explicam **o que aconteceu** e **o que o usuário deve fazer**.
  - ❌ "Erro 422" ou "Failed to fetch"
  - ✅ "Não conseguimos conectar ao servidor. Verifique sua internet e tente novamente."
- [ ] Erros críticos (que impedem o avanço) devem aparecer em um **Pop-up/Modal padronizado**, garantindo que o usuário perceba o impedimento imediatamente.

---

## 2. Progressive Disclosure (Revelar complexidade aos poucos)

- [ ] A tela inicial mostra o **resumo simples** — o usuário escolhe ver mais detalhes.
- [ ] Funcionalidades avançadas ficam atrás de um clique extra (ex: "Ver detalhes", "Opções avançadas").
- [ ] Formulários longos são divididos em **etapas** — nunca uma tela gigante de campos.
- [ ] Tooltips e ícones de ajuda (?) para termos que precisam de contexto.

---

## 3. Feedback Imediato

- [ ] Toda ação do usuário tem feedback visual em até **200ms** (loader, mudança de estado).
- [ ] Botões de submit ficam desabilitados enquanto a ação está em progresso.
- [ ] Confirmações de sucesso aparecem de forma clara (toast, mensagem verde).
- [ ] Erros aparecem **próximos ao campo** que causou o problema, não só no topo da tela.

---

## 4. Mobile-First

- [ ] Desenvolver e testar **primeiro no celular** (375px de largura mínima).
- [ ] Áreas clicáveis com no mínimo **44x44px** (regra Apple/Google).
- [ ] Navegação principal acessível com o **polegar** (bottom nav bar).
- [ ] Inputs financeiros (valores, datas) abrem o teclado numérico no mobile.
- [ ] Sem hover-only interactions — tudo que é clicável funciona com toque.

---

## 5. Consistência Visual

- [ ] Componentes reutilizados de forma consistente — botão primário sempre igual em toda a app.
- [ ] Paleta de cores do Synapta aplicada de forma uniforme (azul escuro, azul médio, dourado).
- [ ] Ícones do mesmo conjunto (ex: Lucide Icons) — não misturar estilos.
- [ ] Espaçamentos consistentes usando o sistema de design definido.

---

## 6. Estados Vazios e de Erro

- [ ] Toda lista ou tabela tem um **estado vazio** com mensagem amigável e call-to-action.
  - Ex: "Você ainda não tem investimentos. Comece sua primeira simulação →"
- [ ] Telas de erro (404, 500) são amigáveis e oferecem saída (botão para home).
- [ ] Estado de carregamento nunca deixa a tela em branco por mais de 300ms.

---

## 7. Onboarding

- [ ] Novo usuário sempre sabe qual é o **próximo passo** após se cadastrar.
- [ ] Dados mínimos pedidos no cadastro — pedir mais informações conforme o uso.
- [ ] Tour ou dicas contextuais na primeira vez que o usuário acessa cada seção.

---

## 8. Checklist Rápido Pré-Deploy de Tela

| Item | OK? |
|---|---|
| Testado no mobile (375px) | ☐ |
| Sem jargão sem explicação | ☐ |
| Todos os estados: loading, erro, vazio, sucesso | ☐ |
| Feedback visual em todas as ações | ☐ |
| Texto de erro é útil e orientativo | ☐ |
| Progressive disclosure aplicado se a tela for complexa | ☐ |
