# Comando /inspect-page

Atalho para inspecionar uma página real com o agente `page-scout` e obter o mapa de seletores verificados, pronto para gerar um spec.

---

## Sintaxe

```
/inspect-page <url-ou-caminho> [sistema]
```

**Parâmetros:**
- `url-ou-caminho` — URL completa ou caminho relativo (ex: `/servicos/habilitacao`)
- `sistema` (opcional) — `portal`, `gestor`, `sso`, `atendimento` (define qual `BASE_URL` usar)

---

## Exemplos de uso

```
/inspect-page /servicos/licenca-sanitaria
/inspect-page /servicos/licenca-sanitaria portal
/inspect-page https://gestor.exemplo.gov.br/admin/empresas gestor
/inspect-page /atendimento/novo-chamado atendimento
```

---

## O que este comando faz

1. Aciona o agente `page-scout` na URL informada
2. `page-scout` navega até a página (com auth.json) e inspeciona:
   - Formulários e seus campos com labels
   - Botões e links de ação
   - Seletores semânticos verificados (`getByRole`, `getByLabel`)
   - Elementos dinâmicos e condicionais
3. Retorna o **mapa de página** formatado para uso direto no `spec-builder`

---

## Saída esperada

```
## Mapa de Página — /servicos/licenca-sanitaria

### Campos de formulário
- Razão Social → getByLabel('Razão Social')
- CNPJ → getByLabel('CNPJ') [campo mascarado]
- Tipo de Solicitação → getByLabel('Tipo de Solicitação') [select]
- Upload Alvará → getByLabel('Alvará Sanitário Municipal') [file input]

### Botões de ação
- Avançar → getByRole('button', { name: 'Avançar' })
- Enviar Solicitação → getByRole('button', { name: 'Enviar Solicitação' })
- Cancelar → getByRole('link', { name: 'Cancelar' })

### Mensagens de resultado
- Sucesso → getByText('Protocolo gerado com sucesso')
- Número do protocolo → locator('.protocolo-numero')

### Observações
- Campo CNPJ usa máscara → usar pressSequentially com delay 80ms
- Botão 'Avançar' desabilitado até preencher campos obrigatórios
- Mensagem de sucesso aparece após ~3s
```

---

## Próximo passo após /inspect-page

Com o mapa em mãos, usar o `spec-builder` ou pedir diretamente:

```
Cria o spec src/tests/portal/licencaSanitaria.spec.js usando este mapa de página.
Fluxo: [descrever o fluxo desejado]
```

---

## Quando usar

- Antes de criar qualquer novo spec (obrigatório pelo princípio Page-First)
- Quando um seletor para de funcionar (DOM pode ter mudado)
- Para descobrir elementos opcionais/condicionais de um formulário
- Para entender a estrutura de uma página desconhecida

---

## Instruções de execução

Ao receber este comando:

1. Identificar o sistema pelo parâmetro ou pela URL
2. Delegar para o agente `page-scout` com a URL resolvida (base + caminho)
3. Aguardar a inspeção real da página
4. Retornar o mapa formatado conforme o modelo de saída acima
5. Perguntar se o usuário quer prosseguir para criação do spec
