// src/support/save-auth.js
// Gera auth.json via stealth login — rodar 1x por sessão: npm run save-auth
//
// Uso: npm run save-auth
// Pré-requisitos: .env com BASE_URL, USER_CPF, USER_PASSWORD

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
require('dotenv').config();

chromium.use(StealthPlugin());

(async () => {
  const { BASE_URL, USER_CPF, USER_PASSWORD } = process.env;

  if (!BASE_URL || !USER_CPF || !USER_PASSWORD) {
    console.error('Erro: configure BASE_URL, USER_CPF e USER_PASSWORD no .env');
    process.exit(1);
  }

  console.log('Iniciando stealth login...');
  console.log(`Portal: ${BASE_URL}`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
    slowMo: 80,
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  // Fechar modais iniciais se existirem
  const btnFechar = page.getByRole('button', { name: /[Ff]echar|[Cc]lose/ })
    .or(page.locator('[aria-label="Fechar"]'));
  if (await btnFechar.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await btnFechar.first().click();
  }
  const btnCookies = page.getByRole('button', { name: /[Aa]ceitar|[Cc]ookies/ });
  if (await btnCookies.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btnCookies.click();
  }

  // Clicar em Entrar → redireciona para SSO GovBr
  const btnEntrar = page.getByRole('button', { name: 'Entrar' })
    .or(page.getByRole('link', { name: 'Entrar' }));
  await btnEntrar.first().click();
  await page.waitForURL(/sso.*acesso\.gov\.br/i, { timeout: 20000 });
  console.log('Redirecionado para SSO GovBr');

  // Preencher CPF
  const campoCpf = page.getByRole('textbox', { name: /CPF/i })
    .or(page.getByPlaceholder(/CPF/i))
    .or(page.locator('input[name="cpf"]'));
  await campoCpf.first().pressSequentially(USER_CPF.replace(/\D/g, ''), { delay: 120 });
  await page.getByRole('button', { name: /Continuar|Próximo|Next/i }).click();

  // Aguardar CAPTCHA — o usuário resolve manualmente (60 segundos)
  console.log('');
  console.log('Se aparecer CAPTCHA, resolva manualmente. Aguardando 60 segundos...');
  await page.waitForTimeout(60000);

  // Preencher senha
  const campoSenha = page.locator('input[type="password"]')
    .or(page.getByLabel(/[Ss]enha/));
  await campoSenha.first().pressSequentially(USER_PASSWORD, { delay: 120 });
  await page.getByRole('button', { name: /[Ee]ntrar|[Aa]cessar|[Ll]ogin/i }).click();

  // Aguardar retorno ao portal
  await page.waitForURL(new RegExp(BASE_URL.replace(/https?:\/\//, '')), { timeout: 30000 })
    .catch(() => page.waitForURL(/inicio|home|dashboard/i, { timeout: 30000 }));
  await page.waitForLoadState('networkidle').catch(() => {});

  // Salvar sessão autenticada
  await context.storageState({ path: 'auth.json' });
  console.log('');
  console.log('auth.json gerado com sucesso!');
  console.log('Agora execute: npx playwright test');

  await browser.close();
})();
