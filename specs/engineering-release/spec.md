# Spec: engenharia, qualidade e release

## Problema

O projecto precisa de critérios explícitos para testes, empacotamento e evolução de versão, de forma repetível por humanos e agentes, sem ambiguidade sobre o que constitui uma entrega.

## Comportamento esperado

- Alterações que afectem o produto (código, comportamento, contratos de configuração ou comandos documentados, requisitos de utilizador) incrementam a versão segundo versionamento semântico acordado.
- Cada entrega gera um artefacto instalável `.vsix` cujo nome reflecte a versão em manifesto.
- Existe uma suíte de testes automatizados que valida áreas críticas (cliente HTTP com mocks, utilitários de sinal, parsing de includes, sanitização, fumos da API da extensão).
- Documentação de utilizador (README) mantém-se coerente com exemplos de instalação e requisitos quando a versão ou o fluxo mudam.

## Critérios de aceitação

1. `npm run compile` e `npm test` passam antes de se considerar uma alteração concluída.
2. Para releases, existe ficheiro `plantuml-viewer-<versão>.vsix` na raiz após o comando de empacotamento.
3. Versão em `package.json` e exemplos de `.vsix` no README não contradizem-se.
4. Mocks de rede respeitam `AbortSignal` como o `fetch` real.
5. Requisitos de motor PlantUML e privacidade do URL por defeito permanecem documentados ao nível global ou de feature sem contradição.

## Fora deste spec

- Comportamento funcional de cada feature (coberto pelos respectivos `spec.md`).
