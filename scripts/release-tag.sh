#!/usr/bin/env bash
# Crea y sube un tag v* desde la rama actual.
# Uso: ./scripts/release-tag.sh 1.0.0 "mensaje del release"
set -euo pipefail

VERSION="${1:?Indicá versión, ej. 1.0.0}"
MSG="${2:-Release v${VERSION}}"
TAG="v${VERSION}"

if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "El tag ${TAG} ya existe."
  exit 1
fi

git tag -a "${TAG}" -m "${MSG}"
git push origin "${TAG}"
echo "Publicado ${TAG}. GitHub Actions desplegará en el VPS si configuraste los secrets."
