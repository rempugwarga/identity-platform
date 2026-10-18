#!/usr/bin/env bash
# Menguji konfigurasi IAM SEBELUM diterapkan ke environment nyata:
# 1. Menjalankan Keycloak ephemeral (container)
# 2. Menerapkan realm + client dari repo ini ke container tersebut
# 3. Memverifikasi kontrak OIDC (issuer, umur token, PKCE, redirect URI)
set -euo pipefail

cd "$(dirname "$0")/.."

KC_IMAGE="${KC_IMAGE:-quay.io/keycloak/keycloak:26.8}"
KC_PORT="${KC_PORT:-8080}"
KC_NAME="${KC_NAME:-rempugwarga-kc-integration}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-admin}"
TEST_HARNESS_SECRET="${TEST_HARNESS_SECRET:-$(openssl rand -hex 24)}"
BILLING_API_SECRET="${BILLING_API_SECRET:-$(openssl rand -hex 24)}"

cleanup() {
  docker rm -f "$KC_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> Menjalankan Keycloak ephemeral (${KC_IMAGE})"
docker run -d --name "$KC_NAME" -p "${KC_PORT}:8080" \
  -e KC_BOOTSTRAP_ADMIN_USERNAME="$ADMIN_USER" \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD="$ADMIN_PASS" \
  "$KC_IMAGE" start-dev >/dev/null

bash scripts/wait-for-keycloak.sh "http://localhost:${KC_PORT}"

export TF_VAR_keycloak_url="http://localhost:${KC_PORT}"
export TF_VAR_keycloak_admin_username="$ADMIN_USER"
export TF_VAR_keycloak_admin_password="$ADMIN_PASS"
export TF_VAR_client_secrets="{\"test-harness\":\"${TEST_HARNESS_SECRET}\",\"billing-api\":\"${BILLING_API_SECRET}\"}"

echo "==> terraform init + apply ke realm ephemeral"
terraform -chdir=terraform/envs/dev init -input=false
terraform -chdir=terraform/envs/dev apply -auto-approve -input=false

EXPECTED_LIFESPAN="$(
  node -p "JSON.parse(require('fs').readFileSync('policies/token-policy.json','utf8')).accessTokenLifespanSeconds"
)"

echo "==> Verifikasi kontrak OIDC"
KC_BASE_URL="http://localhost:${KC_PORT}" \
REALM="rempugwarga" \
TEST_CLIENT_ID="test-harness" \
TEST_CLIENT_SECRET="$TEST_HARNESS_SECRET" \
EXPECTED_ACCESS_TOKEN_LIFESPAN="$EXPECTED_LIFESPAN" \
node tests/integration/verify-oidc.mjs

echo "==> Selesai: konfigurasi IAM lolos pengujian kontrak sebelum diterapkan"
