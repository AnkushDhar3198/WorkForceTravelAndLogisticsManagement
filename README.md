# TravelOps — Workforce Travel & Logistics Management

An industry-grade, full-stack workforce travel and logistics management platform built with **Angular 18** + **Spring Boot 3** + **PostgreSQL**.

---

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Frontend  | Angular 18, TypeScript, RxJS     |
| Backend   | Java 17+, Spring Boot 3, JPA    |
| Database  | PostgreSQL 15+                   |
| Design    | Apple-inspired dark glassmorphism|

---

## Features

### Core Modules
- **Dashboard** — Real-time KPI command center with spend analytics, policy compliance, and traveler safety overview
- **Travel Requests** — Full CRUD with automated policy engine validation, ROI scoring, and approval workflow
- **Vendors** — Preferred corporate vendor catalog with negotiated rate comparisons and badges
- **Shipments** — Asset/equipment logistics tracking with status management
- **Expenses** — OCR-ready expense claim submission with audit trail and reimbursement workflow
- **Duty of Care** — Real-time traveler location monitoring, threat level tracking, and SOS dispatch
- **Notifications** — System-generated alerts for flight delays, policy violations, risk advisories

### Business Logic
- **Automated Policy Engine** — Rules-based compliance checking (hotel caps, flight class restrictions, advance booking requirements, budget thresholds)
- **ROI Scoring** — Purpose-based trip valuation with cost-efficiency factors
- **Real-time Polling** — Frontend polls backend every 30 seconds for live data
- **Seed Data** — Auto-populates enterprise data on first run

---

## Prerequisites

1. **Java 17+** (JDK)
2. **Maven 3.8+**
3. **Node.js 18+** and **npm**
4. **PostgreSQL 15+**

---

## Setup

### 1. PostgreSQL Database

```sql
CREATE DATABASE workforce_travel;
```

The application uses `hibernate.ddl-auto=update` which auto-creates all tables on startup.

### 2. Backend

```bash
cd backend

# Set environment variables (optional - defaults to localhost:5432/workforce_travel)
set SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/workforce_travel
set SPRING_DATASOURCE_USERNAME=postgres
set SPRING_DATASOURCE_PASSWORD=postgres

mvn spring-boot:run
```

Backend starts at: **http://localhost:8080**

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend starts at: **http://localhost:4200**

### Quick Start (Windows)

```bash
# Terminal 1
start-backend.bat

# Terminal 2
start-frontend.bat
```

---

## API Endpoints

| Method | Endpoint                          | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| GET    | `/api/analytics/dashboard`        | Real-time dashboard KPIs       |
| GET    | `/api/employees`                  | List active employees          |
| GET    | `/api/travel-requests`            | List all travel requests       |
| POST   | `/api/travel-requests`            | Create with policy validation  |
| PUT    | `/api/travel-requests/{id}/status`| Approve/reject request         |
| GET    | `/api/vendors`                    | List active vendors            |
| GET    | `/api/shipments`                  | List all shipments             |
| PUT    | `/api/shipments/{id}/status`      | Update shipment status         |
| GET    | `/api/notifications`              | List all notifications         |
| PUT    | `/api/notifications/{id}/read`    | Mark notification as read      |
| GET    | `/api/risk/travelers`             | List traveler locations         |
| POST   | `/api/risk/sos`                   | Trigger SOS dispatch           |
| GET    | `/api/expenses`                   | List all expense claims        |
| PUT    | `/api/expenses/{id}/audit`        | Audit expense claim            |

---

## Architecture

```
backend/
├── entity/          # JPA entities (Employee, TravelRequest, Vendor, etc.)
├── repository/      # Spring Data JPA repositories with custom queries
├── service/         # Business logic (policy engine, analytics, ROI scoring)
├── controller/      # REST API controllers
└── config/          # DataSeeder for initial data population

frontend/
├── services/        # Angular HttpClient API service with typed interfaces
├── app.component.*  # Single-page app with tab navigation
└── styles.css       # Apple-inspired dark mode design system
```

---

## License

MIT
