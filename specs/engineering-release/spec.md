# Spec: engenharia, qualidade e release

## Problema

O projecto precisa de critérios explícitos para testes, empacotamento e evolução de versão, de forma repetível por humanos e agentes, sem ambiguidade sobre o que constitui uma entrega.

## Comportamento esperado

- Alterações que afectem o produto (código, comportamento, contratos de configuração ou comandos documentados, requisitos de utilizador) incrementam a versão segundo versionamento semântico acordado.
- Cada entrega gera um artefacto instalável `.vsix` cujo nome reflecte a versão em manifesto.
- Existe uma suíte de testes automatizados que valida áreas críticas (cliente HTTP com mocks, utilitários de sinal, parsing de includes, sanitização, fumos da API da extensão).
- **Cobertura:** `npm run test:coverage:unit` (c8 no subset Node) cumpre os limiares em `package.json` → `c8`; o CI falha se não cumprir.
- **Arquitectura (testes estilo ArchUnit):** a suíte Node inclui `architectureImports.test.ts` — valida que módulos acordados (export, registry, formatação, barra de estado) **não** importam `plantumlCustomEditorProvider`; que **`plantuml/rendering/**/*.ts`** também não; que **`serverClient.ts`** não importa o pipeline (`rendering/`); e que **não** existem dependências circulares TypeScript em `src/` (via **madge**, alinhado a `npm run lint:deps`).
- Documentação de utilizador (README) mantém-se coerente com exemplos de instalação e requisitos quando a versão ou o fluxo mudam.

## Critérios de aceitação

1. `npm run compile` e `npm test` passam antes de se considerar uma alteração concluída.
2. `npm run test:coverage:unit` passa (limiares c8 no `package.json`).
3. Para releases, existe ficheiro `plantuml-plugin-manorfm-<versão>.vsix` na raiz após o comando de empacotamento.
4. Versão em `package.json` e exemplos de `.vsix` no README não contradizem-se.
5. Mocks de rede respeitam `AbortSignal` como o `fetch` real.
6. Requisitos de motor PlantUML e privacidade do URL por defeito permanecem documentados ao nível global ou de feature sem contradição.
7. `npm run test:coverage:unit` inclui testes de fronteira de módulo (`architectureImports.test.ts`); novas regras de acoplamento devem ser adicionadas quando o `plan.md` da feature ou `extension-architecture.mdc` o exigirem.

## Fora deste spec

- Comportamento funcional de cada feature (coberto pelos respectivos `spec.md`).
