# Spec: zoom com roda do rato na área do diagrama

## Problema

O utilizador precisa de **ajustar rapidamente a escala** do diagrama renderizado sem abrir definições ou comandos. Hoje a escala depende sobretudo de **`plantumlViewer.previewZoom`** (e eventualmente de gestos de pan noutros eixos); falta um controlo **directo e contínuo** na própria área de pré-visualização.

## Comportamento esperado

- Com o ponteiro sobre a **área do diagrama** (viewport SVG), **Ctrl** (Windows/Linux) ou **Cmd** (macOS) **e** a **roda do rato** alteram o nível de zoom: rolar num sentido **aproxima** o diagrama, no sentido oposto **afasta**. A roda **sem** modificador mantém o **scroll** do painel quando o diagrama excede a área visível (compatível com pan por arrasto).
- O zoom aplicado por roda **respeita limites mínimo e máximo** coerentes com o produto (alinhados ao intervalo já usado para escala de pré-visualização, sem criar uma segunda “verdade” incompatível).
- O gesto **não deve interferir** com a edição de texto: quando o foco ou o alvo do evento é a **área de código** da mesma Webview, a roda mantém o comportamento actual (por exemplo scroll do código).
- O **pan** (arrastar o diagrama quando maior que o painel) continua disponível. O zoom por roda **mantém o ponto do diagrama sob o cursor** (ajuste de scroll após mudar a escala), em vez de escalar apenas a partir de um canto fixo.
- Comportamento **previsível** em trackpad (se o host mapear scroll para roda) e acessível: alterações de escala perceptíveis mas sem saltos extremos por unidade de scroll.

## Critérios de aceitação

1. Com diagrama visível e ponteiro sobre a área do diagrama, **Ctrl/Cmd + roda** produz **zoom in** e **zoom out** de forma repetível; roda sem modificador mantém o scroll do painel quando aplicável.
2. O zoom fica **dentro dos limites** definidos para a pré-visualização (mínimo/máximo alinhados ao spec de pré-visualização / definição existente).
3. Com o ponteiro sobre a zona de **código** (textarea / painel de texto), a roda **não** aplica zoom ao diagrama da mesma forma que na área do diagrama (mantém-se a distinção de contexto).
4. Após zoom por roda, **pan** e restantes controlos (refresh, export, modos de vista) continuam a funcionar.
5. Documentação de utilizador (README ou texto de definição, conforme política do produto) menciona brevemente o gesto, sem expor detalhes de implementação.

## Fora deste spec

- Sanitização de SVG, temas e estados de carregamento — `specs/preview-rendering/`.
- Valor por defeito e persistência global de `previewZoom` como única fonte de escala — permanecem no domínio de configuração; este spec pode exigir **sincronização** ou **sobreposição temporária** conforme o `plan.md`.
- Exportação para ficheiro — `specs/export-diagram/`.
