# Testing

## Commands

| Command | Purpose |
|--------|---------|
| `npm test` | Full suite in the **Extension Development Host** (`@vscode/test-electron`): all `src/test/suite/*.test.ts` files. |
| `npm run test:coverage:unit` | **Node + Mocha + c8** on modules that do not require `vscode` at load time. Writes `coverage/lcov.info` (gitignored). Fails if coverage is below `package.json` → `c8`. |

## Test pyramid

| Layer | What runs | Role |
|-------|-----------|------|
| **Unit** | Same subset as `test:coverage:unit` | Pure logic, config normalization, HTML builders, client helpers, mocks where needed. |
| **Integration** | `fetch` mocks in the unit runner | SVG/PNG paths, GET/POST fallback, timeouts, error hints. |
| **Extension Host** | `npm test` | Real `vscode` API: includes, editor detection, extension smoke. |

## Agents and CI

- Cursor: `.cursor/rules/test-coverage.mdc` (with `src/**` changes: tests + `compile` + `npm test` + `npm run test:coverage:unit`).
- Spec: `specs/engineering-release/spec.md`.
- GitHub Actions: `.github/workflows/ci.yml` runs `compile`, `npm test`, and `npm run test:coverage:unit` on push/PR to `main`/`master`.

Limiares globais do subset instrumentado estão em `package.json` → secção `c8`; ajustá-los apenas em conjunto com alterações à suíte ou ao conjunto de ficheiros incluídos.
