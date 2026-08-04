import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, catchError } from 'rxjs';

export interface TravelRequest {
  id?: number;
  employeeName: string;
  employeeRole: string;
  destination: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  purpose: string;
  estimatedCost: number;
  flightClass: string;
  hotelDailyRate: number;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED' | 'POLICY_VIOLATION';
  policyViolations?: string;
  roiScore?: number;
  createdAt?: string;
}

export interface PreferredVendor {
  id: number;
  name: string;
  category: 'FLIGHT' | 'HOTEL' | 'GROUND_TRANSPORT';
  corporateRate: number;
  standardRate: number;
  discountPercentage: number;
  rating: number;
  badges: string[];
}

export interface LogisticsAsset {
  id: number;
  assetName: string;
  serialNumber: string;
  destinationVenue: string;
  syncedEmployee: string;
  targetDeliveryDate: string;
  trackingCode: string;
  status: 'IN_TRANSIT' | 'DELIVERED' | 'CUSTOMS_CLEARANCE' | 'DELAYED';
}

export interface DisruptionNotification {
  id: number;
  title: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  timestamp: string;
  category: 'FLIGHT' | 'HOTEL' | 'LOGISTICS' | 'RISK';
}

export interface TravelerRiskLocation {
  id: number;
  employeeName: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  threatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: 'SAFE' | 'ALERT' | 'ASSISTANCE_REQUESTED';
}

export interface ExpenseClaim {
  id: number;
  employeeName: string;
  vendorName: string;
  category: string;
  date: string;
  amount: number;
  taxAmount: number;
  ocrConfidence: number;
  auditStatus: 'PENDING_AUDIT' | 'APPROVED_PAYOUT' | 'REJECTED_FLAGGED';
  matchedItineraryId?: number;
}

