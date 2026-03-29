# Spec: exportação de diagrama

## Problema

O utilizador precisa de guardar o diagrama actual como ficheiro SVG ou PNG para partilha ou arquivo, usando o mesmo servidor e a mesma lógica de preparação de texto que a pré-visualização.

## Comportamento esperado

- Comando dedicado inicia um fluxo de escolha de formato (SVG ou PNG) e local de gravação.
- O conteúdo exportado reflecte o texto actual do documento após preparação de fonte (includes e préâmbulo), tal como na pré-visualização.
- A gravação usa a API de sistema de ficheiros do workspace; erros de escrita ou de rede são comunicados sem crash.
- Exportação requer documento persistido em disco quando o plano técnico exige URI `file:` para semântica correcta.

## Critérios de aceitação

1. Com servidor acessível e diagrama válido, o utilizador obtém ficheiro SVG ou PNG conforme escolha.
2. Includes e préâmbulo reflectem-se no ficheiro exportado.
3. Falha do servidor ou corpo inválido → mensagem clara, sem estado corrupto silencioso.
4. Cancelamento pelo utilizador no diálogo não deixa a extensão num estado inconsistente.

## Fora deste spec

- Pré-visualização em tempo real.
- Modos de vista.
