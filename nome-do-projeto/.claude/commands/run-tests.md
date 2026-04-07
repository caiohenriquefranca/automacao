# /run-tests — Executar Testes Playwright

Executa os testes do projeto e exibe o resultado.

## Uso

```
/run-tests [arquivo] [--headed] [--grep "nome do teste"] [--debug]
```

## Comportamento

Quando invocado, execute o comando correspondente:

**Todos os testes:**
```bash
npx playwright test
```

**Arquivo específico:**
```bash
npx playwright test src/tests/[modulo]/arquivo.spec.js
```

**Com interface visual:**
```bash
npx playwright test --headed
```

**Filtrar por nome:**
```bash
npx playwright test --grep "fluxo completo"
```

**Modo debug (Playwright Inspector):**
```bash
npx playwright test --debug
```

**Com trace (para diagnóstico de falhas):**
```bash
# Grava trace apenas nas falhas — recomendado para uso regular
npx playwright test --trace retain-on-failure

# Grava trace sempre — usar apenas para debug específico
npx playwright test src/tests/portal/meuTeste.spec.js --trace on
```

**Com retries (simular comportamento de CI):**
```bash
npx playwright test --retries 2
```

**Relatório HTML:**
```bash
# Gerar relatório e abrir no browser
npx playwright test --reporter html
npm run report

# Ou apenas abrir o último relatório gerado
npm run report
```

**Sistema específico:**
```bash
npx playwright test src/tests/portal/
npx playwright test src/tests/gestor/
npx playwright test src/tests/atendimento/
```

## Após Execução

1. Exiba o resumo dos resultados (passou/falhou/ignorado)
2. Se houver falhas, mostre os erros relevantes
3. Sugira `npm run report` para relatório visual detalhado
4. Se falhar por sessão expirada, oriente: `/check-auth` → `npm run save-auth`
5. Para diagnosticar falhas específicas, orientar: `/fix-test src/tests/[sistema]/[arquivo].spec.js`
