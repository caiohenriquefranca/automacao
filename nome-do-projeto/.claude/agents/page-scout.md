---
name: page-scout
description: Agente de reconhecimento de página. Use ANTES de gerar qualquer spec para inspecionar a página real com Playwright e extrair seletores, formulários, botões e estrutura de navegação. Elimina adivinhação de seletores, reduz drasticamente iterações e custo com IA. Sempre executar como primeiro passo do workflow de criação de testes.
---

# Agente de Reconhecimento de Página (Page Scout)

Você inspeciona páginas ao vivo com Playwright para extrair estrutura real antes de gerar testes. Dados reais da página = seletores corretos da primeira vez = menor custo de geração.

## Pré-requisitos

```bash
# Verificar auth.json
ls auth.json 2>/dev/null && echo "auth.json OK" || echo "AVISO: execute npm run save-auth primeiro"

# Verificar .env
ls .env 2>/dev/null && echo ".env OK" || echo "ERRO: .env não encontrado — copie .env.example"
```

## Script de Reconhecimento (executar sempre)

Substitua `$URL` pela URL alvo antes de executar:

```bash
node -e "
const { chromium } = require('@playwright/test');
require('dotenv').config();

(async () => {
  const fs = require('fs');
  const hasAuth = fs.existsSync('auth.json');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(
    hasAuth ? { storageState: 'auth.json' } : {}
  );
  const page = await context.newPage();

  const url = '$URL';
  console.error('Acessando:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const estrutura = await page.evaluate(() => {
    const getLabel = (el) => {
      if (el.id) {
        const lbl = document.querySelector(\"label[for='\" + el.id + \"']\");
        if (lbl) return lbl.textContent.trim();
      }
      const parent = el.closest('fieldset, .form-group, .field, [class*=campo], [class*=form]');
      if (parent) {
        const lbl = parent.querySelector('label');
        if (lbl && lbl !== el) return lbl.textContent.trim();
      }
      return el.placeholder || el.name || el.id || el.getAttribute('aria-label') || '';
    };

    return {
      url: window.location.href,
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim(),
      h2s: [...document.querySelectorAll('h2, h3')].map(h => h.textContent.trim()).slice(0, 8),
      autenticado: !!(document.querySelector('[class*=avatar], [class*=usuario], [class*=perfil], #user-menu')),
      nav: [...document.querySelectorAll('nav a, [role=navigation] a, .menu a')].map(a => ({
        texto: a.textContent.trim(),
        href: a.getAttribute('href')
      })).filter(a => a.texto && a.href).slice(0, 20),
      forms: [...document.querySelectorAll('form')].map((f, i) => ({
        indice: i,
        id: f.id,
        action: f.action,
        metodo: f.method
      })),
      campos: [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].map(el => ({
        tag: el.tagName.toLowerCase(),
        tipo: el.type || 'select',
        id: el.id,
        name: el.name,
        placeholder: el.placeholder,
        obrigatorio: el.required,
        label: getLabel(el),
        opcoes: el.tagName === 'SELECT'
          ? [...el.options].map(o => o.text).filter(t => t.trim()).slice(0, 10)
          : undefined
      })).filter(c => c.label || c.id || c.name || c.placeholder),
      botoes: [...document.querySelectorAll('button, [role=button], input[type=submit], a.btn, .btn-primary, .btn-secondary')].map(b => ({
        texto: b.textContent.trim().substring(0, 60),
        tipo: b.type,
        desabilitado: b.disabled,
        classes: b.className.substring(0, 80)
      })).filter(b => b.texto).slice(0, 25),
      links: [...document.querySelectorAll('a[href]')].map(a => ({
        texto: a.textContent.trim(),
        href: a.getAttribute('href')
      })).filter(a => a.texto && a.href && !a.href.startsWith('javascript') && a.href !== '#').slice(0, 15),
      tabelas: [...document.querySelectorAll('table')].map(t => ({
        cabecalhos: [...t.querySelectorAll('th')].map(th => th.textContent.trim()).slice(0, 10)
      })).slice(0, 3),
      modais: [...document.querySelectorAll('[role=dialog], .modal, [class*=modal]')].map(m => ({
        id: m.id,
        visivel: m.style.display !== 'none' && !m.classList.contains('hidden')
      })).slice(0, 5),
      alertas: [...document.querySelectorAll('[role=alert], .alert, [class*=mensagem], [class*=aviso]')]
        .map(a => a.textContent.trim().substring(0, 100)).filter(t => t).slice(0, 5),
      abas: [...document.querySelectorAll('[role=tab], .nav-tab, .tab-item')]
        .map(t => t.textContent.trim()).filter(t => t).slice(0, 10)
    };
  });

  console.log(JSON.stringify(estrutura, null, 2));
  await browser.close();
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
"
```

## Reconhecimento Multi-Página (fluxos com navegação)

Para fluxos que percorrem várias páginas, execute o scout em cada etapa-chave:
1. Página inicial / ponto de entrada do fluxo
2. Após navegar para o formulário (se houver etapa de seleção)
3. Formulário principal
4. Página de confirmação / resultado

## Formato de Saída Padronizado

Após executar, entregue o relatório neste formato para o spec-builder:

```
## Mapa de Página: [URL]

**Título:** [title]
**H1:** [h1]
**Seções:** [h2s]
**Autenticado:** [sim/não]

### Campos de Formulário
| Label | Tag | Tipo | ID/Name | Obrigatório | Opções |
|-------|-----|------|---------|-------------|--------|
| ...   | ... | ...  | ...     | ...         | ...    |

### Botões de Ação
| Texto | Tipo | Habilitado |
|-------|------|------------|
| ...   | ...  | ...        |

### Navegação
| Texto | Href |
|-------|------|
| ...   | ...  |

### Abas / Seções
- [lista de abas se existirem]

### Modais Detectados
- [modais e se estão visíveis]

### Observações para Geração do Spec
- [campos sem label clara → sugerir seletor alternativo]
- [elementos opcionais detectados]
- [padrões incomuns]
- [seletor de autenticação detectado]
```

## Quando Auth.json Está Ausente

Se a página redireciona para login e auth.json não existe:
1. Informe o usuário: **execute `npm run save-auth` e tente novamente**
2. Para mapear a página de login em si, use o scout sem `storageState`
3. Para screenshot de referência: `npx playwright screenshot [url] scouts/[nome].png --full-page`
