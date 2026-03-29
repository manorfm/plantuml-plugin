# Plan: engenharia, qualidade e release

**Spec de referência:** [spec.md](./spec.md)

## Arquitectura

- **Compilação:** TypeScript → `dist/`, entrada da extensão aponta para `dist/extension.js`.
- **Testes:** `@vscode/test-electron` + Mocha; ficheiros em `src/test/suite/`.
- **Pacote:** `vsce package` (script `vscode:package`), `.vscodeignore` controla conteúdo do VSIX; dependência `plantuml-encoder` deve estar presente no pacote.

## Decisões técnicas

| Decisão | Justificativa |
|---------|----------------|
| SemVer em `package.json` | Contrato com utilizadores e marketplace. |
| PATCH vs MINOR em `0.y.z` | Política descrita no documento global (resumo abaixo). |
| `plantuml/plantumlConnectionSettings.ts` | Normalização de settings sem `vscode`; `plantumlConfig.ts` delega — testável no subset Node + c8. |

## Trade-offs

- Testes de integração real contra servidor PlantUML opcionais: reduzem flakiness em CI; validação manual ou ambiente dedicado para e2e.

## Resumo SemVer (detalhe normativo no documento global)

- **MAJOR:** incompatibilidades.
- **MINOR:** funcionalidades compatíveis.
- **PATCH:** correcções, mensagens, documentação sem mudança de contrato.

## Módulos de referência

- `package.json`, `.vscodeignore` (exclui `specs/**`, `SPECIFICATION.md`, `coverage/**`, `.github/**`, `dist/test/**` do VSIX), `src/test/runTest.ts`, scripts npm.

## Dependências

- Todas as features para conteúdo funcional dos testes.
