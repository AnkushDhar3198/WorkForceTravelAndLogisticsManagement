import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith } from 'rxjs';

export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  designation: string;
  passkey?: string;
  twoFactorCode?: string;
  active: boolean;
}

export interface TravelRequest {
  id: number;
  employee: Employee;
  destination: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  purpose: string;
  estimatedBudget: number;
  flightClass: string;
  hotelDailyRate: number;
  mealAllowance: number;
  groundTransportBudget: number;
  status: string;
  policyViolations: string;
  policyComplianceScore: number;
  roiScore: number;
  managerRemarks: string;
  approvedBy: Employee;
  approvedAt: string;
  tripDurationDays: number;
  createdAt: string;
}

export interface Vendor {
  id: number;
  name: string;
  category: string;
  corporateRate: number;
  standardRate: number;
  rating: number;
  preferred: boolean;
  badges: string;
  region: string;
  discountPercentage: number;
}

export interface Shipment {
  id: number;
  assetName: string;
  serialNumber: string;
  destinationVenue: string;
  syncedEmployee: Employee;
  targetDeliveryDate: string;
  trackingCode: string;
  status: string;
  weightKg: number;
  shippingCarrier: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  severity: string;
  category: string;
  targetEmployee: Employee;
  readStatus: boolean;
  createdAt: string;
}

export interface TravelerLocation {
  id: number;
  employee: Employee;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  threatLevel: string;
  status: string;
  advisoryNotes: string;
  lastUpdated: string;
}

export interface ExpenseClaim {
  id: number;
  employee: Employee;
  travelRequest: TravelRequest;
  vendorName: string;
  category: string;
  expenseDate: string;
  amount: number;
  taxAmount: number;
  currency: string;
  ocrConfidence: number;
  auditStatus: string;
  auditRemarks: string;
  receiptFileName: string;
}

export interface DashboardAnalytics {
  totalApprovedSpend: number;
  activeTripsCount: number;
  totalReimbursed: number;
  policyComplianceRate: number;
  estimatedCorporateSavings: number;
  spendByDepartment: { department: string; spend: number }[];
  spendByCategory: { category: string; spend: number }[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private get baseUrl(): string {
    if (typeof window !== 'undefined') {
      const globalEnvUrl = (window as any)['ENV_API_URL'];
      if (globalEnvUrl) return `${globalEnvUrl}/api`;
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return 'https://workforce-travel-backend.onrender.com/api';
      }
    }
    return 'http://localhost:8080/api';
  }

  constructor(private http: HttpClient) {}

  // Analytics
  getDashboardAnalytics(): Observable<DashboardAnalytics> {
    return this.http.get<DashboardAnalytics>(`${this.baseUrl}/analytics/dashboard`);
  }

  // Employees
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/employees`);
  }

  // Travel Requests
  getTravelRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(`${this.baseUrl}/travel-requests`);
  }

  createTravelRequest(request: any): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(`${this.baseUrl}/travel-requests`, request);
  }

  updateTravelRequestStatus(id: number, payload: any): Observable<TravelRequest> {
    return this.http.put<TravelRequest>(`${this.baseUrl}/travel-requests/${id}/status`, payload);
  }

  // Vendors (BRD FR14)
  getVendors(): Observable<Vendor[]> {
    return this.http.get<Vendor[]>(`${this.baseUrl}/vendors`);
  }

  createVendor(vendor: any): Observable<Vendor> {
    return this.http.post<Vendor>(`${this.baseUrl}/vendors`, vendor);
  }

  deleteVendor(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/vendors/${id}`);
  }

  // Shipments (BRD FR6)
  getShipments(): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(`${this.baseUrl}/shipments`);
  }

  createShipment(shipment: any): Observable<Shipment> {
    return this.http.post<Shipment>(`${this.baseUrl}/shipments`, shipment);
  }

  updateShipmentStatus(id: number, payload: any): Observable<Shipment> {
    return this.http.put<Shipment>(`${this.baseUrl}/shipments/${id}/status`, payload);
  }

  // Notifications
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications`);
  }

  markNotificationRead(id: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  // Risk / Traveler Locations (BRD FR12)
  getTravelerLocations(): Observable<TravelerLocation[]> {
    return this.http.get<TravelerLocation[]>(`${this.baseUrl}/risk/travelers`);
  }

  triggerSos(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/risk/sos`, payload);
  }

  // Expenses (BRD FR8 & FR9)
  getExpenses(): Observable<ExpenseClaim[]> {
    return this.http.get<ExpenseClaim[]>(`${this.baseUrl}/expenses`);
  }

  createExpense(expense: any): Observable<ExpenseClaim> {
    return this.http.post<ExpenseClaim>(`${this.baseUrl}/expenses`, expense);
  }

  auditExpense(id: number, payload: any): Observable<ExpenseClaim> {
    return this.http.put<ExpenseClaim>(`${this.baseUrl}/expenses/${id}/audit`, payload);
  }
}
