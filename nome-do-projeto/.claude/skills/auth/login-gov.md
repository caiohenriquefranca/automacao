# Skill: Autenticação GovBr — Bypass Stealth

## Visão Geral

O portal usa GovBr SSO (`sso.acesso.gov.br`) que bloqueia automação com CAPTCHA. A solução é uma estratégia em dois tempos:

1. **Stealth Login (1x por sessão):** `npm run save-auth` → gera `auth.json`
2. **Reuso de Sessão (todos os testes):** `auth.json` injetado via `storageState`

---

## Fluxo Completo

```
npm run save-auth
      ↓
  Navegador visível (headless: false)
  StealthPlugin ativo
  Usuário resolve CAPTCHA manualmente (60s)
      ↓
  auth.json gerado (cookies + localStorage)
      ↓
npx playwright test (todos os testes)
  → storageState: 'auth.json' injetado
  → loginSSO() detecta sessão existente e pula SSO
```

---

## Técnicas Stealth Aplicadas

```js
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

const browser = await chromium.launch({
  headless: false,
  args: ['--disable-blink-features=AutomationControlled'],
  slowMo: 80,
});

const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
});

await context.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
});
```

---

## save-auth.js — Estrutura Completa

```js
// src/support/save-auth.js
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
require('dotenv').config();

chromium.use(StealthPlugin());

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    slowMo: 80,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();
  await page.goto(process.env.BASE_URL);

  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/sso.*acesso\.gov\.br/i, { timeout: 20000 });

  const campoCpf = page.getByRole('textbox', { name: /CPF/i })
    .or(page.getByPlaceholder(/CPF/i));
  await campoCpf.first().pressSequentially(process.env.USER_CPF, { delay: 120 });
  await page.getByRole('button', { name: /Continuar|Próximo/i }).click();

  // Aguardar resolução manual de CAPTCHA (60s)
  await page.waitForTimeout(60000);

  const campoSenha = page.getByRole('textbox', { name: /[Ss]enha/i })
    .or(page.locator('input[type="password"]'));
  await campoSenha.first().pressSequentially(process.env.USER_PASSWORD, { delay: 120 });
  await page.getByRole('button', { name: /[Ee]ntrar|[Aa]cessar/i }).click();

  await page.waitForURL(/inicio|home/i, { timeout: 30000 });
  await page.waitForLoadState('networkidle').catch(() => {});

  await context.storageState({ path: 'auth.json' });
  console.log('auth.json gerado com sucesso!');
  await browser.close();
})();
```

---

## auth.js — Funções de Suporte

```js
// src/support/auth.js

async function fecharModaisIniciais(page) {
  const btnFechar = page.getByRole('button', { name: /[Ff]echar|[Cc]lose/ })
    .or(page.locator('[aria-label="Fechar"]'));
  if (await btnFechar.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await btnFechar.first().click();
  }

  const btnIgnorar = page.getByRole('button', { name: /[Ii]gnorar|[Aa]gora não/ });
  if (await btnIgnorar.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btnIgnorar.click();
  }

  const btnCookies = page.getByRole('button', { name: /[Aa]ceitar|[Cc]ookies/ });
  if (await btnCookies.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btnCookies.click();
  }
}

async function loginSSO(page) {
  await fecharModaisIniciais(page);

  const btnEntrar = page.getByRole('button', { name: 'Entrar' });
  const jaLogado = !(await btnEntrar.isVisible({ timeout: 3000 }).catch(() => false));
  if (jaLogado) return;

  await btnEntrar.click();
  await page.waitForURL(/sso.*acesso\.gov\.br/i, { timeout: 20000 });

  const campoCpf = page.getByRole('textbox', { name: /CPF/i })
    .or(page.getByPlaceholder(/CPF/i));
  await campoCpf.first().pressSequentially(process.env.USER_CPF, { delay: 80 });
  await page.getByRole('button', { name: /Continuar|Próximo/i }).click();

  const campoSenha = page.locator('input[type="password"]');
  await campoSenha.pressSequentially(process.env.USER_PASSWORD, { delay: 80 });
  await page.getByRole('button', { name: /[Ee]ntrar|[Aa]cessar/i }).click();

  await page.waitForURL(/inicio|home/i, { timeout: 30000 });
  await page.waitForLoadState('networkidle').catch(() => {});
}

module.exports = { fecharModaisIniciais, loginSSO };
```

---

## playwright.config.js — Projetos com Auth

```js
projects: [
  {
    name: 'setup',
    testMatch: /portal-login\.spec\.js/,
    use: { storageState: undefined },
  },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'auth.json',
    },
    testIgnore: /portal-login\.spec\.js/,
    dependencies: ['setup'],
  },
]
```

---

## Quando Regenerar auth.json

- Testes falham com "botão Entrar não encontrado" inesperadamente
- Portal retorna para tela de login no meio do teste
- Após expiração de cookies (geralmente alguns dias)

```bash
npm run save-auth
```

---

## Variáveis de Ambiente Necessárias

```env
BASE_URL=https://portal.exemplo.gov.br
USER_CPF=000.000.000-00
USER_PASSWORD=suaSenhaAqui
```
