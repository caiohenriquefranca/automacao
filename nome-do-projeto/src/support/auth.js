// src/support/auth.js
// Funções de autenticação e gestão de modais iniciais
//
// Funções exportadas:
//   fecharModaisIniciais(page) — fecha modais de notícias, cookies e cadastro incompleto
//   loginSSO(page)             — realiza login GovBr, detecta sessão existente automaticamente

/**
 * Fecha modais que aparecem ao carregar o portal (notícias, cookies, cadastro incompleto).
 * Falha silenciosamente se os modais não estiverem presentes.
 */
async function fecharModaisIniciais(page) {
  // Modal de notícias / novidades
  const btnFecharModal = page.getByRole('button', { name: /[Ff]echar|[Cc]lose/ })
    .or(page.locator('[aria-label="Fechar"]'))
    .or(page.locator('.modal-close, .btn-close'));
  if (await btnFecharModal.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await btnFecharModal.first().click();
    await page.waitForTimeout(500);
  }

  // Modal de cadastro incompleto / complementar perfil
  const btnIgnorar = page.getByRole('button', { name: /[Ii]gnorar|[Aa]gora não|[Dd]epois/ });
  if (await btnIgnorar.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await btnIgnorar.first().click();
    await page.waitForTimeout(300);
  }

  // Banner de cookies
  const btnCookies = page.getByRole('button', { name: /[Aa]ceitar|[Cc]ookies|[Ee]ntendido/ });
  if (await btnCookies.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await btnCookies.first().click();
    await page.waitForTimeout(300);
  }
}

/**
 * Realiza login via SSO GovBr. Se a sessão de auth.json já estiver ativa,
 * detecta automaticamente e pula o fluxo SSO.
 *
 * Requer variáveis de ambiente: USER_CPF, USER_PASSWORD
 */
async function loginSSO(page) {
  const cpf = process.env.USER_CPF;
  const senha = process.env.USER_PASSWORD;

  if (!cpf || !senha) {
    throw new Error('USER_CPF e USER_PASSWORD devem estar definidos no .env');
  }

  await fecharModaisIniciais(page);

  // Verificar se já está autenticado (sessão de auth.json injetada)
  const btnEntrar = page.getByRole('button', { name: 'Entrar' })
    .or(page.getByRole('link', { name: 'Entrar' }));
  const jaLogado = !(await btnEntrar.first().isVisible({ timeout: 3000 }).catch(() => false));

  if (jaLogado) {
    // Sessão ativa — pular SSO
    return;
  }

  // Fluxo SSO completo
  await btnEntrar.first().click();
  await page.waitForURL(/sso.*acesso\.gov\.br/i, { timeout: 20000 });

  // CPF
  const campoCpf = page.getByRole('textbox', { name: /CPF/i })
    .or(page.getByPlaceholder(/CPF/i))
    .or(page.locator('input[name="cpf"]'));
  await campoCpf.first().pressSequentially(cpf.replace(/\D/g, ''), { delay: 80 });
  await page.getByRole('button', { name: /Continuar|Próximo|Next/i }).click();

  // Senha
  const campoSenha = page.locator('input[type="password"]')
    .or(page.getByLabel(/[Ss]enha/));
  await campoSenha.first().pressSequentially(senha, { delay: 80 });
  await page.getByRole('button', { name: /[Ee]ntrar|[Aa]cessar|[Ll]ogin/i }).click();

  // Aguardar retorno ao portal
  await page.waitForURL(/inicio|home|dashboard/i, { timeout: 30000 });
  await page.waitForLoadState('networkidle').catch(() => {});

  await fecharModaisIniciais(page);
}

module.exports = { fecharModaisIniciais, loginSSO };
