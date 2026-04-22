# Kubernetes Production Setup — Personal Finance App

## Core Architecture

```
Browser
  │
  ▼
HAProxy (External LB / Bare-metal VM)
  │
  ▼
Kgateway (gate ns) — Listener: port 80
  │
  ├── /api/*  ──────────────────► api-gateway.backend:4000
  │                                    │
  │                          ┌─────────┴──────────┐
  │                    user-service:5001    transaction-service:5002
  │                          │                     │
  │                   user-db.data:5432     txn-db.data:5432
  │                   (PostgreSQL, NFS)     (PostgreSQL, NFS)
  │
  └── /* (catch-all)  ──────────► frontend.frontend:80 (Nginx SPA)
```

## Infrastructure Components

| Namespace | Purpose |
|-----------|---------|
| `gate` | Ingress tier (Kgateway Proxy + ReferenceGrants) |
| `frontend` | Presentation tier (Nginx serving React SPA) |
| `backend` | Logic tier (API Gateway + Node.js Microservices) |
| `data` | Persistence tier (Isolated PostgreSQL instances + Init SQL) |

---

## 🚀 Deployment Order (Step-by-Step)

Follow this order exactly to ensure all dependencies (namespaces, secrets, storage) are satisfied before workloads start.

### 1. Prerequisites (Cluster-wide)
Install the Gateway API CRDs and the Kgateway controller if not already present.

```bash
# Install Gateway API Standard CRDs
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/latest/download/standard-install.yaml

# Install Kgateway via Helm
helm repo add kgateway https://kgateway.dev/charts && helm repo update
helm install kgateway kgateway/kgateway \
  --namespace kgateway-system --create-namespace \
  --set gatewayProxies.gatewayProxy.service.type=NodePort

# Install NFS Subdir Provisioner (Update server/path)
helm install nfs-provisioner nfs-subdir-external-provisioner/nfs-subdir-external-provisioner \
  --set nfs.server=<YOUR_NFS_IP> \
  --set nfs.path=<YOUR_NFS_PATH> \
  --set storageClass.name=nfs-storage \
  --namespace nfs-provisioner --create-namespace
```

### 2. Foundations (Namespaces & RBAC)
```bash
# Create the 4 core namespaces
kubectl apply -f k8s/00-namespaces/

# Create shared ServiceAccounts and Roles
kubectl apply -f k8s/01-rbac/
```

### 3. Security & Storage
```bash
# 1. Apply Secrets (If using Sealed Secrets, apply the .sealed.yaml versions)
kubectl apply -f k8s/02-secrets/

# 2. Apply StorageClass and PVCs
kubectl apply -f k8s/03-storage/

# 3. Apply Zero-Trust Network Policies
kubectl apply -f k8s/04-network-policies/
```

### 4. Data Layer (Databases)
Wait for the PVCs to be bound (`kubectl get pvc -n data`) before proceeding.
```bash
# Deploy PostgreSQL instances with Init SQL
kubectl apply -f k8s/05-data/user-db/
kubectl apply -f k8s/05-data/txn-db/
```

### 5. Application Layer (Workloads)
```bash
# Deploy Backend Services
kubectl apply -f k8s/06-backend/api-gateway/
kubectl apply -f k8s/06-backend/user-service/
kubectl apply -f k8s/06-backend/transaction-service/

# Deploy Frontend SPA
kubectl apply -f k8s/07-frontend/
```

### 6. Ingress Layer (Gateway API)
```bash
# Configure the Gateway tier
kubectl apply -f k8s/08-gateway/
```

---

## 🔒 Secrets Management (KubeSeal)

We use **Sealed Secrets** to keep our credentials safe in Git.

1. **Install Controller:**
   `helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system`
2. **Seal a Secret:**
   `kubeseal --format yaml < k8s/02-secrets/user-db-secret.yaml > k8s/02-secrets/user-db-secret.sealed.yaml`
3. **Commit:** Delete the plain `.yaml` file and commit only the `.sealed.yaml` file.

## 🛠 Troubleshooting & Verification

### Check Connectivity (Network Policies)
```bash
# Verify frontend can ONLY reach gate
kubectl run netshoot --image=nicolaka/netshoot -n frontend -it --rm -- \
  curl -I http://api-gateway.backend.svc.cluster.local:4000
# Expected: Timeout/Blocked

# Verify user-service can reach its DB
kubectl run netshoot --image=nicolaka/netshoot -n backend -it --rm -- \
  nc -zv user-db.data.svc.cluster.local 5432
# Expected: Succeeded
```

### View Ingress Status
```bash
kubectl get gateway -n gate
kubectl get httproute -A
```
