#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

for env in dev staging prod; do
  echo "==> terraform validate: envs/${env}"
  terraform -chdir="terraform/envs/${env}" init -backend=false -input=false >/dev/null
  terraform -chdir="terraform/envs/${env}" validate
done

echo "==> terraform validate: modules/realm"
terraform -chdir="terraform/modules/realm" init -backend=false -input=false >/dev/null
terraform -chdir="terraform/modules/realm" validate
