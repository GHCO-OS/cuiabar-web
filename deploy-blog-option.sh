#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ $# -ne 1 ]; then
  echo "Uso: bash deploy-blog-option.sh <astro-static|ghost|directus|hugo-static>"
  exit 1
fi

OPTION="$1"
OPTION_DIR="$ROOT_DIR/blog-options/$OPTION"

if [ ! -d "$OPTION_DIR" ]; then
  echo "Opcao invalida: $OPTION"
  exit 1
fi

if [ -f "$OPTION_DIR/deploy.sh" ]; then
  bash "$OPTION_DIR/deploy.sh"
  exit 0
fi

if [ -f "$OPTION_DIR/docker-compose.yml" ]; then
  cd "$OPTION_DIR"
  docker compose up -d
  exit 0
fi

echo "Nenhum deploy configurado para $OPTION"
exit 1
