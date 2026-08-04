import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  TravelRequest, Employee, Vendor, Shipment,
  Notification, TravelerLocation, ExpenseClaim, DashboardAnalytics
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
    'EMP': { email: 'employee.sarah@cbg-enterprise.com', passkey: 'EMP-4421-ZETA', code: '123984', role: 'EMPLOYEE', name: 'Sarah Jenkins' }
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
    flightClass: 'ECONOMY', hotelDailyRate: 0, mealAllowance: 50, groundTransportBudget: 100
  };
  newVendor = { name: '', category: 'FLIGHT', corporateRate: 0, standardRate: 0, rating: 4.8, preferred: true, badges: 'Corporate Partner', region: 'GLOBAL' };
  newExpense: any = {
    vendorName: '',
    category: 'PASSPORT_BORDER_CLEARANCE',
    expenseDate: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: 'USD',
    receiptFileName: 'document_scan.pdf',
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
  approvalRemarks = '';
  isLoading = true;

  // Live Weather Tracking State
  currentWeather: LiveDestinationWeather | null = null;
  activeWeatherCity = 'Tokyo';

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

  fetchLiveDestinationWeather(city?: string) {
    const targetCity = city || (this.travelRequests.length > 0 ? this.travelRequests[0].destination : 'Tokyo');
    this.activeWeatherCity = targetCity;
    this.weatherService.getLiveWeather(targetCity).subscribe({
      next: (data) => { this.currentWeather = data; },
      error: () => {}
    });
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
        this.loginError = err.error?.message || 'Authentication failed. Please check your credentials.';
        this.isAuthenticating = false;
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
      error: (err: any) => {
        this.loginError = err.error?.message || 'Passkey validation failed';
        this.isAuthenticating = false;
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
        this.twoFAError = err.error?.message || 'Invalid verification code';
        this.isAuthenticating = false;
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
      expenses: this.api.getExpenses().pipe(catchError(() => of([])))
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
          { tab: 'expenses', icon: '🧾', label: 'My Expense Claims', badge: this.myExpensesCount }
        ]});
        break;

      case 'APPROVING_MANAGER':
      case 'MANAGER':
        items.push({ section: 'Approvals & Team', items: [
          { tab: 'requests', icon: '✅', label: 'Pending Approvals Queue', badge: this.pendingRequestsCount },
          { tab: 'employees', icon: '👥', label: 'Direct Reports Directory' }
        ]});
        break;

      case 'CORPORATE_TRAVEL_MANAGER':
        items.push({ section: 'Program Assets', items: [
          { tab: 'vendors', icon: '🤝', label: 'Preferred Vendor Directory' },
          { tab: 'requests', icon: '📋', label: 'Policy Violation Alerts', badge: this.policyViolationsCount }
        ]});
        items.push({ section: 'Financial Control', items: [
          { tab: 'expenses', icon: '📊', label: 'Program Spend Analytics' }
        ]});
        break;

      case 'FINANCE_ADMIN':
        items.push({ section: 'Audit Queue', items: [
          { tab: 'expenses', icon: '🔍', label: 'Expense Claims Audit', badge: this.pendingExpensesCount },
          { tab: 'requests', icon: '📑', label: 'Approved Budget Reconciliations' }
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

      default:
        items.push({ section: 'Navigation', items: [
          { tab: 'requests', icon: '🗂️', label: 'Travel Requests' },
          { tab: 'vendors', icon: '🤝', label: 'Vendors' },
          { tab: 'shipments', icon: '📦', label: 'Shipments' },
          { tab: 'expenses', icon: '💰', label: 'Expenses' },
          { tab: 'risk', icon: '🛡️', label: 'Risk' },
          { tab: 'notifications', icon: '🔔', label: 'Alerts' },
          { tab: 'employees', icon: '👥', label: 'Directory' }
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
        req.purpose.toLowerCase().includes(this.searchTerm.toLowerCase());
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

  get myRequestsCount(): number { return this.myTravelRequests.length; }
  get myExpensesCount(): number { return this.myExpenseClaims.length; }
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
      const colors: Record<string, string> = { 'PENDING_AUDIT': '#FF9F0A', 'APPROVED_PAYOUT': '#30D158', 'REJECTED_FLAGGED': '#FF453A' };
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
      flightClass: 'ECONOMY', hotelDailyRate: 0, mealAllowance: 50, groundTransportBudget: 100
    };
  }

  closeCreateModal() { this.showCreateRequestModal = false; }

  submitTravelRequest() {
    if (!this.newRequest.employeeId || !this.newRequest.destination) return;
    const payload = {
      employee: { id: this.newRequest.employeeId },
      destination: this.newRequest.destination, countryCode: this.newRequest.countryCode,
      startDate: this.newRequest.startDate, endDate: this.newRequest.endDate,
      purpose: this.newRequest.purpose, estimatedBudget: this.newRequest.estimatedBudget,
      flightClass: this.newRequest.flightClass, hotelDailyRate: this.newRequest.hotelDailyRate,
      mealAllowance: this.newRequest.mealAllowance, groundTransportBudget: this.newRequest.groundTransportBudget
    };
    this.api.createTravelRequest(payload).subscribe({
      next: () => {
        this.showCreateRequestModal = false;
        this.loadAllData();
        this.showPopup('success', 'Trip Submitted', `Your travel request to ${this.newRequest.destination} has been submitted for approval`);
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
    this.api.updateTravelRequestStatus(this.selectedRequest.id, {
      status: 'REJECTED', approverId: String(this.auth.currentUserValue?.id || 1), remarks: this.approvalRemarks
    }).subscribe(() => {
      this.closeDetailModal();
      this.loadAllData();
      this.showPopup('info', 'Request Rejected', 'The travel request has been rejected');
    });
  }

  openCreateExpenseModal() {
    this.showCreateExpenseModal = true;
    this.newExpense = {
      vendorName: '',
      category: 'PASSPORT_BORDER_CLEARANCE',
      expenseDate: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: 'USD',
      receiptFileName: 'document_scan.pdf',
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
      policyNumber: 'POL-CBG-' + Math.floor(100000 + Math.random() * 900000),
      insuranceProvider: 'Cigna Global Executive',
      coverageScope: 'Worldwide Emergency Medevac',
      policyExpiry: '',
      carnetNumber: 'ATA-CARNET-' + Math.floor(10000 + Math.random() * 90000),
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
    const payload = {
      employee: { id: this.auth.currentUserValue?.id || 1 },
      vendorName: vendor, category: this.newExpense.category,
      expenseDate: this.newExpense.expenseDate, amount: amt,
      currency: this.newExpense.currency, ocrConfidence: 98.2,
      auditStatus: 'PENDING_AUDIT', receiptFileName: this.newExpense.receiptFileName || 'category_document.pdf'
    };
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
      this.api.triggerSos({ employeeId: location.employee.id }).subscribe(() => {
        this.loadAllData();
        this.showPopup('success', 'SOS Dispatched', `Emergency response initiated for ${location.employee.fullName}`);
      });
    });
  }

  exportDataCsv() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (this.activeTab === 'requests') {
      csvContent += 'ID,Employee,Destination,StartDate,EndDate,Budget,Status,ComplianceScore\n';
      this.filteredRequests.forEach(r => {
        csvContent += `"${r.id}","${r.employee.fullName}","${r.destination}","${r.startDate}","${r.endDate}","${r.estimatedBudget}","${r.status}","${r.policyComplianceScore}"\n`;
      });
    } else if (this.activeTab === 'expenses') {
      csvContent += 'ID,Employee,Vendor,Category,ExpenseDate,Amount,Currency,Status\n';
      this.filteredExpenses.forEach(e => {
        csvContent += `"${e.id}","${e.employee.fullName}","${e.vendorName}","${e.category}","${e.expenseDate}","${e.amount}","${e.currency}","${e.auditStatus}"\n`;
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
      'APPROVED_PAYOUT': '#30D158', 'PENDING_APPROVAL': '#FF9F0A', 'PENDING_AUDIT': '#FF9F0A',
      'IN_TRANSIT': '#0A84FF', 'CUSTOMS_CLEARANCE': '#BF5AF2', 'POLICY_VIOLATION': '#FF453A',
      'REJECTED': '#FF453A', 'REJECTED_FLAGGED': '#FF453A', 'ALERT': '#FF9F0A',
      'ASSISTANCE_REQUESTED': '#FF453A', 'MODERATE': '#FF9F0A', 'HIGH': '#FF453A',
      'CRITICAL': '#FF453A', 'LOW': '#30D158', 'DRAFT': '#8e8e93'
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
      'FLIGHT': '✈️', 'HOTEL': '🏨', 'GROUND_TRANSPORT': '🚗',
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
}
