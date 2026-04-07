# Skill: Setup Playwright — Criação de Novo Projeto

## Inicialização

```bash
mkdir -p src/support src/fixtures/documents src/tests
touch src/support/auth.js src/support/form.js src/support/save-auth.js
npm install
npx playwright install chromium
```

---

## package.json

```json
{
  "name": "nome-do-projeto-pw",
  "version": "1.0.0",
  "scripts": {
    "save-auth": "node src/support/save-auth.js",
    "test": "playwright test",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0",
    "@types/node": "^24.0.0",
    "dotenv": "^17.0.0"
  },
  "dependencies": {
    "faker-br": "^0.5.0",
    "playwright-extra": "^4.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2"
  }
}
```

---

## playwright.config.js (ESM)

```js
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './src/tests',
  timeout: 10000 * 60,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,    // 2 retries em CI, 0 local
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',         // trace apenas em falhas
    screenshot: 'only-on-failure',      // screenshot apenas em falhas
    video: 'retain-on-failure',         // vídeo apenas em falhas
  },

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
  ],
});
```

---

## .env.example

```env
BASE_URL=https://portal.exemplo.gov.br
USER_CPF=
USER_PASSWORD=
CODIGO_ASSINATURA=
```

---

## .gitignore

```gitignore
node_modules/
.env
auth.json
playwright-report/
test-results/
```

---

## Checklist de Novo Projeto

- [ ] Copiar `src/support/auth.js`, `form.js`, `save-auth.js` do template
- [ ] Configurar `playwright.config.js` com `testDir: './src/tests'`
- [ ] Confirmar `retries: process.env.CI ? 2 : 0` no config
- [ ] Confirmar `screenshot: 'only-on-failure'` e `trace: 'retain-on-failure'` no config
- [ ] Criar `.env` a partir de `.env.example`
- [ ] Rodar `npm run save-auth` para gerar `auth.json`
- [ ] Adicionar `auth.json` e `test-results/` ao `.gitignore`
- [ ] Rodar `npx playwright test --headed` para validar setup

## Checklist de Novo Teste

- [ ] Criar `src/tests/[modulo]/nomeServico.spec.js`
- [ ] Importar `fecharModaisIniciais` e `loginSSO` de `../../support/auth`
- [ ] Importar helpers necessários de `../../support/form`
- [ ] Adicionar variáveis de ambiente ao `.env` e `.env.example`
- [ ] Adicionar PDFs de fixture em `src/fixtures/documents/`
- [ ] Verificar seletores com `--headed --debug` (Playwright Inspector)

## Manutenção contínua

```bash
# Renovar sessão SSO (quando auth.json expirar)
npm run save-auth

# Limpar artefatos de execuções anteriores
rm -rf test-results/ playwright-report/

# Atualizar browsers Playwright
npx playwright install chromium

# Verificar sessão antes de rodar
# Ver comando /check-auth
```

**Sinais de que o auth.json expirou:**
- Testes redirecionam para a página de login
- Erro `net::ERR_ABORTED` em navegações autenticadas
- `loginSSO()` fica aguardando o botão "Entrar" que nunca aparece
