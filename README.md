# FinanceFlow — Personal Finance Management System

A production-grade microservices application built with **Node.js / Express**, **React**, **PostgreSQL**, **Docker Compose**, **Prometheus**, and **Grafana**.

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
                        │  /api/* → proxy to gateway   │  ← Proxies API calls
                        └──────────────┬──────────────┘
                                       │  Docker internal network
                        ┌──────────────▼──────────────┐
                        │         API Gateway          │  Port 4000
                        │  • Rate limiting             │
                        │  • JWT enforcement           │
                        │  • Request logging           │
                        │  • Reverse proxy             │
                        └─────────┬──────────┬─────────┘
                                  │          │
               ┌──────────────────▼──┐  ┌───▼──────────────────┐
               │    User Service      │  │  Transaction Service  │
               │    Port 5001         │  │  Port 5002            │
               │  • Register/Login    │  │  • CRUD operations    │
               │  • JWT signing       │  │  • Pagination         │
               │  • bcrypt hashing    │  │  • Filtering          │
               │  • Profile           │  │  • Analytics          │
               └──────────┬──────────┘  └───────────┬──────────┘
                          │                          │
                          └──────────┬───────────────┘
                                     │
                        ┌────────────▼────────────────┐
                        │       PostgreSQL             │  Port 5432
                        │  • users table               │
                        │  • transactions table        │
                        │  • Indexed columns           │
                        └─────────────────────────────┘

Observability (separate network):
  All 3 backend services → /metrics → Prometheus:9090 → Grafana:3001
```

---

## Project Structure

```
Finale/
├── gateway/                      ← Edge layer (NOT a business microservice)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js              ← Main entry: proxy routes + middleware
│       ├── middleware/
│       │   ├── auth.js           ← JWT verification
│       │   └── rateLimiter.js    ← express-rate-limit (100 req/15min)
│       └── utils/
│           ├── logger.js         ← Winston structured logging
│           └── metrics.js        ← prom-client counters & histograms
│
├── services/
│   ├── user-service/             ← Domain: Identity & Auth
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js          ← Boot: DB retry, admin seed, Express setup
│   │       ├── db/pool.js        ← PostgreSQL connection pool
│   │       ├── models/           ← Raw pg queries (no ORM)
│   │       ├── services/         ← Business logic (bcrypt, JWT)
│   │       ├── controllers/      ← HTTP layer
│   │       ├── routes/           ← Express routers + Swagger JSDoc
│   │       ├── middleware/       ← Zod validation
│   │       ├── swagger/          ← swagger-jsdoc + swagger-ui-express
│   │       └── utils/            ← Winston + prom-client
│   │
│   └── transaction-service/     ← Domain: Finance & Analytics
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           ├── index.js
│           ├── db/pool.js
│           ├── models/           ← CRUD + analytics aggregations
│           ├── services/
│           ├── controllers/
│           ├── routes/           ← Full Swagger documentation
│           ├── middleware/       ← Auth (defence-in-depth) + Zod
│           ├── swagger/
│           └── utils/
│
├── client/                       ← Presentation layer (React + Vite)
│   ├── Dockerfile                ← Multi-stage: Node build → nginx:alpine
│   ├── nginx.conf                ← SPA routing + API proxy + compression
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/axios.js          ← Axios instance with JWT interceptors
│       ├── pages/                ← Login, Register, Dashboard, Transactions
│       └── components/           ← Navbar, TransactionForm, AnalyticsChart
│
├── infra/
│   ├── db/init.sql               ← Schema: tables, indexes
│   ├── prometheus/
│   │   └── prometheus.yml        ← Scrape configs for all 3 services
│   └── grafana/provisioning/
│       ├── datasources/          ← Auto-provisioned Prometheus datasource
│       └── dashboards/           ← Pre-built Finance Microservices dashboard
│
├── docker-compose.yml
├── .env.example
├── .env                          ← Your actual config (gitignored)
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| API Gateway | Node.js, Express, http-proxy-middleware |
| Business Services | Node.js, Express |
| Database | PostgreSQL 16 |
| Validation | Zod |
| Authentication | JWT (HS256, 24h expiry), bcrypt (12 rounds) |
| Security | Helmet.js, CORS, express-rate-limit |
| Logging | Morgan (HTTP), Winston (structured JSON) |
| Metrics | prom-client (Prometheus format) |
| Monitoring | Prometheus, Grafana |
| API Docs | Swagger UI (swagger-jsdoc) |
| Frontend | React 18, Vite, React Router v6 |
| Charts | Recharts |
| HTTP Client | Axios (with interceptors) |
| Container Runtime | Docker, Docker Compose |
| Static File Server | Nginx Alpine |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — v24+ recommended
- Docker Compose v2 (bundled with Docker Desktop)

That's it. Node.js is **not** required on your host machine.

---

## Quick Start

### 1. Clone / open the project

```bash
cd Finale
```

### 2. Create your environment file

```bash
cp .env.example .env
```

> The defaults in `.env.example` work out of the box for local development.  
> Change `JWT_SECRET` before deploying anywhere real.

### 3. Start the entire stack

```bash
docker-compose up --build
```

First build downloads images and installs dependencies — expect **3–5 minutes**.  
Subsequent starts (without `--build`) take ~30 seconds.

### 4. Wait for healthy status

All services perform health checks. You'll see services become healthy in order:
```
postgres        → healthy
user-service    → healthy (seeds admin user on first boot)
transaction-service → healthy
gateway         → healthy
client          → running
prometheus      → running
grafana         → running
```

---

## Service URLs

| Service | URL | Notes |
|---|---|---|
| **Frontend App** | http://localhost:3000 | React SPA |
| **API Gateway** | http://localhost:4000 | Entry point for all API calls |
| **User Service** | http://localhost:5001 | Direct access (bypass gateway) |
| **Transaction Service** | http://localhost:5002 | Direct access (bypass gateway) |
| **Swagger — User Service** | http://localhost:5001/api-docs | Interactive API docs |
| **Swagger — Transactions** | http://localhost:5002/api-docs | Interactive API docs |
| **Prometheus** | http://localhost:9090 | Metrics & targets |
| **Grafana** | http://localhost:3001 | Dashboards |

---

## Default Credentials

| Service | Username | Password |
|---|---|---|
| App (admin) | admin@finance.com | Admin123! |
| Grafana | admin | admin123 |
| PostgreSQL | financeuser | financepass |

> The **admin user is seeded automatically** by the User Service on first boot using a properly bcrypt-hashed password. No plain-text passwords are stored in any SQL files.

---

## Environment Variables

All variables live in `.env` (copied from `.env.example`):

```bash
# PostgreSQL
POSTGRES_USER=financeuser
POSTGRES_PASSWORD=financepass
POSTGRES_DB=financedb

# JWT — CHANGE THIS in production
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# CORS allowed origin (for gateway)
CORS_ORIGIN=http://localhost:3000

# Grafana admin credentials
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin123
```

---

## API Reference

All routes go through the gateway at **http://localhost:4000**.

### Authentication

```
POST /api/v1/auth/register
Body: { "name": "Jane Doe", "email": "jane@example.com", "password": "securepass" }

POST /api/v1/auth/login
Body: { "email": "jane@example.com", "password": "securepass" }
Returns: { "data": { "user": {...}, "token": "<JWT>" } }
```

### User Profile *(JWT required)*

```
GET /api/v1/users/me
Header: Authorization: Bearer <token>
```

### Transactions *(JWT required)*

```
# List (paginated + filtered)
GET /api/v1/transactions
  ?type=income|expense
  &category=Salary
  &startDate=2024-01-01
  &endDate=2024-12-31
  &page=1
  &limit=10

# Single transaction
GET /api/v1/transactions/:id

# Analytics summary (balance, monthly report, category breakdown)
GET /api/v1/transactions/analytics/summary

# Create
POST /api/v1/transactions
Body: {
  "type": "income",
  "amount": 3500.00,
  "category": "Salary",
  "description": "Monthly salary",
  "date": "2024-01-15"
}

# Update
PUT /api/v1/transactions/:id
Body: { ...same as create... }

# Delete
DELETE /api/v1/transactions/:id
```

> All API responses follow: `{ "success": true, "data": {...} }` or `{ "error": "message" }`

---

## Observability

### Prometheus

Open **http://localhost:9090** → Status → Targets.

All three services (`api-gateway`, `user-service`, `transaction-service`) should show as **UP**.

Each service exposes these metrics at `/metrics`:

| Metric | Type | Description |
|---|---|---|
| `http_requests_total` | Counter | Total requests, labelled by method/route/status |
| `http_request_duration_ms` | Histogram | Request latency in milliseconds |
| `http_errors_total` | Counter | Total 4xx/5xx responses |
| `process_*`, `nodejs_*` | Gauge | Default Node.js process metrics |

### Grafana

Open **http://localhost:3001** → Dashboards → Finance → **Finance Microservices**.

Pre-built panels:
- Gateway Request Rate (req/s)
- Error Rate (5xx percentage)
- P95 Latency (ms)
- Request Rate by Service (time-series)
- P95 Latency by Service (time-series)
- HTTP Status Codes Over Time (2xx / 4xx / 5xx)

---

## Security Model

| Concern | Implementation |
|---|---|
| Password storage | bcrypt, salt rounds = 12 |
| Token format | JWT HS256, 24-hour expiry |
| Gateway auth enforcement | JWT verified before proxying (except `/auth/*`) |
| Service-level auth | Transaction Service re-verifies JWT (defence-in-depth) |
| HTTP security headers | `helmet()` on all services |
| Cross-origin | `cors()` restricted to `CORS_ORIGIN` |
| Rate limiting | 100 requests per 15 minutes per IP (gateway) |
| Input validation | Zod schemas on all request bodies |
| Secrets | Never stored in code; read from environment variables only |

---

## Development Notes

### Running a single service locally (outside Docker)

```bash
cd services/user-service
npm install
# Set env vars manually, then:
npm run dev
```

### Viewing logs

```bash
# All services
docker-compose logs -f

# Single service
docker-compose logs -f user-service
docker-compose logs -f transaction-service
docker-compose logs -f gateway
```

### Resetting the database

```bash
docker-compose down -v   # removes named volumes (wipes DB)
docker-compose up --build
```

---

## Stopping the Stack

```bash
# Stop containers (keep data)
docker-compose down

# Stop and delete all data (volumes)
docker-compose down -v
```
