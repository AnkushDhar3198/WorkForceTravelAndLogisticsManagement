import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  phoneVerified?: boolean;
  active: boolean;
}

export interface TravelRequest {
  id: number;
  requestId: string;
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
  justificationText: string;
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

export interface Booking {
  id: number;
  travelRequest: TravelRequest;
  employee: Employee;
  bookingType: string;
  pnrCode: string;
  confirmationNumber: string;
  vendorName: string;
  bookingDate: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDateTime: string;
  arrivalDateTime: string;
  flightNumber: string;
  cabinClass: string;
  seatNumber: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  vehicleType: string;
  pickupLocation: string;
  dropLocation: string;
  amount: number;
  currency: string;
  status: string;
  notes: string;
  createdAt: string;
}

export interface TravelDocument {
  id: number;
  employee: Employee;
  documentType: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  expiryDate: string;
  description: string;
  active: boolean;
  uploadedAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  actionType: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface DashboardAnalytics {
  totalApprovedSpend: number;
  activeTripsCount: number;
  totalReimbursed: number;
  policyComplianceRate: number;
  estimatedCorporateSavings: number;
  ytdSpend: number;
  totalAllocatedBudget: number;
  spendByDepartment: { department: string; spend: number; budget: number }[];
  spendByCategory: { category: string; spend: number }[];
  spendByVendor: { vendor: string; spend: number }[];
  monthlyTrend: { month: string; spend: number }[];
  violationTrend: Record<string, number>;
}

export interface ReimbursementExport {
  message: string;
  exportedCount: number;
  totalAmount: number;
  exportTimestamp: string;
  records: any[];
  csvContent: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private get baseUrl(): string {
    if (typeof window !== 'undefined') {
      const globalEnvUrl = (window as any)['ENV_API_URL'];
      if (globalEnvUrl) return `${globalEnvUrl}/api`;
      const host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        if (host.endsWith('.onrender.com')) {
          return 'https://workforce-travel-backend.onrender.com/api';
        }
        return `http://${host}:8080/api`;
      }
    }
    return 'http://localhost:8080/api';
  }

  constructor(private http: HttpClient) {}

  // Analytics
  getDashboardAnalytics(): Observable<DashboardAnalytics> {
    return this.http.get<DashboardAnalytics>(`${this.baseUrl}/analytics/dashboard`);
  }

  getDepartmentSummary(department: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/department/${encodeURIComponent(department)}`);
  }

  getAnalyticsReport(filters: {startDate?: string; endDate?: string; department?: string; vendor?: string}): Observable<any> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.department) params = params.set('department', filters.department);
    if (filters.vendor) params = params.set('vendor', filters.vendor);
    return this.http.get(`${this.baseUrl}/analytics/reports`, { params });
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

  // Vendors (US-09)
  getVendors(): Observable<Vendor[]> {
    return this.http.get<Vendor[]>(`${this.baseUrl}/vendors`);
  }

  createVendor(vendor: any): Observable<Vendor> {
    return this.http.post<Vendor>(`${this.baseUrl}/vendors`, vendor);
  }

  deleteVendor(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/vendors/${id}`);
  }

  // Shipments
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

  // Risk / Traveler Locations (US-12, US-13)
  getTravelerLocations(): Observable<TravelerLocation[]> {
    return this.http.get<TravelerLocation[]>(`${this.baseUrl}/risk/travelers`);
  }

  triggerSos(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sos/trigger`, payload);
  }

  // Expenses (US-14, US-15, US-16)
  getExpenses(): Observable<ExpenseClaim[]> {
    return this.http.get<ExpenseClaim[]>(`${this.baseUrl}/expenses`);
  }

  createExpense(expense: any): Observable<ExpenseClaim> {
    return this.http.post<ExpenseClaim>(`${this.baseUrl}/expenses`, expense);
  }

  auditExpense(id: number, payload: any): Observable<ExpenseClaim> {
    return this.http.put<ExpenseClaim>(`${this.baseUrl}/expenses/${id}/audit`, payload);
  }

  // Bookings (US-08)
  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/bookings`);
  }

  getBookingsByTrip(travelRequestId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/bookings/trip/${travelRequestId}`);
  }

  getBookingsByEmployee(employeeId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/bookings/employee/${employeeId}`);
  }

  createBooking(booking: any): Observable<Booking> {
    return this.http.post<Booking>(`${this.baseUrl}/bookings`, booking);
  }

  updateBookingStatus(id: number, payload: any): Observable<Booking> {
    return this.http.put<Booking>(`${this.baseUrl}/bookings/${id}/status`, payload);
  }

  // Documents (US-02)
  getDocuments(): Observable<TravelDocument[]> {
    return this.http.get<TravelDocument[]>(`${this.baseUrl}/documents`);
  }

  getDocumentsByEmployee(employeeId: number): Observable<TravelDocument[]> {
    return this.http.get<TravelDocument[]>(`${this.baseUrl}/documents/employee/${employeeId}`);
  }

  uploadDocument(payload: any): Observable<TravelDocument> {
    return this.http.post<TravelDocument>(`${this.baseUrl}/documents/upload`, payload);
  }

  downloadDocument(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/documents/${id}/download`);
  }

  replaceDocument(id: number, payload: any): Observable<TravelDocument> {
    return this.http.put<TravelDocument>(`${this.baseUrl}/documents/${id}`, payload);
  }

  deleteDocument(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/documents/${id}`);
  }

  // Audit Logs (US-20)
  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.baseUrl}/audit-logs`);
  }

  getFilteredAuditLogs(filters: {actionType?: string; entityType?: string; userId?: number}): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (filters.actionType) params = params.set('actionType', filters.actionType);
    if (filters.entityType) params = params.set('entityType', filters.entityType);
    if (filters.userId) params = params.set('userId', filters.userId.toString());
    return this.http.get<AuditLog[]>(`${this.baseUrl}/audit-logs/filter`, { params });
  }

  // Phone OTP Verification
  sendPhoneOtp(employeeId: number, phone?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/send-phone-otp`, { employeeId, phone });
  }

  verifyPhoneOtp(employeeId: number, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-phone-otp`, { employeeId, otp });
  }

  // Enhanced Notifications
  markAllNotificationsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/read-all`, {});
  }

  clearReadNotifications(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/notifications/clear`);
  }

  // Mandatory Phone SMS Login OTP
  sendLoginPhoneOtp(phone: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/send-phone-login-otp`, { phone });
  }

  verifyLoginPhoneOtp(phone: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-phone-login-otp`, { phone, otp });
  }

  // Reimbursements (US-17)
  exportReimbursements(payload?: any): Observable<ReimbursementExport> {
    return this.http.post<ReimbursementExport>(`${this.baseUrl}/reimbursements/export`, payload || {});
  }
}
