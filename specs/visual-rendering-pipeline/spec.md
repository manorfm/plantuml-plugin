# Spec: pipeline de renderização visual (SVG)

## Problema

O diagrama devolvido pelo servidor PlantUML é funcional mas visualmente genérico. Pretende-se elevar a qualidade percebida (sombras, gradientes, espaçamento, cores semânticas) **sem** alterar o motor PlantUML e **sem** obrigar o utilizador a escrever `skinparam` manualmente para um resultado moderno.

## Comportamento esperado

1. **Análise leve** do texto fonte para inferir o tipo de diagrama (ex.: sequência, classe, componente) e adaptar estilo.
2. **Préâmbulo opcional** com `skinparam` coerentes com o tema da extensão — aplicado **em conjunto** com `diagramPreamble` do utilizador. O texto do plugin é inserido **depois** de `!theme plain` (quando existe no diagrama) para as cores não serem anuladas pelo tema. Se o ficheiro tiver **`!theme` não-plain**, não injectar o bloco. Com **`!theme plain`**, injectar sempre **estilo** (cores, fonte, sombras, estereótipos); injectar **espaçamento** automático (`nodesep`, `ranksep`, `linetype`) apenas se o utilizador **não** tiver já `skinparam` de layout. Os valores `plantumlViewer.visualTheme` (**none**, **modern-dark**, **glass**, **minimal**) **não** são nomes de `!theme` do PlantUML; documentar para evitar HTTP 400 no servidor.
3. **Pós-processamento obrigatório do SVG** quando activo: injectar `<defs>` (filtros, gradientes) e regras CSS internas ao SVG para sombras suaves, traços e hover simples.
4. **Temas nomeados**: pelo menos `modern-dark` (defeito), `glass`, `minimal`, e modo `none` que desactiva melhorias visuais (compatibilidade).
5. **Cores semânticas opcionais**: heurísticas baseadas em palavras-chave (`actor`/`participant`, `database`, serviços) para `skinparam` onde fizer sentido.
6. **Estereótipos `<<…>>`**: paleta pastel harmonizada; `skinparam` por estereótipo (ex.: `component<<TypeScript>>`) para destacar notações sem quebrar a coerência visual.
7. **Tipografia**: família sans-serif por defeito adequada a servidores comuns (ex. DejaVu Sans); skinparams para rótulos de setas, títulos e elementos; reforço opcional no SVG para `text`/`tspan`. Saltos visuais em cruzamentos de arestas **não** fazem parte do motor PlantUML — documentar limitação.
8. **API de desenvolvimento** `renderDiagram({ uml, theme?, ... })` que orquestra preparação do texto, pedido SVG ao servidor e pós-processamento, reutilizável pela extensão e testável sem Webview.

## Critérios de aceitação

1. A pré-visualização do editor personalizado aplica o pipeline quando as definições não estão em `none`.
2. Exportação SVG usa o mesmo texto preparado e o mesmo pós-processamento que a pré-visualização (para o mesmo conteúdo e definições).
3. Diagramas existentes sem alteração de texto continuam válidos; modo `none` reproduz o fluxo anterior (só préâmbulo do utilizador + SVG do servidor).
4. Testes unitários cobrem análise de tipo, geração de préâmbulo e transformação SVG em exemplos estáveis.
5. Documentação breve do pipeline e dos temas em `docs/` ou na pasta da feature.

## Fora de escopo

- Alterar o binário ou código do servidor PlantUML.
- Editor gráfico WYSIWYG.
- Interactividade avançada (grafos clicáveis completos) — apenas melhorias opcionais futuras (hover CSS já permitido no spec se implementável sem quebrar CSP).
