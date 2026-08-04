#  Apple Enterprise | Workforce Travel & Logistics Management System

An enterprise full-stack platform built with an **Angular** frontend styled in **Apple website aesthetics & animations** and a **Java Spring Boot 3** REST API backend, implementing all 10 core business user stories.

---

## 🌟 Key Features & User Stories Implemented

1. **Pre-Trip Travel Request Creation**: Define trip parameters including destination, travel dates, business purpose, flight class, and hotel daily budgets.
2. **Automated Policy Engine**: Pre-check travel parameters against regional hotel caps ($350/night) and cabin class rules, flagging policy violations automatically before committing budget.
3. **Managerial Approval Workflow**: Interactive dashboard for approving managers with real-time ROI scores, cost vs value metrics, and 1-click Approve/Reject actions.
4. **Preferred Vendor Selection**: Access corporate rates with negotiated discounts (30%+ savings) across preferred airlines, hotel chains, and executive ground transportation.
5. **Asset Shipment & Synchronization**: Coordinate and track physical hardware asset dispatches (e.g. prototypes, event equipment) synchronized with employee travel itineraries.
6. **Real-Time Disruption Notification Hub**: Live updates for flight delays, hotel confirmations, shipment deliveries, and transit alerts.
7. **Duty of Care & Traveler Risk Monitoring**: Interactive risk map radar tracking active employee coordinates, regional threat levels, and 1-click emergency SOS support dispatch.
8. **Post-Trip Expense Reporting via OCR**: Optical Character Recognition scanner extracting vendor, date, amount, tax, and auto-matching claims to trip itineraries with high confidence scores.
9. **Expense Auditing & Bank Reimbursements**: Finance team auditing workspace with fraud prevention checks and 1-click direct bank payout processing.
10. **Executive Travel ROI & Reporting**: Consolidated analytics charts on departmental spend, corporate savings, policy violation breakdowns, and overall travel ROI.

---

## 📐 Technology Stack

- **Frontend**: Angular 18 (Standalone Components, Reactive State, RxJS, HttpClient)
- **Design & Styling**: Apple Website Aesthetics (SF Pro / Inter typography, dark glassmorphism `backdrop-blur-2xl`, glowing metrics, custom animations)
- **Backend**: Java 17 + Spring Boot 3.3.1 (Spring Web, Spring Data JPA, H2 Database)
- **Database**: H2 In-Memory Database (Zero-config local execution out of the box; supports PostgreSQL)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Java OpenJDK**: v17 or higher
- **Maven**: 3.8+ (or included Maven runner)

### 2. Running Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
> The Spring Boot REST API will start on **`http://localhost:8080`**. H2 Console is available at **`http://localhost:8080/h2-console`**.

### 3. Running Frontend (Angular)
```bash
cd frontend
npm install
npm start
```
> The Angular app will run on **`http://localhost:4200`**.

---

## 🐙 Uploading / Pushing to a New GitHub Repository

Follow these step-by-step commands to push this project to a new repository on GitHub:

```bash
# 1. Initialize git in project root
git init

# 2. Add all files
git add .

# 3. Commit changes
git commit -m "Initial commit: Fullstack Workforce Travel & Logistics System (Angular + Spring Boot + Apple UI)"

# 4. Rename main branch
git branch -M main

# 5. Link your new GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Workforce-Travel-Logistics-Management.git

# 6. Push to GitHub
git push -u origin main
```