export interface AnalyticsSummary {
  totalSpend: number;
  policyComplianceRate: number;
  activeTripsCount: number;
  savingsFromCorporateRates: number;
  spendByDepartment: { department: string; spend: number }[];
  policyViolationBreakdown: { reason: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class TravelLogisticsService {
  private apiUrl = 'http://localhost:8080/api';
  private activeRoleSubject = new BehaviorSubject<string>('EMPLOYEE');
  public activeRole$ = this.activeRoleSubject.asObservable();

  // Mock initial state in case backend is offline
  private requests: TravelRequest[] = [
    {
      id: 101,
      employeeName: 'Sarah Jenkins',
      employeeRole: 'Senior AI Engineer',
      destination: 'Tokyo, Japan',
      countryCode: 'JP',
      startDate: '2026-08-15',
      endDate: '2026-08-22',
      purpose: 'Keynote Demo at APAC Developer Conference & Prototype Sync',
      estimatedCost: 3450,
      flightClass: 'Economy Premium',
      hotelDailyRate: 280,
      status: 'APPROVED',
      roiScore: 94,
      createdAt: '2026-08-01'
    },
    {
      id: 102,
      employeeName: 'Marcus Vance',
      employeeRole: 'Global Supply Chain Lead',
      destination: 'Frankfurt, Germany',
      countryCode: 'DE',
      startDate: '2026-08-18',
      endDate: '2026-08-25',
      purpose: 'Logistics Facility Audit & Keynote Vendor Summit',
      estimatedCost: 5200,
      flightClass: 'Business',
      hotelDailyRate: 420,
      status: 'POLICY_VIOLATION',
      policyViolations: 'Hotel daily rate ($420) exceeds policy cap ($350); Business Class flight requires VP sign-off',
      roiScore: 82,
      createdAt: '2026-08-03'
    },
    {
      id: 103,
      employeeName: 'Elena Rostova',
      employeeRole: 'Enterprise Security Director',
      destination: 'London, United Kingdom',
      countryCode: 'GB',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
      purpose: 'Cybersecurity Executive Briefing & Data Sovereign Audit',
      estimatedCost: 2890,
      flightClass: 'Economy Premium',
      hotelDailyRate: 310,
      status: 'APPROVED',
      roiScore: 98,
      createdAt: '2026-07-28'
    }
  ];

  private vendors: PreferredVendor[] = [
    { id: 1, name: 'Japan Airlines (JAL)', category: 'FLIGHT', corporateRate: 1250, standardRate: 1800, discountPercentage: 30, rating: 4.9, badges: ['Preferred Corporate Rate', 'Carbon Neutral'] },
    { id: 2, name: 'Lufthansa Group', category: 'FLIGHT', corporateRate: 1400, standardRate: 1950, discountPercentage: 28, rating: 4.8, badges: ['Flex Rebooking', 'Priority Lounge'] },
    { id: 3, name: 'Park Hyatt Tokyo', category: 'HOTEL', corporateRate: 280, standardRate: 450, discountPercentage: 37, rating: 4.9, badges: ['Includes Breakfast', 'Late Checkout'] },
    { id: 4, name: 'Grand Hyatt Berlin', category: 'HOTEL', corporateRate: 320, standardRate: 480, discountPercentage: 33, rating: 4.7, badges: ['Corporate Partner', 'Executive Club'] },
    { id: 5, name: 'Sixt Executive Chauffeur', category: 'GROUND_TRANSPORT', corporateRate: 110, standardRate: 160, discountPercentage: 31, rating: 4.9, badges: ['EV Fleet', 'Instant Dispatch'] }
  ];

  private logisticsAssets: LogisticsAsset[] = [
    { id: 1, assetName: 'Apple Vision Pro Gen-2 Prototype #08', serialNumber: 'AVP-2026-X99', destinationVenue: 'Tokyo Midtown Hall', syncedEmployee: 'Sarah Jenkins', targetDeliveryDate: '2026-08-14', trackingCode: 'LOG-JP-884920', status: 'IN_TRANSIT' },
    { id: 2, assetName: 'Secure Edge AI Server Hardware Rack', serialNumber: 'SRV-884-ENC', destinationVenue: 'Frankfurt Hub Center', syncedEmployee: 'Marcus Vance', targetDeliveryDate: '2026-08-17', trackingCode: 'LOG-DE-993214', status: 'CUSTOMS_CLEARANCE' }
  ];

  private disruptions: DisruptionNotification[] = [
    { id: 1, title: 'Flight JL006 Delayed (45m)', message: 'JAL Flight JL006 to Tokyo Haneda delayed due to weather. Connecting shuttle updated.', severity: 'MEDIUM', timestamp: '10 mins ago', category: 'FLIGHT' },
    { id: 2, title: 'Asset Delivered to Venue', message: 'Prototype #08 delivered and signed by Tokyo Midtown Logistics Desk.', severity: 'INFO', timestamp: '1 hour ago', category: 'LOGISTICS' },
    { id: 3, title: 'Geopolitical Risk Alert: Frankfurt', message: 'Transit strike scheduled in Frankfurt on Aug 19. Alternative chauffeur booked.', severity: 'HIGH', timestamp: '3 hours ago', category: 'RISK' }
  ];

  private riskLocations: TravelerRiskLocation[] = [
    { id: 1, employeeName: 'Sarah Jenkins', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, threatLevel: 'LOW', status: 'SAFE' },
    { id: 2, employeeName: 'Marcus Vance', city: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821, threatLevel: 'MODERATE', status: 'ALERT' },
    { id: 3, employeeName: 'Alex Rivera', city: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918, threatLevel: 'HIGH', status: 'ASSISTANCE_REQUESTED' }
  ];

  private expenses: ExpenseClaim[] = [
    { id: 1, employeeName: 'Sarah Jenkins', vendorName: 'Tokyo Metro Express', category: 'Ground Transport', date: '2026-08-02', amount: 48.50, taxAmount: 4.85, ocrConfidence: 98.4, auditStatus: 'APPROVED_PAYOUT', matchedItineraryId: 101 },
    { id: 2, employeeName: 'Marcus Vance', vendorName: 'Lufthansa Executive Dining', category: 'Meals & Entertaining', date: '2026-08-03', amount: 185.00, taxAmount: 24.13, ocrConfidence: 95.2, auditStatus: 'PENDING_AUDIT', matchedItineraryId: 102 }
  ];

  constructor(private http: HttpClient) {}

  setRole(role: string) {
    this.activeRoleSubject.next(role);
  }

  getTravelRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/travel-requests`).pipe(
      catchError(() => of([...this.requests]))
    );
  }

  createTravelRequest(req: Partial<TravelRequest>): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(`${this.apiUrl}/travel-requests`, req).pipe(
      catchError(() => {
        let violation: string | undefined = undefined;
        if (req.hotelDailyRate && req.hotelDailyRate > 350) {
          violation = `Hotel daily rate ($${req.hotelDailyRate}) exceeds policy cap ($350)`;
        }
        if (req.flightClass === 'Business' || req.flightClass === 'First') {
          violation = (violation ? violation + '; ' : '') + `${req.flightClass} cabin class requires VP Approval`;
        }

        const newObj: TravelRequest = {
          id: Math.floor(Math.random() * 900) + 200,
          employeeName: req.employeeName || 'Current Employee',
          employeeRole: req.employeeRole || 'Senior Staff',
          destination: req.destination || 'San Francisco, USA',
          countryCode: req.countryCode || 'US',
          startDate: req.startDate || '2026-09-01',
          endDate: req.endDate || '2026-09-05',
          purpose: req.purpose || 'Business Travel',
          estimatedCost: req.estimatedCost || 2500,
          flightClass: req.flightClass || 'Economy Premium',
          hotelDailyRate: req.hotelDailyRate || 280,
          status: violation ? 'POLICY_VIOLATION' : 'PENDING_APPROVAL',
          policyViolations: violation,
          roiScore: Math.floor(Math.random() * 20) + 80,
          createdAt: new Date().toISOString().split('T')[0]
        };

        this.requests.unshift(newObj);
        return of(newObj);
      })
    );
  }

  updateRequestStatus(id: number, status: 'APPROVED' | 'REJECTED'): Observable<TravelRequest | null> {
    return this.http.put<TravelRequest>(`${this.apiUrl}/travel-requests/${id}/status`, { status }).pipe(
      catchError(() => {
        const item = this.requests.find(r => r.id === id);
        if (item) {
          item.status = status;
          return of(item);
        }
        return of(null);
      })
    );
  }

  getPreferredVendors(): Observable<PreferredVendor[]> {
    return this.http.get<PreferredVendor[]>(`${this.apiUrl}/vendors`).pipe(
      catchError(() => of([...this.vendors]))
    );
  }

  getLogisticsAssets(): Observable<LogisticsAsset[]> {
    return this.http.get<LogisticsAsset[]>(`${this.apiUrl}/logistics/assets`).pipe(
      catchError(() => of([...this.logisticsAssets]))
    );
  }

  getDisruptionNotifications(): Observable<DisruptionNotification[]> {
    return this.http.get<DisruptionNotification[]>(`${this.apiUrl}/notifications/disruptions`).pipe(
      catchError(() => of([...this.disruptions]))
    );
  }

  getTravelerRiskLocations(): Observable<TravelerRiskLocation[]> {
    return this.http.get<TravelerRiskLocation[]>(`${this.apiUrl}/risk/travelers`).pipe(
      catchError(() => of([...this.riskLocations]))
    );
  }

  getExpenseClaims(): Observable<ExpenseClaim[]> {
    return this.http.get<ExpenseClaim[]>(`${this.apiUrl}/expenses`).pipe(
      catchError(() => of([...this.expenses]))
    );
  }

  processOcrScan(fileData: any): Observable<ExpenseClaim> {
    return this.http.post<ExpenseClaim>(`${this.apiUrl}/expenses/ocr`, fileData).pipe(
      catchError(() => {
        const newClaim: ExpenseClaim = {
          id: Math.floor(Math.random() * 800) + 300,
          employeeName: 'Sarah Jenkins',
          vendorName: 'Apple Store Midtown Tokyo',
          category: 'Event Hardware & Prototype Supplies',
          date: new Date().toISOString().split('T')[0],
          amount: 429.00,
          taxAmount: 42.90,
          ocrConfidence: 99.4,
          auditStatus: 'PENDING_AUDIT',
          matchedItineraryId: 101
        };
        this.expenses.unshift(newClaim);
        return of(newClaim);
      })
    );
  }

  approveReimbursement(claimId: number): Observable<ExpenseClaim | null> {
    return this.http.post<ExpenseClaim>(`${this.apiUrl}/expenses/${claimId}/reimburse`, {}).pipe(
      catchError(() => {
        const item = this.expenses.find(e => e.id === claimId);
        if (item) {
          item.auditStatus = 'APPROVED_PAYOUT';
          return of(item);
        }
        return of(null);
      })
    );
  }

  getAnalyticsSummary(): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(`${this.apiUrl}/analytics/roi`).pipe(
      catchError(() => of({
        totalSpend: 148500,
        policyComplianceRate: 94.2,
        activeTripsCount: 18,
        savingsFromCorporateRates: 42300,
        spendByDepartment: [
          { department: 'Engineering & Product', spend: 62000 },
          { department: 'Global Supply Chain', spend: 38000 },
          { department: 'Enterprise Sales', spend: 31000 },
          { department: 'Executive & Legal', spend: 17500 }
        ],
        policyViolationBreakdown: [
          { reason: 'Hotel Rate Above Cap', count: 12 },
          { reason: 'Unapproved Cabin Class', count: 5 },
          { reason: 'Late Booking (<7 Days)', count: 8 },
          { reason: 'Non-Preferred Vendor', count: 3 }
        ]
      }))
    );
  }
}
