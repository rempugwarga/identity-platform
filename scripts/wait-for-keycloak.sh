#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:?Usage: wait-for-keycloak.sh <base-url> [timeout-seconds]}"
TIMEOUT="${2:-180}"

echo "Menunggu Keycloak di ${BASE_URL} ..."
for i in $(seq 1 "$TIMEOUT"); do
  if curl -sf "${BASE_URL}/realms/master/.well-known/openid-configuration" >/dev/null 2>&1; then
    echo "Keycloak siap setelah ${i}s"
    exit 0
  fi
  sleep 1
done

echo "Keycloak tidak siap dalam ${TIMEOUT}s" >&2
exit 1
