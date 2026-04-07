# Estilo de Código

## Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Funções de domínio | `camelCase` português | `fecharModaisIniciais`, `loginSSO` |
| Funções utilitárias | `camelCase` | `uploadPorLabel`, `preencherCampoTexto` |
| Constantes de config | `SCREAMING_SNAKE_CASE` | `BASE_URL`, `CODIGO_ASSINATURA` |
| Objetos de dados de teste | `camelCase` | `empresa`, `endereco`, `docs` |
| Arquivos spec em subpasta | `camelCase.spec.js` | `cadastroEmpresa.spec.js` |
| Arquivos spec na raiz | `kebab-case.spec.js` | `portal-login.spec.js` |
| Módulos de suporte | `camelCase.js` | `auth.js`, `form.js` |

## Sistema de Módulos

```js
// Specs e support/ — CommonJS
const { test, expect } = require('@playwright/test');
const { loginSSO } = require('../../support/auth');
module.exports = { minhaFuncao };

// playwright.config.js — ESM apenas
import { defineConfig } from '@playwright/test';
export default defineConfig({ ... });
```

## Comentários

- Adicione comentário apenas onde a lógica não é óbvia
- Documente o motivo de `waitForTimeout` quando necessário: `// debounce do CEP (~800ms)`
- Sem JSDoc em helpers internos — o nome da função deve ser auto-explicativo

## Constantes no Topo do Arquivo

```js
test.setTimeout(300000);

const SERVICO = 'Nome do Serviço';
const CODIGO_ASSINATURA = process.env.CODIGO_ASSINATURA || '555555';

const empresa = { /* dados de teste */ };
const docs = { cnpj: path.resolve(__dirname, '../../fixtures/documents/cnpj.pdf') };
```

## Helpers de Suporte

- Sempre checar `src/support/` antes de criar novo helper
- Funções de suporte devem falhar silenciosamente (retornar `false`) para elementos opcionais
- Nunca lançar exceção em helpers para elementos que podem não existir
