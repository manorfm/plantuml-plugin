# Spec: pré-visualização (Webview)

## Problema

O utilizador precisa de ver o diagrama renderizado junto do código, com aparência coerente com o tema do editor, estados claros (a carregar, sucesso, erro) e capacidade de inspeccionar diagramas maiores que o painel.

## Comportamento esperado

- Ao pedir pré-visualização, o painel mostra primeiro um estado de **carregamento** acessível, depois o diagrama ou uma mensagem de erro legível.
- O diagrama vectorial é apresentado de forma que texto e ligações permaneçam legíveis (não como mera imagem rasterizada comprimida pelo painel).
- Fundo, texto principal, texto secundário e erros seguem tokens visuais do tema do editor (claro, escuro, alto contraste), sem paleta fixa obrigatória em hexadecimal para esse “chrome”.
- O utilizador pode ajustar escala do diagrama dentro do painel conforme configuração.
- Diagramas maiores que a área visível permitem deslocamento (scroll e/ou arrastar) dentro do mesmo painel.
- Erros de rede, timeout, validação do servidor ou preparação de fonte são mostrados no painel de forma segura (sem executar conteúdo arbitrário do servidor).

## Critérios de aceitação

1. Diagrama válido + servidor OK → SVG visível após carregamento.
2. Alternar tema do editor → aparência do painel (chrome) mantém-se coerente.
3. Diagrama inválido ou erro remoto → mensagem legível; extensão estável.
4. `autoRefresh` quando activo → re-render após debounce razoável ao editar o mesmo documento rastreado.
5. Zoom configurável altera a escala apresentada sem quebrar o painel.
6. Conteúdo SVG não executa scripts maliciosos após sanitização.

## Fora deste spec

- Comandos exactos da paleta e persistência de modo de vista — ver spec de modos de vista.
- Protocolo HTTP — ver spec do cliente servidor.
