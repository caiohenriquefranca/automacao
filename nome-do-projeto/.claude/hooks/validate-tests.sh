#!/bin/bash
# Hook: Validar arquivos de teste antes de executar
# Verifica padrões básicos obrigatórios nos specs

set -e

TESTS_DIR="src/tests"
ERRORS=0

# Verificar se test.describe existe em todos os specs
for spec in $(find "$TESTS_DIR" -name "*.spec.js" 2>/dev/null); do
  if ! grep -q "test.describe" "$spec"; then
    echo "AVISO: $spec não possui test.describe()"
    ERRORS=$((ERRORS + 1))
  fi

  if ! grep -q "test.beforeEach" "$spec"; then
    echo "AVISO: $spec não possui test.beforeEach()"
    ERRORS=$((ERRORS + 1))
  fi

  if ! grep -q "loginSSO\|fecharModaisIniciais" "$spec"; then
    echo "AVISO: $spec não importa helpers de auth"
  fi
done

# Verificar se auth.json existe
if [ ! -f "auth.json" ]; then
  echo ""
  echo "ATENÇÃO: auth.json não encontrado!"
  echo "Execute: npm run save-auth"
  echo ""
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
  echo "ATENÇÃO: .env não encontrado! Copie .env.example e preencha as variáveis."
fi

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "$ERRORS problema(s) encontrado(s) nos specs."
  echo "Consulte .claude/rules/testing.md para os padrões obrigatórios."
fi

exit 0
