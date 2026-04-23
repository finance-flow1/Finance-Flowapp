# FinanceFlow — Personal Finance Management System

A production-grade microservices application built with **Node.js / Express**, **React**, **PostgreSQL**, **Docker Compose**, **Prometheus**, and **Grafana**. Now featuring a premium **Admin Dashboard** and decentralized **Notification Service**.

---

## Table of Contents

- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Service URLs](#service-urls)
- [Default Credentials](#default-credentials)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Observability](#observability)
- [Security Model](#security-model)
- [Development Notes](#development-notes)
- [Stopping the Stack](#stopping-the-stack)

---

## Architecture

```
                        ┌─────────────────────────────┐
                        │        Browser / Client      │
                        │       localhost:3000         │
                        └──────────────┬──────────────┘
                                       │
                        ┌──────────────▼──────────────┐
                        │         Nginx (client)       │  ← Serves React SPA
                        │  /api/* → split routing      │  ← Intelligent proxy
                        └─────┬────────┬────────┬─────┘
                              │        │        │
               ┌──────────────▼──┐  ┌──▼────────▼──┐  ┌──▼───────────────┐
               │    User Service  │  │ Transaction  │  │  Notification     │
               │    Port 5001     │  │ Service      │  │  Service           │
               │  • Auth / RBAC   │  │ Port 5002    │  │  Port 5003         │
               │  • Profile       │  │ • CRUD Ops   │  │  • Real-time Alerts│
               │  • User Mgmt     │  │ • Analytics  │  │  • System Notifs   │
               └──────────┬───────┘  └──────┬───────┘  └──────┬────────────┘
                          │                 │                 │
                          └──────────┬──────┴─────────────────┘
                                     │
                        ┌────────────▼────────────────┐
                        │       PostgreSQL             │  Port 5432
                        │  • users table               │
                        │  • transactions table        │
                        │  • Indexed columns           │
                        └─────────────────────────────┘

Observability (separate network):
  All microservices → /metrics → Prometheus:9090 → Grafana:3001
```

---

## Project Structure

```
Finance-Flowapp/
├── services/
│   ├── user-service/             ← Domain: Identity & Auth (RBAC)
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── middleware/auth.js ← JWT verification (decentralized)
│   │       └── controllers/authController.js ← Admin management
│   │
│   ├── transaction-service/      ← Domain: Finance & Analytics
│   │   ├── Dockerfile
│   │   └── src/
│   │       └── models/            ← Global admin stats aggregations
│   │
│   └── notification-service/     ← Domain: User Alerts [NEW]
│       ├── Dockerfile
│       └── src/index.js           ← In-memory event store
│
├── client/                       ← Presentation layer (Premium React SPA)
│   ├── nginx.conf                ← Path-based routing for all services
│   └── src/
│       ├── api/api.js             ← Structured domain API client
│       ├── pages/                 ← Dashboard, Transactions, Admin [NEW]
│       └── components/            ← Glassmorphic UI library
│
├── infra/                        ← Monitoring & DB init
├── k8s/                          ← Kubernetes Gateway API manifests
├── docker-compose.yml            ← Orchestration for all services
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Routing (Docker) | Nginx (Path-based proxy) |
| Routing (K8s) | Kubernetes Gateway API (kgateway) |
| Business Services | Node.js 20, Express |
| Database | PostgreSQL 16 |
| Validation | Zod |
| Authentication | JWT (HS256), Role-Based Access Control (RBAC) |
| Security | Helmet.js, CORS |
| Logging | Morgan (HTTP), Winston (structured JSON) |
| Monitoring | Prometheus, Grafana |
| Frontend | React 18, Vite, Recharts, CSS Glassmorphism |
| HTTP Client | Axios (Structured domain layer) |

---

## Quick Start

### 1. Create your environment file
```bash
cp .env.example .env
```

### 2. Start the entire stack
```bash
docker compose up --build
```

---

## Service URLs

| Service | URL | Notes |
|---|---|---|
| **Frontend App** | http://localhost:3000 | Premium React SPA |
| **User Service** | http://localhost:5001 | Auth & User Management |
| **Transaction Service** | http://localhost:5002 | Ledger & Analytics |
| **Notification Service** | http://localhost:5003 | Real-time events |
| **Prometheus** | http://localhost:9090 | Metrics & targets |
| **Grafana** | http://localhost:3001 | Dashboards |

---

## Default Credentials

| Role | Username | Password |
|---|---|---|
| **System Admin** | admin@finance.com | Admin123! |
| **Regular User** | (Create via Register) | (Your Choice) |
| **Grafana** | admin | admin123 |
| **PostgreSQL** | financeuser | financepass |

---

## API Reference

Routing is decentralized. Nginx/K8s handles path-based matching:

### Auth & Users (`/api/v1/auth`, `/api/v1/users`)
- `POST /api/v1/auth/register` - New user signup
- `POST /api/v1/auth/login` - Get JWT
- `GET /api/v1/users/me` - Current profile
- `GET /api/v1/users` - **[ADMIN]** List all users

### Transactions (`/api/v1/transactions`)
- `GET /api/v1/transactions` - Filtered/Paginated list
- `POST /api/v1/transactions` - Record new activity
- `GET /api/v1/transactions/analytics/summary` - Personal metrics
- `GET /api/v1/transactions/admin/stats` - **[ADMIN]** Global system stats

### Notifications (`/api/v1/notifications`)
- `GET /api/v1/notifications` - Get user alerts
- `POST /api/v1/notifications` - Create new notification
- `PATCH /api/v1/notifications/:id/read` - Mark as read

---

## Security Model

| Concern | Implementation |
|---|---|
| Auth Architecture | **Decentralized JWT verification** in each microservice. |
| RBAC | Role-based checks (`isAdmin`) on sensitive endpoints. |
| Defense-in-Depth | Each service validates tokens; Gateway handles path-routing only. |
| Rate Limiting | Implemented at the Ingress/Gateway API level in K8s. |
| Input Validation | Strict Zod schemas for all request bodies. |

---

## Observability

Open **http://localhost:3001** → Dashboards → **Finance Microservices**.
Track Request Rates, P95 Latency, and Error rates across User, Transaction, and Notification services.
