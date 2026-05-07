#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NAMESPACE="${NAMESPACE:-aidfit}"
DEPLOYMENT_NAME="${DEPLOYMENT_NAME:-aidfit-frontend}"

kubectl apply -f "${ROOT_DIR}/k8s/namespace.yaml"
kubectl apply -f "${ROOT_DIR}/k8s/frontend-service.yaml"
kubectl apply -f "${ROOT_DIR}/k8s/frontend-deployment.yaml"

kubectl rollout status deployment/"${DEPLOYMENT_NAME}" -n "${NAMESPACE}" --timeout=3m
kubectl get pods -n "${NAMESPACE}" -o wide
kubectl get services -n "${NAMESPACE}"
