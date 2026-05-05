# Diretrizes de Responsividade e Mobile-First

No Synapta Invest, a responsividade não é um "ajuste final", mas a premissa número 1 do desenvolvimento. Todo componente deve ser pensado para funcionar perfeitamente em um celular e escalar elegantemente para o desktop.

---

## 1. Metodologia Mobile-First
**Regra de Ouro:** Desenvolva para a menor tela primeiro (320px - 375px) e use Media Queries para adicionar complexidade conforme a tela aumenta.
*   É proibido criar uma versão Desktop e depois tentar "esconder" ou "espremer" elementos para o Mobile.
*   O código CSS deve começar com os estilos base (Mobile) e usar `@media (min-width: ...)` para Desktop.

## 2. Unidades e Medidas
*   **Proibido:** Uso de larguras fixas em pixels (`width: 1200px`) para containers principais.
*   **Obrigatório:** Uso de unidades relativas (`width: 100%`, `max-width: 1200px`, `rem`, `em`, `vw`, `vh`).
*   **Espaçamento:** Utilize variáveis ou escalas (ex: `gap: 1rem`, `padding: 2rem`) para manter a consistência entre dispositivos.

## 3. Layouts Fluídos (Flexbox & Grid)
*   **Flexbox:** Use para alinhar elementos em linha que devem "quebrar" para a próxima linha no mobile (`flex-wrap: wrap`).
*   **CSS Grid:** Use para dashboards e tabelas. No Mobile, a grade deve ter 1 coluna (`grid-template-columns: 1fr`). No Desktop, expandir para 2, 3 ou 12 colunas conforme a necessidade.

## 4. Breakpoints Padrão
Utilizaremos os seguintes pontos de quebra para manter a harmonia:
- **Mobile Pequeno:** 320px
- **Mobile/Tablet:** 768px
- **Desktop:** 1024px
- **Desktop Ultra-wide:** 1440px+

## 5. Componentes Autônomos
Cada componente (Cards de Score, Gráficos, Tabelas) deve ser responsável por sua própria responsividade.
*   **Gráficos:** Sempre envolver em `<ResponsiveContainer />` ou similar para que ocupem o espaço disponível do pai.
*   **Tabelas:** Em telas pequenas, tabelas devem ter `overflow-x: auto` ou serem transformadas em "Lista de Cards".

## 6. Toque e Interação
*   Elementos clicáveis no Mobile devem ter uma área de toque mínima de **44px x 44px**.
*   Evite depender exclusivamente de eventos de `hover` para funcionalidades críticas, pois o `hover` não existe em dispositivos touch.

---

## Resumo para o Desenvolvedor
1. Abra o Inspetor do Navegador em modo **iPhone SE (375px)**.
2. Construa a funcionalidade.
3. Aumente a tela para Tablet e Desktop e ajuste o layout usando `@media (min-width: ...)`.
4. **Se o componente não funciona no celular, ele não está pronto.**
