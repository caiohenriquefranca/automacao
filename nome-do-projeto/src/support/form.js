// src/support/form.js
// Helpers para preenchimento de formulários em portais governamentais
//
// Funções exportadas:
//   preencherCampoTexto(page, labelText, valor)        — preenche input por label
//   preencherCampoArea(page, labelText, valor)         — preenche textarea por label
//   uploadPorLabel(page, labelText, caminhoArquivo)    — faz upload de arquivo por label
//   selecionarOpcao(page, labelText, opcao)            — seleciona opção em select por label

/**
 * Preenche um campo de texto encontrado pelo texto do label.
 * Usa XPath para navegar da label até o input adjacente.
 * Retorna false silenciosamente se o campo não for encontrado.
 */
async function preencherCampoTexto(page, labelText, valor) {
  if (!valor && valor !== 0) return false;

  const campo = page.locator(
    `//label[contains(.,"${labelText}")]/parent::div//input[not(@type="file") and not(@type="checkbox") and not(@type="radio")]`
  ).or(
    page.locator(`//label[contains(.,"${labelText}")]/..//input`)
  );

  if (!(await campo.first().isVisible({ timeout: 3000 }).catch(() => false))) {
    return false;
  }

  await campo.first().fill('');
  await campo.first().pressSequentially(String(valor), { delay: 40 });
  return true;
}

/**
 * Preenche uma área de texto (textarea) encontrada pelo texto do label.
 */
async function preencherCampoArea(page, labelText, valor) {
  if (!valor) return false;

  const campo = page.locator(
    `//label[contains(.,"${labelText}")]/parent::div//textarea`
  ).or(
    page.locator(`//label[contains(.,"${labelText}")]/..//textarea`)
  );

  if (!(await campo.first().isVisible({ timeout: 3000 }).catch(() => false))) {
    return false;
  }

  await campo.first().fill(String(valor));
  return true;
}

/**
 * Realiza upload de arquivo via input[type="file"] encontrado pelo texto do label.
 * Suporta inputs ocultos (display:none) que são ativados por botão.
 */
async function uploadPorLabel(page, labelText, caminhoArquivo) {
  if (!caminhoArquivo) return false;

  // Tentar encontrar input[type="file"] adjacente ao label
  const fileInput = page.locator(
    `//label[contains(.,"${labelText}")]/parent::div/parent::div//input[@type="file"]`
  ).or(
    page.locator(`//label[contains(.,"${labelText}")]/..//input[@type="file"]`)
  );

  if (await fileInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await fileInput.first().setInputFiles(caminhoArquivo);
    return true;
  }

  // Tentar via file chooser (botão que abre o seletor de arquivo)
  const botaoUpload = page.locator(
    `//label[contains(.,"${labelText}")]/parent::div//button`
  ).or(
    page.getByRole('button', { name: new RegExp(labelText, 'i') })
  );

  if (await botaoUpload.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      botaoUpload.first().click(),
    ]);
    await fileChooser.setFiles(caminhoArquivo);
    return true;
  }

  // Último recurso: forçar setInputFiles em input oculto
  try {
    await fileInput.first().setInputFiles(caminhoArquivo);
    return true;
  } catch {
    return false;
  }
}

/**
 * Seleciona uma opção em um elemento select encontrado pelo texto do label.
 * Aceita valor de string (texto visível) ou índice numérico.
 */
async function selecionarOpcao(page, labelText, opcao) {
  if (opcao === undefined || opcao === null) return false;

  const select = page.locator(
    `//label[contains(.,"${labelText}")]/parent::div//select`
  ).or(
    page.locator(`//label[contains(.,"${labelText}")]/..//select`)
  );

  if (!(await select.first().isVisible({ timeout: 3000 }).catch(() => false))) {
    return false;
  }

  if (typeof opcao === 'number') {
    await select.first().selectOption({ index: opcao });
  } else {
    await select.first().selectOption({ label: opcao });
  }

  return true;
}

module.exports = {
  preencherCampoTexto,
  preencherCampoArea,
  uploadPorLabel,
  selecionarOpcao,
};
