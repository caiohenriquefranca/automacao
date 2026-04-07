# Skill — CI/CD com GitHub Actions para Playwright

Use quando precisar configurar execução automática dos testes em pipeline de CI.

---

## 1. Workflow básico

Criar o arquivo `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch: # permite rodar manualmente

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout do repositório
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Instalar dependências
        run: npm ci

      - name: Instalar browsers Playwright
        run: npx playwright install --with-deps chromium

      - name: Criar arquivo .env
        run: |
          cat << EOF > .env
          BASE_URL=${{ secrets.BASE_URL }}
          GESTOR_URL=${{ secrets.GESTOR_URL }}
          ATENDIMENTO_URL=${{ secrets.ATENDIMENTO_URL }}
          USER_CPF=${{ secrets.USER_CPF }}
          USER_PASSWORD=${{ secrets.USER_PASSWORD }}
          EOF

      - name: Restaurar auth.json (sessão SSO)
        run: echo '${{ secrets.AUTH_JSON }}' > auth.json

      - name: Rodar testes Playwright
        run: npx playwright test --reporter=html
        env:
          CI: true

      - name: Upload de artefatos (falhas)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ github.run_id }}
          path: |
            playwright-report/
            test-results/
          retention-days: 7
```

---

## 2. Configurar secrets no GitHub

No repositório: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `BASE_URL` | `https://portal.exemplo.gov.br` |
| `GESTOR_URL` | `https://gestor.exemplo.gov.br` |
| `ATENDIMENTO_URL` | `https://atendimento.exemplo.gov.br` |
| `USER_CPF` | CPF do usuário de teste |
| `USER_PASSWORD` | Senha do usuário |
| `AUTH_JSON` | Conteúdo completo do `auth.json` (JSON em uma linha) |

### Gerar `AUTH_JSON` para o secret

```bash
# Rodar localmente e formatar em uma linha
cat auth.json | tr -d '\n'
# Copiar o output e colar no secret AUTH_JSON
```

> **Atenção**: `auth.json` expira com a sessão SSO. Atualizar o secret periodicamente ou criar workflow de renovação.

---

## 3. playwright.config.js — ajustes para CI

```js
// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: process.env.CI ? 2 : 0,        // 2 tentativas em CI, 0 local
  workers: process.env.CI ? 1 : undefined, // sequencial em CI (sem paralelo)

  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html']],
  
  // ... resto da config
});
```

---

## 4. Cache dos browsers Playwright

```yaml
- name: Cache browsers Playwright
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

- name: Instalar browsers (somente se não estiver em cache)
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps chromium
```

---

## 5. Rodar em paralelo por sistema (matrix)

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        sistema: [portal, gestor, atendimento]

    steps:
      # ... setup ...
      
      - name: Rodar testes do sistema ${{ matrix.sistema }}
        run: npx playwright test src/tests/${{ matrix.sistema }}/
        env:
          CI: true
```

---

## 6. Workflow de renovação do auth.json

Como o auth.json expira, criar um workflow semanal manual:

```yaml
name: Renovar Sessão SSO

on:
  workflow_dispatch: # só manual (CAPTCHA precisa de intervenção humana)
  schedule:
    - cron: '0 8 * * 1' # segunda-feira às 8h (como lembrete)

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Aviso de renovação necessária
        run: |
          echo "::warning::auth.json pode estar expirado. Execute npm run save-auth localmente e atualize o secret AUTH_JSON."
```

---

## 7. Verificar status dos testes no PR

O workflow automaticamente adiciona um check no PR. Para bloquear merge em falha:

No GitHub: **Settings → Branches → Branch protection rules → Require status checks to pass before merging** → selecionar `test`.

---

## Checklist de setup CI

- [ ] Arquivo `.github/workflows/playwright.yml` criado
- [ ] Todos os secrets configurados no repositório
- [ ] `auth.json` gerado localmente e salvo como secret `AUTH_JSON`
- [ ] `playwright.config.js` com `retries: process.env.CI ? 2 : 0`
- [ ] `auth.json` e `.env` no `.gitignore`
- [ ] Workflow rodado manualmente (`workflow_dispatch`) para validar
- [ ] Artefatos de falha visíveis em Actions → Artifacts
