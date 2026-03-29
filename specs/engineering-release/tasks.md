# Tasks: engenharia, qualidade e release

Mapeamento: **S** = [spec.md](./spec.md), **P** = [plan.md](./plan.md).

_Última verificação documentada: release **0.10.7** (ID `manorfm.plantuml-plugin-manorfm`, artefacto `plantuml-plugin-manorfm-0.10.7.vsix`)._

## Cada alteração de produto

- [x] **T-REL-1 (S: aceitação 2–3, P: vsce)** `version` 0.10.7; `main` → `./dist/extension.js`; `npm run vscode:package` / `npm run vsix` → `plantuml-plugin-manorfm-0.10.7.vsix`.
- [x] **T-REL-2 (S: aceitação 3)** README e `CHANGELOG.md` alinhados com publisher/repo `manorfm` / `plantuml-plugin`.
- [x] **T-REL-3 (S: aceitação 1, P: testes)** `npm run compile` e `npm test` sem falhas (executado na entrega).

## Manutenção contínua

- [x] **T-REL-4 (S: aceitação 4, P: mocks)** Testes de `fetch` em `serverClient` mantidos e a passar.
- [x] **T-REL-5 (S: aceitação 5)** Política URL por defeito documentada em spec global + `plantuml-server-client`.

## Artefactos opcionais

- [x] **T-REL-6** `examples/architecture.puml` actualizado para v0.4.0.

## Próximas entregas

Repetir **T-REL-1–3** sempre que houver nova release de produto.
