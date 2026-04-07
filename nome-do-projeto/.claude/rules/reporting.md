# Regra — Screenshots, Traces e Relatórios

Artefatos de teste (screenshots, traces, vídeos) devem ser informativos e organizados — nem excessivos nem ausentes.

---

## 1. Quando capturar screenshot

### Capturar (obrigatório)
- **Ponto de resultado final** — sucesso ou falha do fluxo
- **Confirmação de protocolo** — número/mensagem visível
- **Estado de erro inesperado** — para diagnóstico

### NÃO capturar
- Entre cada passo do formulário (ruído, sem valor diagnóstico)
- Em loops (gera dezenas de arquivos inúteis)
- Em `beforeEach` ou `afterEach` por padrão

```js
// Correto — capturar apenas no resultado
await page.getByRole('button', { name: 'Enviar Solicitação' }).click();
await expect(page.getByText('Protocolo gerado')).toBeVisible();
await page.screenshot({
  path: 'test-results/portal-licenca-sanitaria-sucesso.png',
  fullPage: true
});

// Errado — screenshot em cada passo
await preencherCampoTexto(page, 'CNPJ', dados.cnpj);
await page.screenshot({ path: 'test-results/passo-1.png' }); // ❌ desnecessário
```

---

## 2. Nomenclatura de artefatos

Padrão: `[sistema]-[fluxo]-[resultado].png`

```
portal-licenca-sanitaria-sucesso.png
portal-licenca-sanitaria-protocolo.png
gestor-cadastro-empresa-criada.png
gestor-relatorio-exportado.png
atendimento-chamado-aberto.png
sso-login-autenticado.png
```

**Nunca usar:**
- `screenshot.png` (ambíguo)
- `test-1.png`, `passo-3.png` (sem contexto)
- `debug-01.png` (não commitar artefatos de debug)

---

## 3. Traces — quando ligar

### Configuração no `playwright.config.js`

```js
use: {
  // Produção / CI — manter traces apenas nas falhas
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

### Localmente para debug ativo

```bash
# Gravar trace de execução específica
npx playwright test src/tests/portal/licenca.spec.js --trace on

# Abrir trace após execução
npx playwright show-trace test-results/licenca-chromium/trace.zip
```

**Regra:** nunca commitar `trace: 'on'` no `playwright.config.js` — é modo de debug local.

---

## 4. Organização dos artefatos por sistema

Configurar `outputDir` por sistema para facilitar navegação:

```js
// playwright.config.js — organizar por sistema
projects: [
  {
    name: 'portal',
    testDir: './src/tests/portal',
    outputDir: './test-results/portal',
  },
  {
    name: 'gestor',
    testDir: './src/tests/gestor',
    outputDir: './test-results/gestor',
  },
]
```

---

## 5. Relatório HTML

```bash
# Gerar e abrir relatório HTML após execução
npx playwright test --reporter html
npx playwright show-report

# No playwright.config.js para CI (não abrir automaticamente)
reporter: process.env.CI
  ? [['github'], ['html', { open: 'never' }]]
  : [['list'], ['html', { open: 'on-failure' }]],
```

O relatório HTML mostra:
- Status de cada test (pass/fail/skip)
- Duração por teste
- Screenshots e traces inline (clicáveis)
- Filtros por sistema/arquivo

---

## 6. O que NÃO commitar

```gitignore
# Já no .gitignore — confirmar que inclui:
test-results/
playwright-report/
*.png
*.zip
*.webm
```

---

## 7. Limpeza de artefatos antigos

```bash
# Limpar test-results antes de nova execução (evitar confusão com artefatos antigos)
rm -rf test-results/
npx playwright test

# Ou adicionar ao package.json
"scripts": {
  "test:clean": "rm -rf test-results/ && playwright test"
}
```

---

## Checklist de reporting

- [ ] Screenshot apenas no resultado final do fluxo
- [ ] Nome segue padrão `[sistema]-[fluxo]-[resultado].png`
- [ ] `playwright.config.js` com `screenshot: 'only-on-failure'` e `trace: 'retain-on-failure'`
- [ ] `test-results/` e `playwright-report/` no `.gitignore`
- [ ] CI configurado para upload de artefatos em caso de falha
