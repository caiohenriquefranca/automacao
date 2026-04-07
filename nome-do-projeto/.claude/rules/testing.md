# Padrões Playwright — Regras de Teste

## Hierarquia de Seletores

Use na ordem de preferência (mais estável para menos estável):

```js
// 1. PREFERIDO — semântico e acessível
page.getByRole('button', { name: 'Solicitar' })
page.getByRole('textbox', { name: /CPF/i })

// 2. BOM — campos de formulário
page.getByLabel('E-mail')

// 3. ACEITÁVEL — texto visível único
page.getByText('Protocolo gerado com sucesso')

// 4. FALLBACK — XPath por label (portais sem semântica)
page.locator('//label[contains(.,"CNPJ")]/parent::div//input')

// 5. ÚLTIMO RECURSO — CSS (frágil, evitar)
page.locator('.btn-primary')
```

### Padrão `.or()` para campos com múltiplos seletores possíveis

```js
const campo = page.getByRole('textbox', { name: /CPF/i })
  .or(page.getByPlaceholder(/CPF/i));
await campo.first().pressSequentially(cpf, { delay: 80 });
```

---

## Estratégias de Espera

**Nunca use `waitForTimeout()` arbitrário.** Exceção: debounces conhecidos (ex.: preenchimento automático de CEP), máximo 1500ms, sempre comentado.

| Situação | Use |
|----------|-----|
| Após click que navega | `await page.waitForURL(/pattern/)` |
| Elemento deve aparecer | `await expect(el).toBeVisible({ timeout: 10000 })` |
| Após `page.goto()` | `await page.waitForLoadState('domcontentloaded')` |
| Aguardar resposta de API | `await page.waitForLoadState('networkidle')` |
| Mudança de estado do elemento | `await el.waitFor({ state: 'visible' })` |

---

## Elementos Opcionais (Anti-Flakiness)

```js
// CORRETO — silencioso se não existir
if (await elemento.isVisible({ timeout: 3000 }).catch(() => false)) {
  await elemento.click();
}

// EVITAR — lança erro se não existir
await page.locator('#modal-fechar').click();
```

---

## Timeouts

```js
test.setTimeout(300000);  // 5 min — fluxo completo (upload, assinatura)
test.setTimeout(180000);  // 3 min — fluxo parcial
// Global: 10 min (playwright.config.js) — smoke tests
```

---

## Estrutura Obrigatória de Todo Spec

```js
const { test, expect } = require('@playwright/test');
const { fecharModaisIniciais, loginSSO } = require('../../support/auth');
const { preencherCampoTexto, uploadPorLabel } = require('../../support/form');

test.setTimeout(300000);

test.describe('Nome do Serviço — Módulo', () => {

  test.beforeEach(async ({ page }) => {
    const resposta = await page.goto('/');
    expect(resposta && resposta.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/Início \| Portal/);
    await page.waitForTimeout(2000);
    await fecharModaisIniciais(page);
  });

  test('fluxo completo — descrição', async ({ page }) => {
    await loginSSO(page);
    await fecharModaisIniciais(page);
    // ... passos do teste
  });
});
```

---

## Asserções

- Sempre use `expect()` do Playwright
- Nunca use `if` como validação de teste
- Para múltiplos resultados válidos, use `Promise.race()`

```js
// CORRETO
await expect(page.getByText(/sucesso|protocolo/i)).toBeVisible({ timeout: 30000 });

// ERRADO
if (await page.getByText('Sucesso').isVisible()) { /* sem expect */ }
```

---

## Campos Mascarados (CNPJ, CPF, Telefone)

```js
// Use pressSequentially com delay para simular digitação humana
await campo.pressSequentially('12345678000195', { delay: 80 });
```

---

## Screenshots de Evidência

```js
// Apenas em pontos de resultado relevantes
await page.screenshot({
  path: 'test-results/nome-servico-sucesso.png',
  fullPage: true
});
```

---

## Uploads de Arquivo

Sempre use `uploadPorLabel()` do `support/form.js`. Nunca acesse `input[type=file]` diretamente sem o helper.

```js
const docs = {
  cnpj: path.resolve(__dirname, '../../fixtures/documents/cnpj.pdf'),
};
await uploadPorLabel(page, 'Documento CNPJ', docs.cnpj);
```

---

## Organização de Arquivos

| Local | Padrão | Exemplo |
|-------|--------|---------|
| `tests/subpasta/` | `camelCase.spec.js` | `cadastroEmpresa.spec.js` |
| `tests/` (raiz) | `kebab-case.spec.js` | `portal-login.spec.js` |
| `support/` | `camelCase.js` | `auth.js`, `form.js` |

---

## Sistema de Módulos

- **Specs e `support/`:** CommonJS (`require` / `module.exports`)
- **`playwright.config.js`:** ESM (`import` / `export default`)
