# Comando /check-auth

Verifica se o arquivo `auth.json` existe e se a sessão SSO ainda está válida antes de rodar os testes.

---

## Sintaxe

```
/check-auth
```

Sem parâmetros — sempre verifica o `auth.json` do projeto atual.

---

## O que este comando faz

1. Verifica se `auth.json` existe no diretório raiz do projeto
2. Lê os cookies e verifica se há `expires` no futuro
3. Verifica se o token/cookie principal do GovBr ainda está válido
4. Retorna status claro: **válido**, **expirado** ou **ausente**

---

## Saída esperada

### Sessão válida

```
auth.json encontrado.
Cookie de sessão GovBr expira em: 2025-01-15 18:30:00
Status: VÁLIDO — pode rodar os testes normalmente.
```

### Sessão expirada

```
auth.json encontrado, mas a sessão expirou.
Cookie expirou em: 2025-01-10 09:00:00 (há 3 dias)
Status: EXPIRADO

Ação necessária:
  npm run save-auth
(Abrirá o browser → preenche CPF → aguarde 60s para resolver CAPTCHA → salva auth.json)
```

### Arquivo ausente

```
auth.json NÃO encontrado no diretório raiz.
Status: AUSENTE

Ação necessária:
  npm run save-auth
(Gera auth.json pela primeira vez — requer login manual com CAPTCHA)
```

---

## Lógica de verificação

Ao receber este comando:

1. Verificar se o arquivo `auth.json` existe
2. Se existir, ler o JSON e procurar campos de expiração:
   - `cookies[].expires` (timestamp Unix ou data ISO)
   - `origins[].localStorage` com tokens JWT (verificar `exp` no payload)
3. Comparar com a data/hora atual
4. Se qualquer cookie essencial do GovBr estiver expirado → status EXPIRADO
5. Se todos os cookies tiverem `expires: -1` (session cookies) → **avisar** que não é possível verificar automaticamente, recomendar testar com `npm test` para confirmar

---

## Verificação manual alternativa

Se a verificação automática não for conclusiva:

```bash
# Rodar apenas o teste de setup (verifica se auth.json funciona)
npx playwright test src/tests/portal-login.spec.js --headed

# Se passar → sessão válida
# Se falhar com "redirect to login" → sessão expirada → npm run save-auth
```

---

## Quando usar

- Antes de rodar testes após um período sem usar o projeto
- Quando os testes falham com "redirect para login" ou "sessão não encontrada"
- Antes de enviar testes para CI (verificar se o secret AUTH_JSON precisa ser atualizado)
- Como primeiro passo ao debugar falhas de autenticação
