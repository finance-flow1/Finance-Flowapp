# Finance-Flow — Kubernetes Deployment Guide

> **Source of truth:** `docker-compose.yml` (working, tested).  
> **K8s:** Kustomize multi-environment overlays targeting `dev` and `prod` namespaces.

---

## Architecture

```
Internet
    │
    ▼
┌─────────────────┐
│  kgateway        │  (gate namespace — cluster infrastructure)
│  port 80         │
└────────┬────────┘
         │  HTTPRoutes (from dev or prod namespace)
         ▼
┌─────────────────────────────────────────────────────┐
│  dev  OR  prod  namespace                           │
│                                                     │
│  ┌──────────┐   ┌──────────────────┐               │
│  │ frontend │   │  user-service    │:5001           │
│  │  nginx   │   │  transaction-svc │:5002 ──▶ MQ   │
│  │  :80     │   │  notification-svc│:5003 ──▶ MQ   │
│  └──────────┘   └──────────────────┘               │
│                        │                            │
│                        ▼                            │
│                  ┌──────────┐  ┌──────────┐        │
│                  │ postgres │  │ rabbitmq │        │
│                  │ Stateful │  │  :5672   │        │
│                  │ Set:5432 │  └──────────┘        │
│                  └──────────┘                      │
└─────────────────────────────────────────────────────┘
```

**Key design decisions:**
- All services run in **one namespace** per environment (`dev` or `prod`) — no cross-namespace FQDNs
- `kgateway` handles path rewrites (`/api/v1/*` → stripped prefixes) and routes directly to microservices
- PostgreSQL is deployed as a StatefulSet with separate logical databases (`user_db`, `txn_db`, `notify_db`) for each microservice
- RabbitMQ decouples transaction creation from notification delivery

---

## Prerequisites

### 1. Kubernetes Cluster
Any K8s cluster (EKS, GKE, K3s, kubeadm, etc.)

### 2. NFS StorageClass (once per cluster)
```bash
# Install NFS provisioner
helm repo add nfs-subdir-external-provisioner \
  https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
helm repo update

helm install nfs-provisioner \
  nfs-subdir-external-provisioner/nfs-subdir-external-provisioner \
  --set nfs.server=<NFS_SERVER_IP> \
  --set nfs.path=<NFS_EXPORT_PATH> \
  --set storageClass.name=nfs-storage \
  --namespace nfs-provisioner --create-namespace

# Apply StorageClass definition
kubectl apply -f k8s/03-storage/nfs-storageclass.yaml
```

### 3. kgateway / Kubernetes Gateway API (once per cluster)
```bash
# Install Gateway API CRDs
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/latest/download/standard-install.yaml

# Install kgateway controller
helm repo add kgateway https://kgateway.dev/charts && helm repo update
helm install kgateway kgateway/kgateway \
  --namespace kgateway-system --create-namespace \
  --set gatewayProxies.gatewayProxy.service.type=NodePort

# Apply gateway infrastructure (gate namespace + Gateway + ReferenceGrants)
kubectl apply -k k8s/08-gateway
```

### 4. Metrics Server — required for HPA in prod (once per cluster)
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

## Deploying

### Development
```bash
kubectl apply -k k8s/dev

# Verify
kubectl get all -n dev
kubectl rollout status deployment -n dev
```

### Production
```bash
kubectl apply -k k8s/prod

# Verify
kubectl get all -n prod
kubectl get hpa -n prod
kubectl rollout status deployment -n prod
```

### Preview before applying (dry run)
```bash
kubectl kustomize k8s/dev   | less
kubectl kustomize k8s/prod  | less
```

### Teardown
```bash
kubectl delete -k k8s/dev
kubectl delete -k k8s/prod
# Gateway infra (only if removing entirely)
kubectl delete -k k8s/08-gateway
```

---

## Environment Comparison

| Setting | `dev` | `prod` |
|---|---|---|
| Namespace | `dev` | `prod` |
| Image tags | `:latest` | `:stable` |
| user-service replicas | 1 | 2 (HPA: max 6) |
| transaction-service replicas | 1 | 2 (HPA: max 8) |
| notification-service replicas | 1 | 2 (HPA: max 4) |
| frontend replicas | 1 | 3 (HPA: max 10) |
| Network Policy | Permissive (allow-all same-ns) | Strict (deny-all + explicit allow) |
| HPA | ❌ | ✅ |

---

## Folder Structure

