# TravelOps — Workforce Travel & Logistics Management Platform

An industry-grade, full-stack workforce travel and logistics management platform built for the **Consumer Business Group (CBG)** using **Angular 18**, **Spring Boot 3**, and **PostgreSQL**.

---

## 🔑 Official Passkeys & 2-Step Verification Credentials

| Role | Official Name | Official Email | Passkey (Step 1) | 2FA Code (Step 2) |
|------|---------------|----------------|------------------|-------------------|
| **Corporate Travel Manager** | Victoria Vance | `travel.manager@cbg-enterprise.com` | `CTM-9948-ALPHA` | `774892` |
| **Approving Manager** | David Chen | `manager.david@cbg-enterprise.com` | `MGR-3381-BETA` | `882194` |
| **Finance & Procurement** | Lisa Park | `finance.lisa@cbg-enterprise.com` | `FIN-5510-GAMMA` | `551930` |
| **Security / Risk Officer** | Elena Rostova | `security.elena@cbg-enterprise.com` | `SEC-7742-DELTA` | `993418` |
| **Logistics Coordinator** | Raj Patel | `logistics.raj@cbg-enterprise.com` | `LOG-1193-EPSILON` | `448201` |
| **Traveling Employee** | Sarah Jenkins | `employee.sarah@cbg-enterprise.com` | `EMP-4421-ZETA` | `123984` |

---

## 👥 Role-Based Systems & PDF BRD Mapping

1. **Corporate Travel Manager (Program Owner)**
   - Negotiates corporate vendor contracts (Airlines, Hotels, Ground Transport).
   - Manages Preferred Vendor Catalog (Add, Edit, Remove vendors).
   - Configures T&E Automated Policy Engine rules (Hotel caps, flight class restrictions).

2. **Approving Manager (Department Leader)**
   - Pending Travel Requisitions Inbox.
   - Evaluates requests against ROI score & departmental budget limits.
   - Approves or rejects requisitions with manager remarks.

3. **Finance & Procurement Team**
   - Expense Audit Queue with OCR confidence checks.
   - Fraud prevention and out-of-policy spend flagging.
   - Payout reimbursement approvals and department expense reporting.

4. **Security / Risk Officer**
   - Duty of Care global tracking map & active traveler PNR whereabouts.
   - Real-time disruption alerts & geopolitical threat advisories.
   - 1-Click Emergency SOS dispatch center.

5. **Logistics Coordinator**
   - Synchronized transport of physical consumer products, prototypes, and event booths.
   - Customs carnets compliance tracking.
   - 3PL carrier dispatch (FedEx, DHL, Sixt) & last-mile delivery schedule tracking.

6. **Traveling Employee (Road Warrior / End User)**
   - Pre-trip travel requisition submission with estimated cost planner.
   - Travel itinerary viewer (flight, hotel, transport details).
   - Digital receipt upload & expense claim submission.
   - Track personal synchronized device shipments.

---

## 🎨 Dynamic Themes

- 🌙 **Midnight**: Apple OLED dark mode with deep black glassmorphism.
- ☀️ **Daylight**: Apple Studio Light mode with high contrast.
- 🪐 **Cosmic**: Cyberpunk dark mode with purple/indigo neon glow.

---

## 📱 Mobile Support (Android & iPhone)

- Full responsive design with **iOS safe area insets** (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).
- Touch-friendly mobile drawer menu and bottom navigation bar.

---

## 🚀 How to Run

### 1. PostgreSQL Database
```sql
CREATE DATABASE workforce_travel;
```

### 2. Launch Backend (Port 8080)
```cmd
start-backend.bat
```

### 3. Launch Frontend (Port 4200)
```cmd
start-frontend.bat
```

Access the app at **http://localhost:4200**
