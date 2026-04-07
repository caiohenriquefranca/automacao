# Comando /fix-test

Diagnóstico rápido de um spec falhando. Lê o arquivo + artefatos de falha e propõe correção pontual.

---

## Sintaxe

```
/fix-test <caminho-do-spec> [mensagem-de-erro]
```

**Parâmetros:**
- `caminho-do-spec` — caminho do arquivo .spec.js que está falhando
- `mensagem-de-erro` (opcional) — colar o erro do terminal para diagnóstico mais preciso

---

## Exemplos de uso

```
/fix-test src/tests/portal/licencaSanitaria.spec.js

/fix-test src/tests/gestor/cadastroEmpresa.spec.js "Error: locator.click: Timeout 30000ms exceeded"

/fix-test src/tests/atendimento/novoChamado.spec.js "strict mode violation - 2 elements found"
```

---

## O que este comando faz

1. Lê o arquivo `.spec.js` informado
2. Verifica artefatos em `test-results/` (screenshots, trace)
3. Analisa a mensagem de erro (se fornecida)
4. Identifica a causa raiz:
   - Seletor inválido ou ambíguo
   - Timeout / elemento não encontrado
   - Problema de timing (animação, debounce, navegação)
   - Sessão SSO expirada
   - Mudança de DOM (label renomeado, estrutura alterada)
5. Propõe correção **pontual** (apenas o trecho que precisa mudar)
6. Explica brevemente por que a correção resolve o problema

---

## Saída esperada

```
## Diagnóstico — src/tests/portal/licencaSanitaria.spec.js

**Erro:** locator not found para `uploadPorLabel(page, 'Alvará Sanitário', docs.alvara)`

**Causa:** O label do campo no HTML é "Alvará Sanitário Municipal" (com a palavra "Municipal"),
mas o spec usa apenas "Alvará Sanitário".

**Correção:**
```diff
- await uploadPorLabel(page, 'Alvará Sanitário', docs.alvara);
+ await uploadPorLabel(page, 'Alvará Sanitário Municipal', docs.alvara);
```

**Verificação:** Execute `npx playwright test src/tests/portal/licencaSanitaria.spec.js --headed`
para confirmar a correção.
```

---

## Fluxo de diagnóstico interno

Ao receber este comando, executar na ordem:

1. **Ler o spec** → entender a estrutura e identificar o ponto de falha
2. **Verificar artefatos** → se existir `test-results/<spec-name>/`, ler screenshots e trace
3. **Analisar o erro** → classificar entre: seletor, timing, auth, DOM
4. **Verificar regras** → checar se o spec viola alguma regra em `.claude/rules/testing.md`
5. **Propor correção** → mostrar diff claro do que precisa mudar
6. **Nunca reescrever o spec inteiro** → correção mínima e cirúrgica

---

## Quando /fix-test não é suficiente

Se o DOM da página mudou completamente, executar `/inspect-page` para re-mapear os seletores antes de propor correção:

```
O DOM parece ter mudado significativamente. Recomendo executar:
/inspect-page /servicos/licenca-sanitaria portal
...e então atualizar os seletores do spec.
```

---

## Quando usar

- Spec que funcionava parou de funcionar
- Spec novo falha na primeira execução
- Erro de seletor não encontrado
- Timeout inesperado em elemento que deveria estar visível
- Erro de strict mode (múltiplos elementos encontrados)