```
k8s/
├── base/
│   └── kustomization.yaml          ← aggregates all numbered dirs (never apply directly)
│
├── dev/
│   ├── kustomization.yaml          ← kubectl apply -k k8s/dev
│   ├── namespace.yaml
│   └── patches/
│       ├── replicas.yaml           ← all services → 1 replica
│       └── netpol-permissive.yaml  ← allow-all same-namespace traffic
│
├── prod/
│   ├── kustomization.yaml          ← kubectl apply -k k8s/prod
│   ├── namespace.yaml
│   ├── hpa.yaml                    ← HPA for all 4 services
│   └── patches/
│       ├── replicas.yaml           ← 2/2/2/3 replicas
│       └── netpol-strict.yaml      ← lock frontend ingress to CIDR
│
├── 01-rbac/
│   ├── service-accounts.yaml       ← single SA (namespace stamped by Kustomize)
│   ├── roles.yaml                  ← single Role
│   └── role-bindings.yaml          ← single RoleBinding
│
├── 02-secrets/
│   ├── jwt-secret.yaml             ← JWT signing key
│   ├── postgres-secret.yaml        ← unified DB credentials
│   └── rabbitmq-secret.yaml        ← RabbitMQ credentials + AMQP URL
│
├── 03-storage/
│   ├── nfs-storageclass.yaml       ← cluster-scoped, applied once
│   └── pvcs.yaml                   ← postgres-pvc (20Gi)
│
├── 04-network-policies/
│   └── base-netpol.yaml            ← default-deny + explicit allow rules
│
├── 05-data/
│   ├── postgres/
│   │   ├── configmap-init.yaml     ← init.sh (user_db + txn_db + notify_db)
│   │   ├── statefulset.yaml        ← postgres:16-alpine StatefulSet
│   │   └── service.yaml            ← headless ClusterIP on :5432
│   └── rabbitmq/
│       ├── deployment.yaml         ← rabbitmq:3-management-alpine
│       └── service.yaml            ← ClusterIP :5672 (amqp) + :15672 (mgmt)
│
├── 06-backend/
│   ├── user-service/
│   │   ├── deployment.yaml         ← :5001, reads postgres-secret + jwt-secret
│   │   └── service.yaml
│   ├── transaction-service/
│   │   ├── deployment.yaml         ← :5002, reads postgres + jwt + rabbitmq secrets
│   │   └── service.yaml
│   └── notification-service/
│       ├── deployment.yaml         ← :5003, reads postgres + jwt + rabbitmq secrets
│       └── service.yaml
│
├── 07-frontend/
│   ├── deployment.yaml             ← nginx SPA + API reverse proxy
│   └── service.yaml                ← ClusterIP :80
│
└── 08-gateway/
    ├── kustomization.yaml          ← kubectl apply -k k8s/08-gateway (infra, once)
    ├── gate-namespace.yaml         ← 'gate' namespace
    ├── gatewayclass.yaml           ← cluster-scoped kgateway class
    ├── gateway.yaml                ← Gateway in 'gate' ns, listens :80
    ├── httproutes.yaml             ← routes stamped with dev/prod by Kustomize
    └── referencegrants.yaml        ← allow dev + prod HTTPRoutes → gate Gateway
```

---

## Secrets Management

> [!WARNING]
> The secrets in `02-secrets/` use `stringData:` with placeholder values. **Rotate all values before deploying to prod.**

**Recommended production approaches:**

| Tool | Description |
|---|---|
| **Sealed Secrets** (Bitnami) | Encrypts secrets with cluster public key — safe to commit to Git |
| **External Secrets Operator** | Syncs from AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager |

**Rotate these before prod:**

| Secret | File | Key to change |
|---|---|---|
| DB password | `postgres-secret.yaml` | `POSTGRES_PASSWORD` |
| RabbitMQ password | `rabbitmq-secret.yaml` | `RABBITMQ_DEFAULT_PASS` + `RABBITMQ_URL` |
| JWT signing key | `jwt-secret.yaml` | `JWT_SECRET` |

**Update prod image tags** in `k8s/prod/kustomization.yaml`:
```yaml
images:
  - name: area51devops/user-service
    newTag: "1.2.3"   # pin to a specific release tag
```

---

## Network Policy Summary

### dev — permissive
The `default-deny-all` policy is patched to allow all same-namespace traffic. Enables easy debugging without disabling the policy framework entirely.

### prod — strict
| Source | Destination | Port |
|---|---|---|
| `frontend` | `user-service` | 5001 |
| `frontend` | `transaction-service` | 5002 |
| `frontend` | `notification-service` | 5003 |
| `user-service`, `transaction-service`, `notification-service` | `postgres` | 5432 |
| `transaction-service`, `notification-service` | `rabbitmq` | 5672 |
| All pods | kube-dns | 53 |
| Everything else | Everything else | **DENIED** |

---

## Scaling (HPA) — prod only

HPAs are deployed automatically with `kubectl apply -k k8s/prod`.  
Requires Metrics Server (see Prerequisites).

| Service | Min | Max | Scale trigger |
|---|---|---|---|
| `user-service` | 2 | 6 | CPU > 70% \| Memory > 80% |
| `transaction-service` | 2 | 8 | CPU > 65% \| Memory > 80% |
| `notification-service` | 2 | 4 | CPU > 70% |
| `frontend` | 3 | 10 | CPU > 60% |

---

## Common Operations

```bash
# Watch pods come up
kubectl get pods -n dev -w

# Tail logs for a service
kubectl logs -n dev -l app=notification-service -f

# Check RabbitMQ messages
kubectl port-forward -n dev svc/rabbitmq 15672:15672
# open http://localhost:15672 → guest/guest

# Connect to postgres directly
kubectl exec -it -n dev deploy/postgres -- psql -U financeuser -d financedb

# Force restart a deployment
kubectl rollout restart deployment/transaction-service -n prod

# Check HPA status
kubectl get hpa -n prod
kubectl describe hpa transaction-service-hpa -n prod
```
