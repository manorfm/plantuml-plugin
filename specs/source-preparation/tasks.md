# Tasks: preparação do texto fonte

Mapeamento: **S** = [spec.md](./spec.md), **P** = [plan.md](./plan.md).

_Verificado na entrega **0.4.0** (`npm test` — `parseIncludeLine`, `applyDiagramPreamble`)._

## Manutenção e regressão

- [x] **T-SRC-1 (S: aceitação 1–3, P: expandIncludes)** Testes de `parseIncludeLine` / includes na suíte.
- [x] **T-SRC-2 (S: aceitação 4, P: préâmbulo)** Ordem includes → préâmbulo partilhada por preview e export (sem alteração nesta release).
- [x] **T-SRC-3 (S: aceitação 5)** Comportamento `file:` documentado no plan; validação manual pontual quando necessário.

## Evolução

- [ ] **T-SRC-4** `!includeurl` local ou novas sintaxes: spec + plan primeiro.
