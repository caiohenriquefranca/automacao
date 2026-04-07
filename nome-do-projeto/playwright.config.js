import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './src/tests',

  // Timeout global por teste: 10 minutos
  timeout: 10000 * 60,

  fullyParallel: true,

  // Falhar se test.only ficar no código em CI
  forbidOnly: !!process.env.CI,

  // Retry 2x em CI, nenhum localmente
  retries: process.env.CI ? 2 : 0,

  // Workers: paralelo local, serial em CI
  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    // Projeto de setup: gera/valida auth.json
    {
      name: 'setup',
      testMatch: /portal-login\.spec\.js/,
      use: {
        storageState: undefined,
      },
    },

    // Projeto principal: todos os testes com sessão injetada
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth.json',
      },
      testIgnore: /portal-login\.spec\.js/,
      dependencies: ['setup'],
    },

    // Descomentar para rodar em outros browsers:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], storageState: 'auth.json' },
    //   testIgnore: /portal-login\.spec\.js/,
    //   dependencies: ['setup'],
    // },
  ],
});
