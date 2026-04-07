// src/tests/portal-login.spec.js
// Projeto: setup — gera auth.json com sessão autenticada
// Rodar isoladamente via: npm run save-auth
// Este spec é executado pelo projeto 'setup' do playwright.config.js

const { test, expect } = require('@playwright/test');
const { fecharModaisIniciais } = require('../support/auth');

test.setTimeout(180000);

test('autenticação — gerar sessão auth.json', async ({ page }) => {
  const resposta = await page.goto('/');
  expect(resposta && resposta.ok()).toBeTruthy();

  await page.waitForLoadState('domcontentloaded');
  await fecharModaisIniciais(page);

  const cpf = process.env.USER_CPF;
  const senha = process.env.USER_PASSWORD;

  if (!cpf || !senha) {
    throw new Error('USER_CPF e USER_PASSWORD devem estar definidos no .env');
  }

  // Entrar via SSO GovBr
  const btnEntrar = page.getByRole('button', { name: 'Entrar' })
    .or(page.getByRole('link', { name: 'Entrar' }));
  await btnEntrar.first().click();
  await page.waitForURL(/sso.*acesso\.gov\.br/i, { timeout: 20000 });

  // CPF
  const campoCpf = page.getByRole('textbox', { name: /CPF/i })
    .or(page.getByPlaceholder(/CPF/i));
  await campoCpf.first().pressSequentially(cpf.replace(/\D/g, ''), { delay: 100 });
  await page.getByRole('button', { name: /Continuar|Próximo/i }).click();

  // Aguardar CAPTCHA se necessário (60s para resolução manual)
  await page.waitForTimeout(60000);

  // Senha
  const campoSenha = page.locator('input[type="password"]');
  await campoSenha.pressSequentially(senha, { delay: 100 });
  await page.getByRole('button', { name: /[Ee]ntrar|[Aa]cessar/i }).click();

  // Verificar autenticação bem-sucedida
  await page.waitForURL(/inicio|home|dashboard/i, { timeout: 30000 });
  await page.waitForLoadState('networkidle').catch(() => {});

  await fecharModaisIniciais(page);

  // Confirmar que está logado (avatar, nome ou área do usuário visível)
  const estaLogado = await page.getByRole('button', { name: /[Pp]erfil|[Uu]suário|[Mm]eu/ })
    .or(page.locator('[data-testid="user-menu"], .user-avatar, .user-name'))
    .first()
    .isVisible({ timeout: 10000 })
    .catch(() => false);

  expect(estaLogado, 'Usuário deve estar autenticado no portal').toBeTruthy();

  await page.screenshot({ path: 'test-results/login-sucesso.png', fullPage: false });
});
