# Identidade Visual Synapta

## Direcao

A Synapta deve parecer menos uma ferramenta que impressiona e mais uma instituicao digital em que alguem confiaria seu futuro financeiro. A referencia desejada e uma estetica prime, minimalista e editorial: autoridade silenciosa, poucos elementos, muito respiro e sensacao de produto financeiro serio.

## Principios

- Menos estetica de IA, mais private banking digital.
- IA como bastidor de inteligencia, nao como linguagem visual principal.
- Evitar excesso de cards, cards dentro de cards, glassmorphism pesado, bordas cinzas evidentes e brilhos decorativos.
- Comportamento indesejado: card com bordas cinzas finas genericas. Quando um card for necessario, ele deve se sustentar por hierarquia, respiro, fundo ou contraste intencional, nao por uma linha cinza padrao ao redor.
- Comportamento indesejado: sombras decorativas em cards de formulario/onboarding. Nesses fluxos, preferir composicao plana, espacamento e diferenca sutil de fundo; sombra so deve aparecer quando houver uma justificativa clara de camada, modal ou sobreposicao real.
- Modais contextuais devem aparecer como sobreposicao real sobre a tela de destino, com o fundo escurecido. Nao criar uma tela intermediaria so para o modal e nunca colocar modal/card isolado dentro de outro card/container de pagina.
- Modais fullscreen devem ser renderizados via portal em `document.body`, nao dentro da arvore visual do componente que os dispara.
- Overlays fullscreen nao devem usar `backdrop-filter`, `backdrop-blur` ou filtros pesados por padrao. Preferir fundo solido/translucido simples para evitar travamento.
- `position: fixed` dentro de ancestrais com `transform`, animacao ou filtros pode ficar preso ao container. Para cobrir a viewport real, usar portal.
- Modal de aviso educativo deve ser direto, bloqueante apenas ate o usuario confirmar, e manter o conteudo principal ja carregado ao fundo para preservar contexto.
- Layouts centralizados com `absolute`, `top-1/2` ou `translate-y-1/2` nunca podem conter conteudo de altura livre. Wizard centralizado nao deve usar scroll interno como solucao visual; etapas longas devem ser paginadas, segmentadas ou redesenhadas para caber no card.
- Em formularios multi-etapa, validar visualmente a menor e a maior etapa. A etapa pequena pode ficar centralizada, mas a etapa longa nao pode vazar da viewport, criar scroll quebrado na pagina, esconder acoes principais ou depender de rolagem dentro do card.
- Centralizar verticalmente exige controlar a altura real do conteudo, nao apenas aplicar CSS absoluto. Se uma etapa nao couber, a composicao da etapa deve mudar.
- Usar composicao, tipografia, contraste e espaco como principais elementos de identidade.
- Card deve existir quando tiver funcao clara: plano, depoimento, modulo repetido ou modal.
- Priorizar telas com sensacao de ferramenta premium, nao template generico de SaaS.

## Tipografia

- Headlines: Editorial New como direcao principal.
- Fallback aceitavel para visualizacao: serifas editoriais proximas, como Georgia, Times New Roman ou similares.
- Interface e texto de apoio: uma sans limpa, neutra e legivel. Inter pode continuar como base enquanto avaliamos uma alternativa como Geist, Satoshi, Neue Haas ou Manrope.
- A tipografia deve carregar boa parte da personalidade da marca: titulos mais editoriais, corpo mais objetivo e funcional.

## Cores

Por enquanto, manter as cores principais atuais do Synapta:

- Azul profundo como base institucional.
- Dourado/latao como acento de valor e destaque.
- Branco/off-white para areas de respiro e legibilidade quando fizer sentido.
- Verde apenas para dados positivos ou informacao financeira, nao como cor dominante da marca.

A paleta pode ser refinada no futuro se a nova direcao pedir mais leveza editorial, mas a primeira etapa deve testar a mudanca de linguagem sem trocar a identidade cromatica central.

## Landing Page

A landing deve ser o primeiro laboratorio dessa identidade:

- Mais editorial, minimalista e premium.
- Menos brilho e menos efeito de IA.
- Mostrar produto e promessa com confianca, sem exagero visual.
- Reduzir card dentro de card.
- Usar secoes mais planas, separadas por espaco, contraste e hierarquia tipografica.
- Manter CTAs claros e funcionais.

## Tom Visual

Palavras-chave:

- Prime
- Minimalista
- Editorial
- Financeiro
- Seguro
- Claro
- Institucional
- Humano

Evitar:

- Template de IA
- SaaS generico
- Gradientes nebulosos
- Excesso de bordas
- Promessas visuais exageradas
- Componentes flutuantes sem funcao

## Padroes de Implementacao (Tecnico)

Para manter a integridade visual da interface, especialmente em textos com acentuacao (Portugues):

- **Codificacao de Arquivos**: Todos os arquivos do projeto devem obrigatoriamente ser salvos em **UTF-8**.
- **Evitar Mojibake**: Nunca salvar ou editar arquivos usando codificacoes legadas (como ISO-8859-1 ou Windows-1252), pois isso corrompe os caracteres especiais e acentos, prejudicando a estetica premium do produto.
- **Validacao Visual**: Sempre verificar se os acentos estao sendo renderizados corretamente apos qualquer alteracao em componentes de interface.
