#!/usr/bin/env bash
set -euo pipefail

kubectl delete -f k8s/frontend-deployment.yaml --ignore-not-found
kubectl delete -f k8s/frontend-service.yaml --ignore-not-found

echo "Namespace was preserved. Delete manually only if needed:"
echo "  kubectl delete namespace aidfit"
