#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-aidfit}"
APP_LABEL="${APP_LABEL:-aidfit-frontend}"
CONTAINER="${CONTAINER:-aidfit-frontend}"

kubectl logs -n "${NAMESPACE}" -l app="${APP_LABEL}" -c "${CONTAINER}" --tail="${TAIL:-200}" -f
