---
name: vscode-extension-testing
description: Testes de extensões VS Code com @vscode/test-electron, Mocha e vscode-test (CI local). Use ao adicionar ou alterar testes em src/test/**, .vscode-test.mjs, ou scripts de teste no package.json.
---

# Testes de extensão VS Code

## Quando usar

Ao implementar **Fase C** da `SPECIFICATION.md` ou ao regressar bugs na extensão.

## Stack recomendada

| Pacote | Função |
|--------|--------|
| `@vscode/test-electron` | Download do VS Code, execução da suíte no Extension Host |
| `mocha` | Runner de testes |
| `@types/mocha`, `@types/vscode` | Tipos |

Adicionar a `devDependencies` quando criar a pasta de testes.

## Estrutura típica

```
src/test/
  runTest.ts          # bootstrap @vscode/test-electron
  suite/
    extension.test.ts
```

- **Testes de integração:** ativar extensão, executar comandos com `vscode.commands.executeCommand`, asserções sobre estado ou mocks.
- **Testes unitários** (encoding PlantUML, URL helpers, `debounce`, cache): podem correr com Node puro + Mocha + **c8** (`npm run test:coverage:unit`) sem Extension Host, quando o módulo não faz `require('vscode')` ao carregar.

## Scripts em `package.json`

- **`npm test`** — `node ./dist/test/runTest.js` (Extension Host, suíte completa).
- **`npm run test:coverage:unit`** — compile + **c8** + Mocha sobre o subset listado no script; **`check-coverage`** e limiares estão em `package.json` → secção `c8`. Inclui **`architectureImports.test.ts`**: regras tipo ArchUnit (imports proibidos para `plantumlCustomEditorProvider` em módulos do registo de sessão) e **madge** sem ciclos em `src/`. Deve passar após alterações em `src/**` (ver `.cursor/rules/test-coverage.mdc`).

Compilar `src/test` com o mesmo `tsconfig` — [@vscode/test-electron](https://github.com/microsoft/vscode-test).

## Boas práticas

- Timeout generoso em CI para download do VS Code.
- Evitar testes que dependem de rede externa sem mock; servidor PlantUML pode ser mockado ou omitido em testes unitários do cliente HTTP.
- Ao mockar `globalThis.fetch`, **respeitar `AbortSignal`** (`init.signal`): registar `abort` e rejeitar com `AbortError` quando o pedido for cancelado ou expirar o timeout — caso contrário testes de timeout ficam inválidos.
- Limpar recursos criados nos testes (editores, painéis) quando aplicável; restaurar `fetch` original em `suiteTeardown` / `after`.

## Referência

- [Teste de extensões](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
