# Identidade Visual Synapta

## Direcao

A Synapta deve parecer menos uma ferramenta que impressiona e mais uma instituicao digital em que alguem confiaria seu futuro financeiro. A referencia desejada e uma estetica prime, minimalista e editorial: autoridade silenciosa, poucos elementos, muito respiro e sensacao de produto financeiro serio.

## Principios

- Menos estetica de IA, mais private banking digital.
- IA como bastidor de inteligencia, nao como linguagem visual principal.
- Evitar excesso de cards, cards dentro de cards, glassmorphism pesado, bordas cinzas evidentes e brilhos decorativos.
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
