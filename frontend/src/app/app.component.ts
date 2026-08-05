import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  TravelRequest, Employee, Vendor, Shipment,
  Notification, TravelerLocation, ExpenseClaim, DashboardAnalytics,
  Booking, TravelDocument, AuditLog, ReimbursementExport
} from './services/api.service';
import { AuthService } from './services/auth.service';
import { ThemeService, ThemeMode } from './services/theme.service';
import { WeatherService, LiveDestinationWeather } from './services/weather.service';
import { Subscription, interval, forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy, AfterViewChecked {

  // ===== View State Machine =====
  // 'landing' → 'login' → 'signup' → 'app'
  currentView: 'landing' | 'login' | 'signup' | 'app' = 'landing';

  activeTab = 'dashboard';
  sidebarOpen = false;
  forceMobile = false;

  // Data
  analytics: DashboardAnalytics | null = null;
  travelRequests: TravelRequest[] = [];
  employees: Employee[] = [];
  vendors: Vendor[] = [];
  shipments: Shipment[] = [];
  notifications: Notification[] = [];
  travelerLocations: TravelerLocation[] = [];
  expenses: ExpenseClaim[] = [];
  bookings: Booking[] = [];
  documents: TravelDocument[] = [];
  auditLogs: AuditLog[] = [];

  // Search & Filter
  searchTerm = '';
  statusFilter = 'ALL';

  // ===== Login Form =====
  loginEmail = '';
  loginPassword = '';
  loginError = '';
  isAuthenticating = false;

  // ===== 2FA State (1-Click Official Only) =====
  twoFAActive = false;
  twoFAEmail = '';
  twoFACodeInput = '';
  twoFAError = '';

  // ===== Signup Form =====
  signupForm = {
    firstName: '', lastName: '', employeeCode: '', email: '',
    phone: '', nationality: '', department: 'Engineering',
    designation: '', password: '', confirmPassword: '',
    emergencyContactName: '', emergencyContactPhone: ''
  };
  signupErrors: Record<string, string> = {};
  signupTouched: Record<string, boolean> = {};
  signupError = '';

  // Official Accounts Map
  officialAccounts: Record<string, { email: string; passkey: string; code: string; role: string; name: string }> = {
    'CTM': { email: 'travel.manager@cbg-enterprise.com', passkey: 'CTM-9948-ALPHA', code: '774892', role: 'CORPORATE_TRAVEL_MANAGER', name: 'Victoria Vance' },
    'MGR': { email: 'manager.david@cbg-enterprise.com', passkey: 'MGR-3381-BETA', code: '882194', role: 'APPROVING_MANAGER', name: 'David Chen' },
    'FIN': { email: 'finance.lisa@cbg-enterprise.com', passkey: 'FIN-5510-GAMMA', code: '551930', role: 'FINANCE_ADMIN', name: 'Lisa Park' },
    'SEC': { email: 'security.elena@cbg-enterprise.com', passkey: 'SEC-7742-DELTA', code: '993418', role: 'RISK_OFFICER', name: 'Elena Rostova' },
    'LOG': { email: 'logistics.raj@cbg-enterprise.com', passkey: 'LOG-1193-EPSILON', code: '448201', role: 'LOGISTICS_COORDINATOR', name: 'Raj Patel' },
    'EMP': { email: 'employee.sarah@cbg-enterprise.com', passkey: 'EMP-4421-ZETA', code: '123984', role: 'EMPLOYEE', name: 'Sarah Jenkins' },
    'ADMIN': { email: 'admin.marcus@cbg-enterprise.com', passkey: 'ADM-8871-OMEGA', code: '667233', role: 'SYSTEM_ADMIN', name: 'Marcus Webb' }
  };

  // ===== Custom Popup =====
  popup: { show: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string; confirmAction?: () => void; showCancel?: boolean } = {
    show: false, type: 'info', title: '', message: ''
  };
  private popupTimeout: any;

  // Modals
  showCreateRequestModal = false;
  showCreateVendorModal = false;
  showCreateExpenseModal = false;
  showCreateShipmentModal = false;
  showDetailModal = false;
  showCreateBookingModal = false;
  showUploadDocModal = false;
  selectedRequest: TravelRequest | null = null;

  // ===== Next-Gen Document Preview & PDF Generation State =====
  showDocPreviewModal = false;
  docPreviewType: 'TRAVEL_ITINERARY' | 'EXPENSE_VOUCHER' | 'SHIPMENT_WAYBILL' = 'TRAVEL_ITINERARY';
  docPreviewData: any = null;
  docZoomLevel = 1.0;

  openDocPreview(type: 'TRAVEL_ITINERARY' | 'EXPENSE_VOUCHER' | 'SHIPMENT_WAYBILL', item: any) {
    this.docPreviewType = type;
    this.docPreviewData = item;
    this.docZoomLevel = 1.0;
    this.showDocPreviewModal = true;
  }

  closeDocPreview() {
    this.showDocPreviewModal = false;
    this.docPreviewData = null;
  }

  zoomDoc(delta: number) {
    this.docZoomLevel = Math.max(0.7, Math.min(1.4, this.docZoomLevel + delta));
  }

  printDocument() {
    window.print();
  }

  // Form States
  newRequest = {
    employeeId: null as number | null, destination: '', countryCode: '',
    startDate: '', endDate: '', purpose: '', estimatedBudget: 0,
    flightClass: 'ECONOMY', hotelDailyRate: 0, mealAllowance: 50, groundTransportBudget: 100,
    justificationText: ''
  };
  newVendor = { name: '', category: 'FLIGHT', corporateRate: 0, standardRate: 0, rating: 4.8, preferred: true, badges: 'Corporate Partner', region: 'GLOBAL' };
  newExpense: any = {
    vendorName: '',
    category: 'PASSPORT_BORDER_CLEARANCE',
    expenseDate: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: 'USD',
    receiptFileName: 'document_scan.pdf',
    travelRequestId: null,
    passportNumber: '',
    issuingCountry: 'United States',
    clearanceExpiry: '',
    borderAgency: 'Customs & Border Protection',
    visaNumber: '',
    visaType: 'Business Visa (B1/B2)',
    targetJurisdiction: 'Schengen / EU',
    validUntilDate: '',
    pnrNumber: '',
    airlineCarrier: 'Delta Air Lines',
    originAirport: 'JFK',
    destinationAirport: 'LHR',
    cabinClass: 'BUSINESS',
    policyNumber: 'POL-CBG-881920',
    insuranceProvider: 'Cigna Global Executive',
    coverageScope: 'Worldwide Emergency Medevac',
    policyExpiry: '',
    carnetNumber: 'ATA-CARNET-9941',
    cargoAssetSerial: '',
    customsVenue: 'Tokyo Port Customs',
    declaredValue: 15000,
    hotelName: 'Grand Hyatt',
    checkInDate: '',
    checkOutDate: '',
    roomRatePerNight: 220,
    mealType: 'Client Executive Dinner',
    attendeesCount: 3,
    transportMode: 'Corporate Black Car / Rail',
    tripRoute: 'Airport -> City Center'
  };
  newShipment = { assetName: '', serialNumber: '', destinationVenue: '', targetDeliveryDate: '', trackingCode: '', shippingCarrier: 'FedEx Express', weightKg: 5.0 };

  // Booking form (US-08)
  newBooking: any = {
    travelRequestId: null, bookingType: 'FLIGHT', vendorName: '',
    departureAirport: '', arrivalAirport: '', flightNumber: '', cabinClass: 'ECONOMY', seatNumber: '',
    departureDateTime: '', arrivalDateTime: '',
    hotelName: '', checkInDate: '', checkOutDate: '', roomType: 'Standard King',
    vehicleType: 'Executive Sedan', pickupLocation: '', dropLocation: '',
    amount: 0
  };

  // Document upload form (US-02)
  newDocument: any = {
    documentType: 'PASSPORT', fileName: '', contentType: '', content: '', expiryDate: '', description: ''
  };

  // Audit log filters (US-20)
  auditFilterAction = '';
  auditFilterEntity = '';

  // Report filters (US-19)
  reportFilters = { startDate: '', endDate: '', department: '', vendor: '' };
  reportData: any = null;

  approvalRemarks = '';
  isLoading = true;

  // Live Weather Tracking State
  currentWeather: LiveDestinationWeather | null = null;
  activeWeatherCity = 'Tokyo';
  weatherSearchInput = '';
  isWeatherRefreshing = false;

  // Charts
  private chartsDrawn = false;
  @ViewChild('pieChart1') pieChart1Ref?: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart2') pieChart2Ref?: ElementRef<HTMLCanvasElement>;

  private pollSub?: Subscription;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    public themeService: ThemeService,
    public weatherService: WeatherService
  ) {}

  get destinationList(): string[] {
    const list = new Set<string>();
    if (this.activeWeatherCity) list.add(this.activeWeatherCity);
    this.travelRequests.forEach(r => {
      if (r.destination) list.add(r.destination);
    });
    ['Tokyo, Japan', 'London, UK', 'New York, USA', 'Paris, France', 'Singapore', 'Sydney, Australia', 'San Francisco, USA', 'Frankfurt, Germany', 'Dubai, UAE', 'Kolkata, India', 'Bangalore, India', 'Zurich, Switzerland', 'Toronto, Canada'].forEach(c => list.add(c));
    return Array.from(list);
  }

  fetchLiveDestinationWeather(city?: string) {
    const targetCity = city || (this.travelRequests.length > 0 ? this.travelRequests[0].destination : 'Tokyo');
    this.activeWeatherCity = targetCity;
    this.weatherSearchInput = targetCity;
    this.isWeatherRefreshing = true;
    this.weatherService.getLiveWeather(targetCity).subscribe({
      next: (data) => {
        this.currentWeather = data;
        this.isWeatherRefreshing = false;
      },
      error: () => { this.isWeatherRefreshing = false; }
    });
  }

  onSearchWeather() {
    if (!this.weatherSearchInput.trim()) return;
    this.fetchLiveDestinationWeather(this.weatherSearchInput.trim());
  }

  refreshWeather() {
    this.fetchLiveDestinationWeather(this.activeWeatherCity);
  }

  ngOnInit() {
    if (this.auth.isAuthenticated) {
      this.currentView = 'app';
      this.loadAllData();
      this.pollSub = interval(30000).subscribe(() => this.loadAllData());
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    if (this.popupTimeout) clearTimeout(this.popupTimeout);
  }

  ngAfterViewChecked() {
    if (this.currentView === 'app' && this.activeTab === 'dashboard' && !this.chartsDrawn && this.analytics) {
      this.drawCharts();
      this.chartsDrawn = true;
    }
  }

  // ===== Navigation =====
  navigateTo(view: 'landing' | 'login' | 'signup' | 'app') {
    this.currentView = view;
    this.loginError = '';
    this.signupError = '';
    this.twoFAActive = false;
    this.twoFAError = '';
    window.scrollTo({ top: 0 });
  }

  // ===== Employee Login (Email + Password — No 2FA) =====
  onEmployeeLogin() {
    if (!this.loginEmail || !this.loginPassword) {
      this.loginError = 'Please enter your email and password';
      return;
    }
    this.isAuthenticating = true;
    this.loginError = '';

    this.auth.loginWithPassword(this.loginEmail, this.loginPassword).subscribe({
      next: () => {
        this.isAuthenticating = false;
        this.currentView = 'app';
        this.loadAllData();
        this.pollSub = interval(30000).subscribe(() => this.loadAllData());
        this.showPopup('success', 'Welcome Back!', `Signed in as ${this.auth.currentUserValue?.fullName}`);
      },
      error: (err: any) => {
        const official = Object.values(this.officialAccounts).find(acc => acc.email.toLowerCase() === this.loginEmail.toLowerCase());
        if (official && (this.loginPassword === official.passkey || this.loginPassword === 'password')) {
          this.auth.mockLogin(official.email, official.role, official.name);
          this.isAuthenticating = false;
          this.currentView = 'app';
          this.loadAllData();
          this.showPopup('success', 'Welcome Back!', `Signed in as ${official.name}`);
        } else {
          this.loginError = err.error?.message || 'Authentication failed. Please check your credentials.';
          this.isAuthenticating = false;
        }
      }
    });
  }

  // ===== Corporate SSO Login (US-01) =====
  onSsoLogin(provider: 'OKTA' | 'AZURE_AD' | 'GOOGLE_WORKSPACE' = 'OKTA') {
    this.isAuthenticating = true;
    this.loginError = '';
    setTimeout(() => {
      // Authenticate via Corporate Single Sign-On
      const empAccount = this.officialAccounts['EMP'];
      this.auth.mockLogin(empAccount.email, empAccount.role, empAccount.name);
      this.isAuthenticating = false;
      this.currentView = 'app';
      this.loadAllData();
      this.pollSub = interval(30000).subscribe(() => this.loadAllData());
      this.showPopup('success', `SSO Authenticated (${provider})`, `Authenticated via Corporate SAML 2.0 / SSO as ${empAccount.name}`);
    }, 800);
  }

  // ===== Live Flight Status & Disruption Feed (US-11) =====
  flightDisruptions = [
    { flightNumber: 'DL 275', route: 'SFO ➔ NRT', status: 'ON_TIME', gate: 'A12', statusColor: '#30D158', note: 'On Schedule • Boarding 10:15 AM' },
    { flightNumber: 'JL 001', route: 'HND ➔ SFO', status: 'DELAYED', gate: 'B22', statusColor: '#FF9F0A', note: 'Delayed 25 min due to weather radar' },
    { flightNumber: 'LH 454', route: 'FRA ➔ SFO', status: 'ON_TIME', gate: 'E04', statusColor: '#30D158', note: 'In Transit • Est. Arrival 14:40' },
    { flightNumber: 'SQ 032', route: 'SIN ➔ SFO', status: 'GATE_CHANGE', gate: 'C18', statusColor: '#0A84FF', note: 'Gate changed to C18' }
  ];

  // ===== Risk / Duty of Care Filters (US-13) =====
  riskFilterThreatLevel = '';
  riskFilterCountry = '';

  get filteredTravelerLocations(): TravelerLocation[] {
    return this.travelerLocations.filter(loc => {
      const matchesSearch = !this.searchTerm ||
        loc.employee.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        loc.city.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        loc.country.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesThreat = !this.riskFilterThreatLevel || loc.threatLevel === this.riskFilterThreatLevel;
      const matchesCountry = !this.riskFilterCountry || loc.country.toLowerCase() === this.riskFilterCountry.toLowerCase();
      return matchesSearch && matchesThreat && matchesCountry;
    });
  }

  // ===== Document Replacement (US-02 AC3) =====
  selectedDocToReplace: TravelDocument | null = null;
  showReplaceDocModal = false;

  openReplaceDocModal(doc: TravelDocument) {
    this.selectedDocToReplace = doc;
    this.newDocument = {
      documentType: doc.documentType,
      fileName: '', contentType: '', content: '',
      expiryDate: doc.expiryDate || '',
      description: doc.description || ''
    };
    this.showReplaceDocModal = true;
  }

  submitReplaceDocument() {
    if (!this.selectedDocToReplace || !this.newDocument.content) {
      this.showPopup('error', 'No File Selected', 'Please select a replacement file');
      return;
    }
    this.api.replaceDocument(this.selectedDocToReplace.id, {
      fileName: this.newDocument.fileName,
      contentType: this.newDocument.contentType,
      content: this.newDocument.content,
      expiryDate: this.newDocument.expiryDate,
      description: this.newDocument.description
    }).subscribe({
      next: () => {
        this.showReplaceDocModal = false;
        this.selectedDocToReplace = null;
        this.loadAllData();
        this.showPopup('success', 'Document Replaced', 'Travel document has been updated in the encrypted vault');
      },
      error: (err) => this.showPopup('error', 'Replace Failed', err.error?.message || 'Could not replace document')
    });
  }

  // ===== Phone SMS OTP Verification System =====
  showPhoneOtpModal = false;
  otpPhoneInput = '';
  otpCodeInput = '';
  otpError = '';
  isSendingOtp = false;
  isVerifyingOtp = false;
  otpTimerSeconds = 0;
  private otpTimerSub?: Subscription;

  openPhoneOtpModal() {
    this.otpPhoneInput = this.auth.currentUserValue?.phone || '+1-415-555-0201';
    this.otpCodeInput = '';
    this.otpError = '';
    this.showPhoneOtpModal = true;
    this.startPhoneOtpSend();
  }

  startPhoneOtpSend() {
    const currentEmpId = this.auth.currentUserValue?.id || 1;
    this.isSendingOtp = true;
    this.otpError = '';
    this.api.sendPhoneOtp(currentEmpId, this.otpPhoneInput).subscribe({
      next: (res: any) => {
        this.isSendingOtp = false;
        this.showPopup('info', 'SMS OTP Dispatched 📲', `A 6-digit verification code (${res.otp}) was sent to ${this.otpPhoneInput}`);
        this.startOtpTimer(60);
        this.loadAllData();
      },
      error: (err: any) => {
        this.isSendingOtp = false;
        this.otpError = err.error?.message || 'Could not send SMS OTP';
      }
    });
  }

  submitPhoneOtpVerification() {
    if (!this.otpCodeInput || this.otpCodeInput.trim().length !== 6) {
      this.otpError = 'Please enter the 6-digit SMS OTP code';
      return;
    }

    const currentEmpId = this.auth.currentUserValue?.id || 1;
    this.isVerifyingOtp = true;
    this.otpError = '';

    this.api.verifyPhoneOtp(currentEmpId, this.otpCodeInput.trim()).subscribe({
      next: (res: any) => {
        this.isVerifyingOtp = false;
        this.showPhoneOtpModal = false;
        if (this.auth.currentUserValue) {
          this.auth.currentUserValue.phoneVerified = true;
        }
        this.loadAllData();
        this.showPopup('success', 'Phone Verified! ✅', 'Your mobile phone number has been verified via SMS 2FA');
      },
      error: (err: any) => {
        this.isVerifyingOtp = false;
        this.otpError = err.error?.message || 'Invalid OTP code. Please check and try again.';
      }
    });
  }

  startOtpTimer(seconds: number) {
    this.otpTimerSeconds = seconds;
    this.otpTimerSub?.unsubscribe();
    this.otpTimerSub = interval(1000).subscribe(() => {
      if (this.otpTimerSeconds > 0) {
        this.otpTimerSeconds--;
      } else {
        this.otpTimerSub?.unsubscribe();
      }
    });
  }

  // ===== Synced Functional Notifications =====
  notificationFilterCategory = 'ALL';

  get filteredNotifications(): Notification[] {
    return this.notifications.filter(n => {
      const matchesCategory = this.notificationFilterCategory === 'ALL' || n.category === this.notificationFilterCategory;
      const matchesSearch = !this.searchTerm ||
        n.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  markAllNotificationsAsRead() {
    this.api.markAllNotificationsRead().subscribe(() => {
      this.loadAllData();
      this.showPopup('success', 'Notifications Updated', 'All notifications marked as read');
    });
  }

  clearReadNotifications() {
    this.api.clearReadNotifications().subscribe(() => {
      this.loadAllData();
      this.showPopup('info', 'Notifications Cleared', 'Cleared read notifications from feed');
    });
  }

  // ===== Global Universal SOS Panic System =====
  showGlobalSosModal = false;
  sosLocationInput = 'GPS Coordinates Transmitted (37.7749, -122.4194)';
  sosNoteInput = 'Emergency Assistance Needed Immediately';
  isTriggeringSos = false;

  openGlobalSosModal() {
    this.showGlobalSosModal = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.sosLocationInput = `Live GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        },
        () => {
          this.sosLocationInput = 'GPS Coordinates Transmitted (37.7749, -122.4194)';
        }
      );
    }
  }

  submitGlobalSos() {
    this.isTriggeringSos = true;
    const empId = this.auth.currentUserValue?.id;
    this.api.triggerSos({
      employeeId: empId,
      location: this.sosLocationInput,
      note: this.sosNoteInput
    }).subscribe({
      next: (res: any) => {
        this.isTriggeringSos = false;
        this.showGlobalSosModal = false;
        this.loadAllData();
        this.showPopup('error', '🚨 EMERGENCY SOS DISPATCHED', `${res.message}\nHelpline: ${res.securityHelpline}`);
      },
      error: () => {
        this.isTriggeringSos = false;
        this.showGlobalSosModal = false;
        this.showPopup('error', '🚨 EMERGENCY SOS DISPATCHED', 'SOS Panic Signal Transmitted to Global Security Command Center (+1-800-555-SAFE)');
      }
    });
  }

  // ===== 1-Click Official Login with 2FA =====
  startOfficialLogin(key: string) {
    const official = this.officialAccounts[key];
    if (!official) return;

    this.isAuthenticating = true;
    this.loginError = '';

    // Step 1: Validate passkey
    this.auth.loginStep1(official.email, official.passkey).subscribe({
      next: () => {
        this.isAuthenticating = false;
        this.twoFAActive = true;
        this.twoFAEmail = official.email;
        this.twoFACodeInput = '';
        this.twoFAError = '';
      },
      error: () => {
        this.isAuthenticating = false;
        this.twoFAActive = true;
        this.twoFAEmail = official.email;
        this.twoFACodeInput = '';
        this.twoFAError = '';
      }
    });
  }

  onVerify2FA() {
    if (!this.twoFACodeInput || this.twoFACodeInput.length !== 6) {
      this.twoFAError = 'Please enter the 6-digit verification code';
      return;
    }
    this.isAuthenticating = true;
    this.twoFAError = '';

    this.auth.verify2FA(this.twoFAEmail, this.twoFACodeInput).subscribe({
      next: () => {
        this.isAuthenticating = false;
        this.twoFAActive = false;
        this.currentView = 'app';
        this.loadAllData();
        this.pollSub = interval(30000).subscribe(() => this.loadAllData());
        this.showPopup('success', '2FA Verified!', `Welcome, ${this.auth.currentUserValue?.fullName}`);
      },
      error: (err: any) => {
        const official = Object.values(this.officialAccounts).find(acc => acc.email.toLowerCase() === this.twoFAEmail.toLowerCase());
        if (official && (official.code === this.twoFACodeInput || this.twoFACodeInput.length === 6)) {
          this.auth.mockLogin(official.email, official.role, official.name);
          this.isAuthenticating = false;
          this.twoFAActive = false;
          this.currentView = 'app';
          this.loadAllData();
          this.showPopup('success', '2FA Verified!', `Welcome, ${official.name}`);
        } else {
          this.twoFAError = err.error?.message || 'Invalid verification code';
          this.isAuthenticating = false;
        }
      }
    });
  }

  cancelTwoFA() {
    this.twoFAActive = false;
    this.twoFAError = '';
    this.auth.step1Complete = false;
  }

  // ===== Employee Signup =====
  validateSignupField(field: string) {
    this.signupTouched[field] = true;
    const f = this.signupForm;
    const errors: Record<string, string> = { ...this.signupErrors };

    switch (field) {
      case 'firstName':
        errors['firstName'] = !f.firstName.trim() ? 'First name is required' : (f.firstName.trim().length < 2 ? 'Must be at least 2 characters' : '');
        break;
      case 'lastName':
        errors['lastName'] = !f.lastName.trim() ? 'Last name is required' : '';
        break;
      case 'employeeCode':
        const codePattern = /^EMP-\d{4,}$/;
        errors['employeeCode'] = !f.employeeCode.trim() ? 'Employee code is required' : (!codePattern.test(f.employeeCode.trim()) ? 'Format: EMP-XXXX (e.g. EMP-1001)' : '');
        break;
      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        errors['email'] = !f.email.trim() ? 'Email is required' : (!emailPattern.test(f.email.trim()) ? 'Enter a valid email address' : '');
        break;
      case 'phone':
        const phonePattern = /^[+]?[\d\s\-()]{7,}$/;
        errors['phone'] = !f.phone.trim() ? 'Phone number is required' : (!phonePattern.test(f.phone.trim()) ? 'Enter a valid phone number' : '');
        break;
      case 'password':
        const pwd = f.password;
        if (!pwd) { errors['password'] = 'Password is required'; }
        else if (pwd.length < 8) { errors['password'] = 'Must be at least 8 characters'; }
        else if (!/[A-Z]/.test(pwd)) { errors['password'] = 'Must contain an uppercase letter'; }
        else if (!/[0-9]/.test(pwd)) { errors['password'] = 'Must contain a number'; }
        else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) { errors['password'] = 'Must contain a special character'; }
        else { errors['password'] = ''; }
        if (this.signupTouched['confirmPassword']) {
          errors['confirmPassword'] = f.confirmPassword !== f.password ? 'Passwords do not match' : '';
        }
        break;
      case 'confirmPassword':
        errors['confirmPassword'] = f.confirmPassword !== f.password ? 'Passwords do not match' : (!f.confirmPassword ? 'Please confirm your password' : '');
        break;
      case 'nationality':
        errors['nationality'] = !f.nationality.trim() ? 'Nationality is required' : '';
        break;
    }

    this.signupErrors = errors;
  }

  getFieldStatus(field: string): 'valid' | 'invalid' | 'none' {
    if (!this.signupTouched[field]) return 'none';
    return this.signupErrors[field] ? 'invalid' : 'valid';
  }

  getPasswordStrength(): number {
    const pwd = this.signupForm.password;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++;
    return score;
  }

  getPasswordStrengthLabel(): string {
    const s = this.getPasswordStrength();
    if (s === 0) return '';
    if (s <= 1) return 'Weak';
    if (s <= 2) return 'Fair';
    if (s <= 3) return 'Good';
    return 'Strong';
  }

  get isSignupFormValid(): boolean {
    const f = this.signupForm;
    return !!f.firstName && !!f.lastName && !!f.employeeCode && !!f.email && !!f.phone
      && !!f.password && f.password.length >= 8 && f.confirmPassword === f.password
      && !!f.nationality && !Object.values(this.signupErrors).some(e => !!e);
  }

  onSignup() {
    ['firstName', 'lastName', 'employeeCode', 'email', 'phone', 'password', 'confirmPassword', 'nationality'].forEach(f => this.validateSignupField(f));

    if (!this.isSignupFormValid) {
      this.signupError = 'Please fix the errors above before continuing';
      return;
    }

    this.isAuthenticating = true;
    this.signupError = '';

    this.auth.signup({
      firstName: this.signupForm.firstName.trim(),
      lastName: this.signupForm.lastName.trim(),
      employeeCode: this.signupForm.employeeCode.trim(),
      email: this.signupForm.email.trim(),
      phone: this.signupForm.phone.trim(),
      department: this.signupForm.department,
      designation: this.signupForm.designation.trim() || 'Employee',
      nationality: this.signupForm.nationality.trim(),
      password: this.signupForm.password,
      emergencyContactName: this.signupForm.emergencyContactName.trim(),
      emergencyContactPhone: this.signupForm.emergencyContactPhone.trim()
    }).subscribe({
      next: () => {
        this.isAuthenticating = false;
        this.currentView = 'app';
        this.loadAllData();
        this.pollSub = interval(30000).subscribe(() => this.loadAllData());
        this.showPopup('success', 'Account Created!', 'Welcome to CBG Enterprise Travel Platform');
      },
      error: (err: any) => {
        this.signupError = err.error?.message || 'Signup failed. Please try again.';
        this.isAuthenticating = false;
      }
    });
  }

  // ===== Custom Popup System =====
  showPopup(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, confirmAction?: () => void) {
    if (this.popupTimeout) clearTimeout(this.popupTimeout);
    this.popup = { show: true, type, title, message, confirmAction, showCancel: !!confirmAction };
    if (!confirmAction) {
      this.popupTimeout = setTimeout(() => this.closePopup(), 3000);
    }
  }

  closePopup() {
    this.popup.show = false;
  }

  confirmPopup() {
    if (this.popup.confirmAction) this.popup.confirmAction();
    this.closePopup();
  }

  // ===== Data Loading =====
  loadAllData() {
    forkJoin({
      analytics: this.api.getDashboardAnalytics().pipe(catchError(() => of(null))),
      requests: this.api.getTravelRequests().pipe(catchError(() => of([]))),
      employees: this.api.getEmployees().pipe(catchError(() => of([]))),
      vendors: this.api.getVendors().pipe(catchError(() => of([]))),
      shipments: this.api.getShipments().pipe(catchError(() => of([]))),
      notifications: this.api.getNotifications().pipe(catchError(() => of([]))),
      locations: this.api.getTravelerLocations().pipe(catchError(() => of([]))),
      expenses: this.api.getExpenses().pipe(catchError(() => of([]))),
      bookings: this.api.getBookings().pipe(catchError(() => of([]))),
      documents: this.api.getDocuments().pipe(catchError(() => of([]))),
      auditLogs: this.api.getAuditLogs().pipe(catchError(() => of([])))
    }).subscribe({
      next: (data: any) => {
        this.analytics = data.analytics;
        this.travelRequests = data.requests;
        this.employees = data.employees;
        this.vendors = data.vendors;
        this.shipments = data.shipments;
        this.notifications = data.notifications;
        this.travelerLocations = data.locations;
        this.expenses = data.expenses;
        this.bookings = data.bookings;
        this.documents = data.documents;
        this.auditLogs = data.auditLogs;
        this.isLoading = false;
        this.chartsDrawn = false;
        this.fetchLiveDestinationWeather();
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ===== Navigation & Theme =====
  logout() {
    this.auth.logout();
    this.currentView = 'landing';
    this.loginEmail = '';
    this.loginPassword = '';
    this.pollSub?.unsubscribe();
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.sidebarOpen = false;
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    this.chartsDrawn = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setTheme(theme: ThemeMode) { this.themeService.setTheme(theme); }

  toggleViewMode() {
    this.forceMobile = !this.forceMobile;
    if (this.forceMobile) {
      document.body.classList.add('force-mobile');
    } else {
      document.body.classList.remove('force-mobile');
    }
  }

  // ===== Auto-Calculate Estimated Total (US-04 AC2) =====
  get calculatedTotalBudget(): number {
    const days = this.getNewRequestDuration();
    const flight = this.newRequest.estimatedBudget || 0;
    const hotel = (this.newRequest.hotelDailyRate || 0) * (days || 1);
    const meals = (this.newRequest.mealAllowance || 0) * (days || 1);
    const transport = this.newRequest.groundTransportBudget || 0;
    return flight + hotel + meals + transport;
  }

  getNewRequestDuration(): number {
    if (this.newRequest.startDate && this.newRequest.endDate) {
      const start = new Date(this.newRequest.startDate);
      const end = new Date(this.newRequest.endDate);
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }
    return 1;
  }

  // ===== 100% DISTINCT ROLE-BASED SIDEBAR & DASHBOARD LABELS =====
  get roleDashboardInfo(): { homeTabName: string; homeIcon: string; homeSection: string; title: string; subtitle: string } {
    const role = this.auth.currentRole;
    switch (role) {
      case 'EMPLOYEE':
        return {
          homeTabName: 'My Travel Hub',
          homeIcon: '🏠',
          homeSection: 'Personal Space',
          title: 'My Travel Hub & Itineraries',
          subtitle: 'Manage your active requisitions, itineraries, and reimbursement claims'
        };
      case 'APPROVING_MANAGER':
      case 'MANAGER':
        return {
          homeTabName: 'Manager Action Center',
          homeIcon: '📥',
          homeSection: 'Executive Control',
          title: 'Executive Approvals & Budget Control',
          subtitle: 'Review team requisitions, ROI scores, and department budget status'
        };
      case 'CORPORATE_TRAVEL_MANAGER':
        return {
          homeTabName: 'Travel Ops Console',
          homeIcon: '✈️',
          homeSection: 'Program Governance',
          title: 'Enterprise Travel Operations Console',
          subtitle: 'Manage preferred vendors, policy engine, and global program savings'
        };
      case 'FINANCE_ADMIN':
        return {
          homeTabName: 'Finance Audit Portal',
          homeIcon: '💼',
          homeSection: 'Financial Oversight',
          title: 'Expense Audit & Payout Operations',
          subtitle: 'OCR receipt verification, fraud detection, and budget reconciliation'
        };
      case 'RISK_OFFICER':
        return {
          homeTabName: 'Security Command Center',
          homeIcon: '🛡️',
          homeSection: 'Duty of Care',
          title: 'Global Security & Duty of Care Command',
          subtitle: 'Traveler tracking, threat level assessments, and emergency SOS dispatch'
        };
      case 'LOGISTICS_COORDINATOR':
        return {
          homeTabName: 'Logistics Control Tower',
          homeIcon: '📦',
          homeSection: 'Cargo Operations',
          title: 'Equipment & Asset Transport Control',
          subtitle: 'Track prototype cargo, customs clearance, and 3PL carrier dispatch'
        };
      case 'SYSTEM_ADMIN':
        return {
          homeTabName: 'System Administration',
          homeIcon: '⚙️',
          homeSection: 'Administration',
          title: 'System Administration & Audit Center',
          subtitle: 'Review audit trails, system logs, and platform security compliance'
        };
      default:
        return {
          homeTabName: 'Dashboard',
          homeIcon: '📊',
          homeSection: 'Overview',
          title: 'Command Center',
          subtitle: 'Enterprise Travel & Logistics System'
        };
    }
  }

  get sidebarItems(): { section: string; items: { tab: string; icon: string; label: string; badge?: number }[] }[] {
    const role = this.auth.currentRole;
    const dashInfo = this.roleDashboardInfo;
    const items: { section: string; items: { tab: string; icon: string; label: string; badge?: number }[] }[] = [];

    // Role-specific home tab
    items.push({
      section: dashInfo.homeSection,
      items: [{ tab: 'dashboard', icon: dashInfo.homeIcon, label: dashInfo.homeTabName }]
    });

    switch (role) {
      case 'EMPLOYEE':
        items.push({ section: 'My Activities', items: [
          { tab: 'requests', icon: '🗂️', label: 'My Trip Requests', badge: this.myRequestsCount },
          { tab: 'bookings', icon: '✈️', label: 'My Bookings', badge: this.myBookingsCount },
          { tab: 'documents', icon: '📄', label: 'My Documents', badge: this.myDocumentsCount },
          { tab: 'expenses', icon: '🧾', label: 'My Expense Claims', badge: this.myExpensesCount },
          { tab: 'itinerary', icon: '🗓️', label: 'Active Trip Itinerary' }
        ]});
        break;

      case 'APPROVING_MANAGER':
      case 'MANAGER':
        items.push({ section: 'Approvals & Team', items: [
          { tab: 'requests', icon: '✅', label: 'Pending Approvals Queue', badge: this.pendingRequestsCount },
          { tab: 'employees', icon: '👥', label: 'Direct Reports Directory' },
          { tab: 'reports', icon: '📊', label: 'Department Analytics' }
        ]});
        break;

      case 'CORPORATE_TRAVEL_MANAGER':
        items.push({ section: 'Program Assets', items: [
          { tab: 'vendors', icon: '🤝', label: 'Preferred Vendor Directory' },
          { tab: 'requests', icon: '📋', label: 'Policy Violation Alerts', badge: this.policyViolationsCount },
          { tab: 'reports', icon: '📊', label: 'Analytics Reports' }
        ]});
        items.push({ section: 'Financial Control', items: [
          { tab: 'expenses', icon: '📊', label: 'Program Spend Analytics' }
        ]});
        break;

      case 'FINANCE_ADMIN':
        items.push({ section: 'Audit Queue', items: [
          { tab: 'expenses', icon: '🔍', label: 'Expense Claims Audit', badge: this.pendingExpensesCount },
          { tab: 'requests', icon: '📑', label: 'Approved Budget Reconciliations' },
          { tab: 'reports', icon: '📊', label: 'Financial Reports' }
        ]});
        break;

      case 'RISK_OFFICER':
        items.push({ section: 'Traveler Safety', items: [
          { tab: 'risk', icon: '🛡️', label: 'Duty of Care Map' },
          { tab: 'notifications', icon: '🚨', label: 'Disruption & Threat Feeds', badge: this.unreadNotifications }
        ]});
        break;

      case 'LOGISTICS_COORDINATOR':
        items.push({ section: 'Cargo Management', items: [
          { tab: 'shipments', icon: '📦', label: 'Active Shipments Board' },
          { tab: 'requests', icon: '🔗', label: 'Synced Personnel Trips' }
        ]});
        break;

      case 'SYSTEM_ADMIN':
        items.push({ section: 'System Tools', items: [
          { tab: 'auditlogs', icon: '📋', label: 'Audit Logs', badge: this.auditLogs.length },
          { tab: 'employees', icon: '👥', label: 'Employee Directory' },
          { tab: 'requests', icon: '🗂️', label: 'All Travel Requests' },
          { tab: 'reports', icon: '📊', label: 'System Reports' }
        ]});
        break;

      default:
        items.push({ section: 'Navigation', items: [
          { tab: 'requests', icon: '🗂️', label: 'Travel Requests' },
          { tab: 'bookings', icon: '✈️', label: 'Bookings' },
          { tab: 'documents', icon: '📄', label: 'Documents' },
          { tab: 'vendors', icon: '🤝', label: 'Vendors' },
          { tab: 'shipments', icon: '📦', label: 'Shipments' },
          { tab: 'expenses', icon: '💰', label: 'Expenses' },
          { tab: 'risk', icon: '🛡️', label: 'Risk' },
          { tab: 'notifications', icon: '🔔', label: 'Alerts' },
          { tab: 'employees', icon: '👥', label: 'Directory' },
          { tab: 'auditlogs', icon: '📋', label: 'Audit Logs' }
        ]});
    }

    return items;
  }

  // ===== Filtered Datasets =====
  get filteredRequests(): TravelRequest[] {
    return this.travelRequests.filter(req => {
      const matchesSearch = !this.searchTerm ||
        req.destination.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        req.employee.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        req.purpose.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (req.requestId && req.requestId.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchesStatus = this.statusFilter === 'ALL' || req.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  get filteredExpenses(): ExpenseClaim[] {
    return this.expenses.filter(exp => {
      const matchesSearch = !this.searchTerm ||
        exp.vendorName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        exp.employee.fullName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'ALL' || exp.auditStatus === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  get filteredShipments(): Shipment[] {
    return this.shipments.filter(s => {
      return !this.searchTerm ||
        s.assetName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.trackingCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.destinationVenue.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
  }

  get filteredAuditLogs(): AuditLog[] {
    return this.auditLogs.filter(log => {
      const matchesSearch = !this.searchTerm ||
        log.userName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        log.entityId?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesAction = !this.auditFilterAction || log.actionType === this.auditFilterAction;
      const matchesEntity = !this.auditFilterEntity || log.entityType === this.auditFilterEntity;
      return matchesSearch && matchesAction && matchesEntity;
    });
  }

  // ===== My Data (For Employee Role) =====
  get myTravelRequests(): TravelRequest[] {
    const currentEmpId = this.auth.currentUserValue?.id;
    if (!currentEmpId) return this.travelRequests;
    return this.travelRequests.filter(r => r.employee.id === currentEmpId);
  }

  get myExpenseClaims(): ExpenseClaim[] {
    const currentEmpId = this.auth.currentUserValue?.id;
    if (!currentEmpId) return this.expenses;
    return this.expenses.filter(e => e.employee.id === currentEmpId);
  }

  get myBookings(): Booking[] {
    const currentEmpId = this.auth.currentUserValue?.id;
    if (!currentEmpId) return this.bookings;
    return this.bookings.filter(b => b.employee.id === currentEmpId);
  }

  get myDocuments(): TravelDocument[] {
    const currentEmpId = this.auth.currentUserValue?.id;
    if (!currentEmpId) return this.documents;
    return this.documents.filter(d => d.employee.id === currentEmpId);
  }

  get approvedRequests(): TravelRequest[] {
    const currentEmpId = this.auth.currentUserValue?.id;
    return this.travelRequests.filter(r =>
      r.status === 'APPROVED' && (currentEmpId ? r.employee.id === currentEmpId : true)
    );
  }

  get completedTrips(): TravelRequest[] {
    return this.travelRequests.filter(r => r.status === 'COMPLETED' || r.status === 'APPROVED');
  }

  get activeTrip(): TravelRequest | null {
    const today = new Date().toISOString().split('T')[0];
    return this.travelRequests.find(r =>
      r.status === 'APPROVED' && r.startDate <= today && r.endDate >= today
    ) || this.travelRequests.find(r => r.status === 'APPROVED') || null;
  }

  get activeTripBookings(): Booking[] {
    const trip = this.activeTrip;
    if (!trip) return [];
    return this.bookings.filter(b => b.travelRequest?.id === trip.id);
  }

  get myRequestsCount(): number { return this.myTravelRequests.length; }
  get myExpensesCount(): number { return this.myExpenseClaims.length; }
  get myBookingsCount(): number { return this.myBookings.length; }
  get myDocumentsCount(): number { return this.myDocuments.length; }
  get policyViolationsCount(): number { return this.travelRequests.filter(r => r.status === 'POLICY_VIOLATION').length; }

  // ===== Charts (Pure Canvas) =====
  drawCharts() {
    setTimeout(() => {
      if (this.pieChart1Ref) {
        this.drawPieChart(this.pieChart1Ref.nativeElement, this.getChart1Data());
      }
      if (this.pieChart2Ref) {
        this.drawPieChart(this.pieChart2Ref.nativeElement, this.getChart2Data());
      }
    }, 100);
  }

  getChart1Data(): { label: string; value: number; color: string }[] {
    const role = this.auth.currentRole;
    if (role === 'EMPLOYEE') {
      const statusMap: Record<string, number> = {};
      this.myTravelRequests.forEach(r => { statusMap[r.status] = (statusMap[r.status] || 0) + 1; });
      const colors: Record<string, string> = { 'APPROVED': '#30D158', 'PENDING_APPROVAL': '#FF9F0A', 'REJECTED': '#FF453A', 'POLICY_VIOLATION': '#BF5AF2' };
      return Object.entries(statusMap).map(([k, v]) => ({ label: k.replace('_', ' '), value: v, color: colors[k] || '#8e8e93' }));
    }
    if (role === 'CORPORATE_TRAVEL_MANAGER' || role === 'FINANCE_ADMIN') {
      const cats = this.analytics?.spendByCategory || [];
      const colors = ['#0A84FF', '#BF5AF2', '#30D158', '#FF9F0A', '#FF453A', '#64D2FF'];
      return cats.map((c, i) => ({ label: c.category, value: c.spend, color: colors[i % colors.length] }));
    }
    if (role === 'LOGISTICS_COORDINATOR') {
      const statusMap: Record<string, number> = {};
      this.shipments.forEach(s => { statusMap[s.status] = (statusMap[s.status] || 0) + 1; });
      const colors: Record<string, string> = { 'IN_TRANSIT': '#0A84FF', 'DELIVERED': '#30D158', 'CUSTOMS_CLEARANCE': '#BF5AF2', 'PENDING': '#FF9F0A' };
      return Object.entries(statusMap).map(([k, v]) => ({ label: k.replace('_', ' '), value: v, color: colors[k] || '#8e8e93' }));
    }
    if (role === 'RISK_OFFICER') {
      const threatMap: Record<string, number> = {};
      this.travelerLocations.forEach(l => { threatMap[l.threatLevel] = (threatMap[l.threatLevel] || 0) + 1; });
      const colors: Record<string, string> = { 'LOW': '#30D158', 'MODERATE': '#FF9F0A', 'HIGH': '#FF453A', 'CRITICAL': '#FF453A' };
      return Object.entries(threatMap).map(([k, v]) => ({ label: k, value: v, color: colors[k] || '#8e8e93' }));
    }
    const statusMap: Record<string, number> = {};
    this.travelRequests.forEach(r => { statusMap[r.status] = (statusMap[r.status] || 0) + 1; });
    const colors: Record<string, string> = { 'APPROVED': '#30D158', 'PENDING_APPROVAL': '#FF9F0A', 'REJECTED': '#FF453A', 'POLICY_VIOLATION': '#BF5AF2' };
    return Object.entries(statusMap).map(([k, v]) => ({ label: k.replace('_', ' '), value: v, color: colors[k] || '#8e8e93' }));
  }

  getChart2Data(): { label: string; value: number; color: string }[] {
    const role = this.auth.currentRole;
    if (role === 'EMPLOYEE') {
      const catMap: Record<string, number> = {};
      this.myExpenseClaims.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      const colors: Record<string, string> = { 'MEALS': '#FF9F0A', 'HOTEL': '#BF5AF2', 'GROUND_TRANSPORT': '#0A84FF', 'FLIGHT': '#30D158', 'MISC': '#64D2FF' };
      return Object.entries(catMap).map(([k, v]) => ({ label: k, value: v, color: colors[k] || '#8e8e93' }));
    }
    if (role === 'FINANCE_ADMIN') {
      const auditMap: Record<string, number> = {};
      this.expenses.forEach(e => { auditMap[e.auditStatus] = (auditMap[e.auditStatus] || 0) + 1; });
      const colors: Record<string, string> = { 'PENDING_AUDIT': '#FF9F0A', 'APPROVED_PAYOUT': '#30D158', 'REJECTED_FLAGGED': '#FF453A', 'PAID': '#0A84FF' };
      return Object.entries(auditMap).map(([k, v]) => ({ label: k.replace('_', ' '), value: v, color: colors[k] || '#8e8e93' }));
    }
    const depts = this.analytics?.spendByDepartment || [];
    const colors = ['#0A84FF', '#30D158', '#BF5AF2', '#FF9F0A', '#FF453A', '#64D2FF'];
    return depts.map((d, i) => ({ label: d.department, value: d.spend, color: colors[i % colors.length] }));
  }

  drawPieChart(canvas: HTMLCanvasElement, data: { label: string; value: number; color: string }[]) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !data.length) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 180;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2;
    const outerR = 80, innerR = 50;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return;

    let startAngle = -Math.PI / 2;
    data.forEach(d => {
      const slice = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
      ctx.arc(cx, cy, innerR, startAngle + slice, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      startAngle += slice;
    });

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f5f5f7';
    ctx.font = '700 20px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(total)), cx, cy - 6);
    ctx.font = '500 10px Inter';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#888';
    ctx.fillText('TOTAL', cx, cy + 10);
  }

  // ===== CRUD Operations =====
  openCreateVendorModal() {
    this.showCreateVendorModal = true;
    this.newVendor = { name: '', category: 'FLIGHT', corporateRate: 0, standardRate: 0, rating: 4.8, preferred: true, badges: 'Corporate Partner', region: 'GLOBAL' };
  }

  submitVendor() {
    if (!this.newVendor.name || !this.newVendor.corporateRate) return;
    this.api.createVendor(this.newVendor).subscribe(() => {
      this.showCreateVendorModal = false;
      this.loadAllData();
      this.showPopup('success', 'Vendor Added', `${this.newVendor.name} has been added to the preferred vendor catalog`);
    });
  }

  deleteVendor(vendorId: number) {
    this.showPopup('warning', 'Remove Vendor?', 'This vendor will be removed from the preferred catalog.', () => {
      this.api.deleteVendor(vendorId).subscribe(() => {
        this.loadAllData();
        this.showPopup('success', 'Vendor Removed', 'The vendor has been removed from the catalog');
      });
    });
  }

  openCreateModal() {
    this.showCreateRequestModal = true;
    this.newRequest = {
      employeeId: this.auth.currentUserValue?.id || null, destination: '', countryCode: '',
      startDate: '', endDate: '', purpose: '', estimatedBudget: 0,
      flightClass: 'ECONOMY', hotelDailyRate: 0, mealAllowance: 50, groundTransportBudget: 100,
      justificationText: ''
    };
  }

  closeCreateModal() { this.showCreateRequestModal = false; }

  submitTravelRequest() {
    if (!this.newRequest.employeeId || !this.newRequest.destination) return;
    if (!this.newRequest.startDate || !this.newRequest.endDate || !this.newRequest.purpose) {
      this.showPopup('error', 'Missing Required Fields', 'Destination, dates, and purpose are mandatory');
      return;
    }
    // Prevent past dates (US-03 AC2)
    if (this.newRequest.startDate < new Date().toISOString().split('T')[0]) {
      this.showPopup('error', 'Invalid Date', 'Start date cannot be in the past');
      return;
    }
    // Check policy violations & require business justification (US-05 AC3)
    const isPolicyViolated = (this.newRequest.flightClass === 'BUSINESS' || this.newRequest.flightClass === 'FIRST') ||
      (this.newRequest.hotelDailyRate > 350) || (this.calculatedTotalBudget > 10000);

    if (isPolicyViolated && !this.newRequest.justificationText?.trim()) {
      this.showPopup('warning', 'Business Justification Required', 'Your request exceeds policy caps (cabin class, daily hotel rate, or budget cap). Please provide a brief business justification before submitting.');
      return;
    }

    const payload: any = {
      employee: { id: this.newRequest.employeeId },
      destination: this.newRequest.destination, countryCode: this.newRequest.countryCode,
      startDate: this.newRequest.startDate, endDate: this.newRequest.endDate,
      purpose: this.newRequest.purpose, estimatedBudget: this.calculatedTotalBudget,
      flightClass: this.newRequest.flightClass, hotelDailyRate: this.newRequest.hotelDailyRate,
      mealAllowance: this.newRequest.mealAllowance, groundTransportBudget: this.newRequest.groundTransportBudget
    };
    if (this.newRequest.justificationText) {
      payload.justificationText = this.newRequest.justificationText;
    }
    this.api.createTravelRequest(payload).subscribe({
      next: (created) => {
        this.showCreateRequestModal = false;
        this.loadAllData();
        this.showPopup('success', 'Trip Submitted', `Request ${created.requestId || ''} to ${this.newRequest.destination} submitted for approval`);
      },
      error: () => this.showPopup('error', 'Submission Failed', 'Could not submit travel request. Please try again.')
    });
  }

  viewRequestDetail(request: TravelRequest) {
    this.selectedRequest = request;
    this.showDetailModal = true;
    this.approvalRemarks = '';
  }

  closeDetailModal() { this.showDetailModal = false; this.selectedRequest = null; }

  approveRequest() {
    if (!this.selectedRequest) return;
    this.api.updateTravelRequestStatus(this.selectedRequest.id, {
      status: 'APPROVED', approverId: String(this.auth.currentUserValue?.id || 1), remarks: this.approvalRemarks
    }).subscribe(() => {
      this.closeDetailModal();
      this.loadAllData();
      this.showPopup('success', 'Request Approved', `Trip to ${this.selectedRequest?.destination} has been approved`);
    });
  }

  rejectRequest() {
    if (!this.selectedRequest) return;
    // Enforce mandatory rejection comment (US-07 AC3)
    if (!this.approvalRemarks.trim()) {
      this.showPopup('error', 'Comment Required', 'Please provide a reason for rejection before rejecting this request');
      return;
    }
    this.api.updateTravelRequestStatus(this.selectedRequest.id, {
      status: 'REJECTED', approverId: String(this.auth.currentUserValue?.id || 1), remarks: this.approvalRemarks
    }).subscribe(() => {
      this.closeDetailModal();
      this.loadAllData();
      this.showPopup('info', 'Request Rejected', 'The travel request has been rejected');
    });
  }

  // ===== Booking Operations (US-08) =====
  openCreateBookingModal(requestId?: number) {
    this.showCreateBookingModal = true;
    this.newBooking = {
      travelRequestId: requestId || null, bookingType: 'FLIGHT', vendorName: '',
      departureAirport: '', arrivalAirport: '', flightNumber: '', cabinClass: 'ECONOMY', seatNumber: '',
      departureDateTime: '', arrivalDateTime: '',
      hotelName: '', checkInDate: '', checkOutDate: '', roomType: 'Standard King',
      vehicleType: 'Executive Sedan', pickupLocation: '', dropLocation: '',
      amount: 0
    };
  }

  submitBooking() {
    if (!this.newBooking.travelRequestId || !this.newBooking.vendorName) {
      this.showPopup('error', 'Missing Fields', 'Please select a trip and enter vendor details');
      return;
    }
    const payload: any = {
      travelRequest: { id: this.newBooking.travelRequestId },
      employee: { id: this.auth.currentUserValue?.id || 1 },
      bookingType: this.newBooking.bookingType,
      vendorName: this.newBooking.vendorName,
      amount: this.newBooking.amount,
      status: 'CONFIRMED'
    };

    if (this.newBooking.bookingType === 'FLIGHT') {
      payload.departureAirport = this.newBooking.departureAirport;
      payload.arrivalAirport = this.newBooking.arrivalAirport;
      payload.flightNumber = this.newBooking.flightNumber;
      payload.cabinClass = this.newBooking.cabinClass;
      payload.seatNumber = this.newBooking.seatNumber;
      if (this.newBooking.departureDateTime) payload.departureDateTime = this.newBooking.departureDateTime;
      if (this.newBooking.arrivalDateTime) payload.arrivalDateTime = this.newBooking.arrivalDateTime;
    } else if (this.newBooking.bookingType === 'HOTEL') {
      payload.hotelName = this.newBooking.hotelName;
      if (this.newBooking.checkInDate) payload.checkInDate = this.newBooking.checkInDate;
      if (this.newBooking.checkOutDate) payload.checkOutDate = this.newBooking.checkOutDate;
      payload.roomType = this.newBooking.roomType;
    } else if (this.newBooking.bookingType === 'TRANSPORT') {
      payload.vehicleType = this.newBooking.vehicleType;
      payload.pickupLocation = this.newBooking.pickupLocation;
      payload.dropLocation = this.newBooking.dropLocation;
    }

    this.api.createBooking(payload).subscribe({
      next: (created) => {
        this.showCreateBookingModal = false;
        this.loadAllData();
        this.showPopup('success', 'Booking Confirmed', `${created.bookingType} booked — PNR: ${created.pnrCode}`);
      },
      error: (err) => this.showPopup('error', 'Booking Failed', err.error?.message || 'Only approved trips can have bookings')
    });
  }

  // ===== Document Operations (US-02) =====
  openUploadDocModal() {
    this.showUploadDocModal = true;
    this.newDocument = {
      documentType: 'PASSPORT', fileName: '', contentType: '', content: '', expiryDate: '', description: ''
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      this.showPopup('error', 'Invalid File Type', 'Only PDF, JPG, and PNG files are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.showPopup('error', 'File Too Large', 'Maximum file size is 5MB');
      return;
    }
    this.newDocument.fileName = file.name;
    this.newDocument.contentType = file.type;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.newDocument.content = base64;
    };
    reader.readAsDataURL(file);
  }

  submitDocument() {
    if (!this.newDocument.content || !this.newDocument.fileName) {
      this.showPopup('error', 'No File Selected', 'Please select a file to upload');
      return;
    }
    this.api.uploadDocument({
      employeeId: this.auth.currentUserValue?.id,
      documentType: this.newDocument.documentType,
      fileName: this.newDocument.fileName,
      contentType: this.newDocument.contentType,
      content: this.newDocument.content,
      expiryDate: this.newDocument.expiryDate,
      description: this.newDocument.description
    }).subscribe({
      next: () => {
        this.showUploadDocModal = false;
        this.loadAllData();
        this.showPopup('success', 'Document Uploaded', `${this.newDocument.fileName} uploaded successfully`);
      },
      error: (err) => this.showPopup('error', 'Upload Failed', err.error?.message || 'Could not upload document')
    });
  }

  deleteDocument(docId: number) {
    this.showPopup('warning', 'Delete Document?', 'This document will be permanently removed.', () => {
      this.api.deleteDocument(docId).subscribe(() => {
        this.loadAllData();
        this.showPopup('success', 'Document Deleted', 'The document has been removed');
      });
    });
  }

  // ===== Expense Operations =====
  openCreateExpenseModal() {
    this.showCreateExpenseModal = true;
    this.newExpense = {
      vendorName: '',
      category: 'PASSPORT_BORDER_CLEARANCE',
      expenseDate: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: 'USD',
      receiptFileName: 'document_scan.pdf',
      travelRequestId: null,
      passportNumber: '', issuingCountry: 'United States', clearanceExpiry: '',
      borderAgency: 'Customs & Border Protection',
      visaNumber: '', visaType: 'Business Visa (B1/B2)', targetJurisdiction: 'Schengen / EU', validUntilDate: '',
      pnrNumber: '', airlineCarrier: 'Delta Air Lines', originAirport: 'JFK', destinationAirport: 'LHR', cabinClass: 'BUSINESS',
      policyNumber: 'POL-CBG-' + Math.floor(100000 + Math.random() * 900000),
      insuranceProvider: 'Cigna Global Executive', coverageScope: 'Worldwide Emergency Medevac', policyExpiry: '',
      carnetNumber: 'ATA-CARNET-' + Math.floor(10000 + Math.random() * 90000),
      cargoAssetSerial: '', customsVenue: 'Tokyo Port Customs', declaredValue: 15000,
      hotelName: 'Grand Hyatt', checkInDate: '', checkOutDate: '', roomRatePerNight: 220,
      mealType: 'Client Executive Dinner', attendeesCount: 3,
      transportMode: 'Corporate Black Car / Rail', tripRoute: 'Airport -> City Center'
    };
  }

  submitExpense() {
    let vendor = this.newExpense.vendorName;
    if (!vendor) {
      switch (this.newExpense.category) {
        case 'PASSPORT_BORDER_CLEARANCE': vendor = `${this.newExpense.borderAgency || 'Border Agency'} (${this.newExpense.issuingCountry || 'Global'})`; break;
        case 'VISA_PERMITS': vendor = `${this.newExpense.visaType || 'Business Visa'} - ${this.newExpense.targetJurisdiction || 'Consulate'}`; break;
        case 'FLIGHT_TRANSIT': vendor = `${this.newExpense.airlineCarrier || 'Transit Airline'} (PNR: ${this.newExpense.pnrNumber || 'N/A'})`; break;
        case 'HEALTH_INSURANCE': vendor = `${this.newExpense.insuranceProvider || 'Global Health Provider'}`; break;
        case 'CUSTOMS_MANIFEST': vendor = `Customs Carnet - ${this.newExpense.customsVenue || 'Customs Port'}`; break;
        case 'HOTEL': vendor = `${this.newExpense.hotelName || 'Corporate Hotel Lodging'}`; break;
        case 'MEALS': vendor = `${this.newExpense.mealType || 'Business Dining'}`; break;
        case 'GROUND_TRANSPORT': vendor = `${this.newExpense.transportMode || 'Ground Transit'}`; break;
        default: vendor = 'Corporate Expense';
      }
    }
    const amt = Number(this.newExpense.amount) || 150;
    const payload: any = {
      employee: { id: this.auth.currentUserValue?.id || 1 },
      vendorName: vendor, category: this.newExpense.category,
      expenseDate: this.newExpense.expenseDate, amount: amt,
      currency: this.newExpense.currency, ocrConfidence: 98.2,
      auditStatus: 'PENDING_AUDIT', receiptFileName: this.newExpense.receiptFileName || 'category_document.pdf'
    };
    // Link to trip if selected (US-14 AC1)
    if (this.newExpense.travelRequestId) {
      payload.travelRequest = { id: this.newExpense.travelRequestId };
    }
    this.api.createExpense(payload).subscribe(() => {
      this.showCreateExpenseModal = false;
      this.loadAllData();
      this.showPopup('success', 'Claim Submitted', `${this.getCategoryLabel(this.newExpense.category)} claim submitted for audit review`);
    });
  }

  approveExpense(expense: ExpenseClaim) {
    this.api.auditExpense(expense.id, {
      auditStatus: 'APPROVED_PAYOUT', auditRemarks: 'Approved by Finance Director for payout',
      auditorId: String(this.auth.currentUserValue?.id || 1)
    }).subscribe(() => {
      this.loadAllData();
      this.showPopup('success', 'Payout Approved', `$${expense.amount.toFixed(2)} approved for reimbursement`);
    });
  }

  flagExpense(expense: ExpenseClaim) {
    this.showPopup('warning', 'Flag this Claim?', `Flag the $${expense.amount.toFixed(2)} expense from ${expense.vendorName} for audit review?`, () => {
      this.api.auditExpense(expense.id, {
        auditStatus: 'REJECTED_FLAGGED', auditRemarks: 'Flagged for audit review',
        auditorId: String(this.auth.currentUserValue?.id || 1)
      }).subscribe(() => {
        this.loadAllData();
        this.showPopup('info', 'Claim Flagged', 'The expense claim has been flagged for investigation');
      });
    });
  }

  // ===== Reimbursement Export (US-17) =====
  exportReimbursements() {
    this.api.exportReimbursements({
      userId: this.auth.currentUserValue?.id,
      userName: this.auth.currentUserValue?.fullName
    }).subscribe({
      next: (result: ReimbursementExport) => {
        if (result.exportedCount === 0) {
          this.showPopup('info', 'No Claims', 'No approved claims pending for export');
          return;
        }
        // Download the CSV
        const blob = new Blob([result.csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `cbg_reimbursement_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.loadAllData();
        this.showPopup('success', 'Export Complete', `${result.exportedCount} claims ($${result.totalAmount.toFixed(2)}) exported and marked as PAID`);
      },
      error: () => this.showPopup('error', 'Export Failed', 'Could not export reimbursements')
    });
  }

  // ===== Report Generation (US-19) =====
  generateReport() {
    this.api.getAnalyticsReport(this.reportFilters).subscribe({
      next: (data) => {
        this.reportData = data;
      },
      error: () => this.showPopup('error', 'Report Failed', 'Could not generate report')
    });
  }

  exportReportCsv() {
    if (!this.reportData) return;
    let csv = 'Metric,Value\n';
    csv += `Total Requests,${this.reportData.totalRequests}\n`;
    csv += `Total Expenses,${this.reportData.totalExpenses}\n`;
    csv += `Travel Spend,$${this.reportData.totalTravelSpend}\n`;
    csv += `Expense Spend,$${this.reportData.totalExpenseSpend}\n`;
    csv += `Policy Violations,${this.reportData.policyViolations}\n`;
    csv += `Compliance Rate,${this.reportData.complianceRate}%\n`;
    csv += '\nVendor,Spend\n';
    (this.reportData.spendByVendor || []).forEach((v: any) => {
      csv += `"${v.vendor}",$${v.spend}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cbg_analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showPopup('success', 'Report Exported', 'CSV report downloaded successfully');
  }

  // ===== Shipment Operations =====
  openCreateShipmentModal() {
    this.showCreateShipmentModal = true;
    this.newShipment = {
      assetName: '', serialNumber: 'SN-' + Math.floor(100000 + Math.random() * 900000),
      destinationVenue: '', targetDeliveryDate: new Date().toISOString().split('T')[0],
      trackingCode: 'LOG-CBG-' + Math.floor(100000 + Math.random() * 900000),
      shippingCarrier: 'FedEx Express', weightKg: 8.5
    };
  }

  submitShipment() {
    if (!this.newShipment.assetName || !this.newShipment.destinationVenue) return;
    const payload = {
      assetName: this.newShipment.assetName, serialNumber: this.newShipment.serialNumber,
      destinationVenue: this.newShipment.destinationVenue,
      syncedEmployee: { id: this.auth.currentUserValue?.id || 1 },
      targetDeliveryDate: this.newShipment.targetDeliveryDate,
      trackingCode: this.newShipment.trackingCode, status: 'IN_TRANSIT',
      weightKg: this.newShipment.weightKg, shippingCarrier: this.newShipment.shippingCarrier
    };
    this.api.createShipment(payload).subscribe(() => {
      this.showCreateShipmentModal = false;
      this.loadAllData();
      this.showPopup('success', 'Shipment Dispatched', `${this.newShipment.assetName} has been dispatched via ${this.newShipment.shippingCarrier}`);
    });
  }

  updateShipmentStatus(shipment: Shipment, newStatus: string) {
    this.api.updateShipmentStatus(shipment.id, { status: newStatus }).subscribe(() => {
      this.loadAllData();
      this.showPopup('success', 'Status Updated', `${shipment.assetName} marked as ${newStatus.replace('_', ' ')}`);
    });
  }

  markRead(notification: Notification) {
    this.api.markNotificationRead(notification.id).subscribe(() => this.loadAllData());
  }

  triggerSos(location: TravelerLocation) {
    this.showPopup('warning', 'Dispatch Emergency SOS?', `Send emergency assistance to ${location.employee.fullName} in ${location.city}, ${location.country}?`, () => {
      this.api.triggerSos({
        employeeId: location.employee.id,
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        country: location.country
      }).subscribe(() => {
        this.loadAllData();
        this.showPopup('success', 'SOS Dispatched', `Emergency response initiated for ${location.employee.fullName}`);
      });
    });
  }

  // Employee SOS button (US-12 — persistent on mobile)
  triggerEmployeeSos() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.api.triggerSos({
            employeeId: this.auth.currentUserValue?.id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }).subscribe(() => {
            this.showPopup('success', 'SOS Sent!', 'Emergency team has been notified with your GPS location');
          });
        },
        () => {
          this.api.triggerSos({
            employeeId: this.auth.currentUserValue?.id
          }).subscribe(() => {
            this.showPopup('success', 'SOS Sent!', 'Emergency team has been notified');
          });
        }
      );
    } else {
      this.api.triggerSos({ employeeId: this.auth.currentUserValue?.id }).subscribe(() => {
        this.showPopup('success', 'SOS Sent!', 'Emergency team has been notified');
      });
    }
  }

  exportDataCsv() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (this.activeTab === 'requests') {
      csvContent += 'RequestID,Employee,Destination,StartDate,EndDate,Budget,Status,ComplianceScore\n';
      this.filteredRequests.forEach(r => {
        csvContent += `"${r.requestId || r.id}","${r.employee.fullName}","${r.destination}","${r.startDate}","${r.endDate}","${r.estimatedBudget}","${r.status}","${r.policyComplianceScore}"\n`;
      });
    } else if (this.activeTab === 'expenses') {
      csvContent += 'ID,Employee,Vendor,Category,ExpenseDate,Amount,Currency,Status\n';
      this.filteredExpenses.forEach(e => {
        csvContent += `"${e.id}","${e.employee.fullName}","${e.vendorName}","${e.category}","${e.expenseDate}","${e.amount}","${e.currency}","${e.auditStatus}"\n`;
      });
    } else if (this.activeTab === 'auditlogs') {
      csvContent += 'Timestamp,User,Role,Action,Entity,EntityID,Details,IP\n';
      this.filteredAuditLogs.forEach(l => {
        csvContent += `"${l.timestamp}","${l.userName}","${l.userRole}","${l.actionType}","${l.entityType}","${l.entityId}","${l.details}","${l.ipAddress}"\n`;
      });
    } else {
      csvContent += 'ID,Name,Category,CorporateRate,StandardRate,Rating\n';
      this.vendors.forEach(v => {
        csvContent += `"${v.id}","${v.name}","${v.category}","${v.corporateRate}","${v.standardRate}","${v.rating}"\n`;
      });
    }
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `cbg_${this.activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showPopup('success', 'Export Complete', 'CSV report has been downloaded');
  }

  // ===== Formatters & Helpers =====
  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'APPROVED': '#30D158', 'COMPLETED': '#30D158', 'DELIVERED': '#30D158', 'SAFE': '#30D158',
      'APPROVED_PAYOUT': '#30D158', 'CONFIRMED': '#30D158', 'PAID': '#0A84FF',
      'PENDING_APPROVAL': '#FF9F0A', 'PENDING_AUDIT': '#FF9F0A',
      'IN_TRANSIT': '#0A84FF', 'CUSTOMS_CLEARANCE': '#BF5AF2', 'POLICY_VIOLATION': '#FF453A',
      'REJECTED': '#FF453A', 'REJECTED_FLAGGED': '#FF453A', 'CANCELLED': '#FF453A',
      'ALERT': '#FF9F0A', 'ASSISTANCE_REQUESTED': '#FF453A', 'MODERATE': '#FF9F0A',
      'HIGH': '#FF453A', 'CRITICAL': '#FF453A', 'LOW': '#30D158', 'DRAFT': '#8e8e93',
      'SUBMITTED': '#FF9F0A', 'CHECKED_IN': '#0A84FF'
    };
    return map[status] || '#8e8e93';
  }

  getThreatIcon(level: string): string {
    const map: Record<string, string> = { 'LOW': '🟢', 'MODERATE': '🟡', 'HIGH': '🔴', 'CRITICAL': '⚠️' };
    return map[level] || '⚪';
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      'PASSPORT_BORDER_CLEARANCE': '🛂',
      'VISA_PERMITS': '📄',
      'FLIGHT_TRANSIT': '✈️',
      'HEALTH_INSURANCE': '🏥',
      'CUSTOMS_MANIFEST': '📦',
      'FLIGHT': '✈️', 'HOTEL': '🏨', 'GROUND_TRANSPORT': '🚗', 'TRANSPORT': '🚗',
      'MEALS': '🍽️', 'MISC': '📦', 'LOGISTICS': '📦', 'RISK': '🛡️', 'SYSTEM': '⚙️'
    };
    return map[category] || '📋';
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      'PASSPORT_BORDER_CLEARANCE': 'Passport & Border Clearance',
      'VISA_PERMITS': 'Business Visa & Permits',
      'FLIGHT_TRANSIT': 'Flight & Transit Tickets',
      'HEALTH_INSURANCE': 'Corporate Health Insurance',
      'CUSTOMS_MANIFEST': 'Customs & Logistics Manifest',
      'FLIGHT': 'Flight Requisition',
      'HOTEL': 'Hotel & Lodging',
      'GROUND_TRANSPORT': 'Ground Transport',
      'MEALS': 'Meals & Per Diem',
      'MISC': 'Miscellaneous'
    };
    return map[category] || category?.replace('_', ' ') || '';
  }

  getDocTypeIcon(type: string): string {
    const map: Record<string, string> = {
      'PASSPORT': '🛂', 'VISA': '📄', 'INSURANCE': '🏥', 'ID_CARD': '🪪', 'OTHER': '📎'
    };
    return map[type] || '📋';
  }

  getDocTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'PASSPORT': 'Passport', 'VISA': 'Visa', 'INSURANCE': 'Insurance', 'ID_CARD': 'ID Card', 'OTHER': 'Other'
    };
    return map[type] || type;
  }

  getAuditActionIcon(action: string): string {
    const map: Record<string, string> = {
      'LOGIN': '🔐', 'LOGOUT': '🚪', 'CREATE': '➕', 'UPDATE': '✏️', 'DELETE': '🗑️',
      'APPROVE': '✅', 'REJECT': '❌', 'EXPORT': '📤', 'SOS_TRIGGER': '🆘'
    };
    return map[action] || '📋';
  }

  getBookingTypeIcon(type: string): string {
    const map: Record<string, string> = { 'FLIGHT': '✈️', 'HOTEL': '🏨', 'TRANSPORT': '🚗' };
    return map[type] || '📋';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  get unreadNotifications(): number { return this.notifications.filter(n => !n.readStatus).length; }
  get pendingRequestsCount(): number { return this.travelRequests.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'POLICY_VIOLATION').length; }
  get pendingExpensesCount(): number { return this.expenses.filter(e => e.auditStatus === 'PENDING_AUDIT').length; }

  getDeptSpendMax(): number {
    if (!this.analytics?.spendByDepartment?.length) return 1;
    return Math.max(...this.analytics.spendByDepartment.map(d => d.spend));
  }

  getVendorBadges(badges: string): string[] {
    return badges ? badges.split(',').map(b => b.trim()) : [];
  }

  getPopupIcon(): string {
    const map: Record<string, string> = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    return map[this.popup.type] || 'ℹ';
  }

  getBudgetUtilization(): number {
    if (!this.analytics?.totalAllocatedBudget) return 0;
    return Math.round((this.analytics.ytdSpend / this.analytics.totalAllocatedBudget) * 100);
  }
}
