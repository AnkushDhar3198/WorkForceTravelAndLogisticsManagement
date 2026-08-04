import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  TravelRequest, Employee, Vendor, Shipment,
  Notification, TravelerLocation, ExpenseClaim, DashboardAnalytics
} from './services/api.service';
import { AuthService } from './services/auth.service';
import { ThemeService, ThemeMode } from './services/theme.service';
import { Subscription, interval, forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  activeTab = 'dashboard';
  sidebarOpen = false;

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

  // 2-Step Login Form
  loginEmail = '';
  loginPasskey = '';
  twoFactorCodeInput = '';
  step1Error = '';
  step2Error = '';
  isAuthenticating = false;

  // Modals
  showCreateRequestModal = false;
  showCreateVendorModal = false;
  showCreateExpenseModal = false;
  showCreateShipmentModal = false;
  showDetailModal = false;
  selectedRequest: TravelRequest | null = null;

  // Form State
  newRequest = {
    employeeId: null as number | null,
    destination: '',
    countryCode: '',
    startDate: '',
    endDate: '',
    purpose: '',
    estimatedBudget: 0,
    flightClass: 'ECONOMY',
    hotelDailyRate: 0,
    mealAllowance: 50,
    groundTransportBudget: 100
  };

  newVendor = {
    name: '',
    category: 'FLIGHT',
    corporateRate: 0,
    standardRate: 0,
    rating: 4.8,
    preferred: true,
    badges: 'Corporate Partner',
    region: 'GLOBAL'
  };

  newExpense = {
    vendorName: '',
    category: 'MEALS',
    expenseDate: '',
    amount: 0,
    currency: 'USD',
    receiptFileName: 'receipt_scan.pdf'
  };

  newShipment = {
    assetName: '',
    serialNumber: '',
    destinationVenue: '',
    targetDeliveryDate: '',
    trackingCode: '',
    shippingCarrier: 'FedEx Express',
    weightKg: 5.0
  };

  approvalRemarks = '';
  isLoading = true;

  private pollSub?: Subscription;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.loadAllData();
    this.pollSub = interval(30000).subscribe(() => this.loadAllData());
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  loadAllData() {
    forkJoin({
      analytics: this.api.getDashboardAnalytics(),
      requests: this.api.getTravelRequests(),
      employees: this.api.getEmployees(),
      vendors: this.api.getVendors(),
      shipments: this.api.getShipments(),
      notifications: this.api.getNotifications(),
      locations: this.api.getTravelerLocations(),
      expenses: this.api.getExpenses()
    }).subscribe({
      next: (data) => {
        this.analytics = data.analytics;
        this.travelRequests = data.requests;
        this.employees = data.employees;
        this.vendors = data.vendors;
        this.shipments = data.shipments;
        this.notifications = data.notifications;
        this.travelerLocations = data.locations;
        this.expenses = data.expenses;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        this.isLoading = false;
      }
    });
  }

  // 2-Step Login Handlers
  onStep1Submit() {
    if (!this.loginEmail || !this.loginPasskey) return;
    this.isAuthenticating = true;
    this.step1Error = '';

    this.auth.loginStep1(this.loginEmail, this.loginPasskey).subscribe({
      next: () => {
        this.isAuthenticating = false;
      },
      error: (err) => {
        this.step1Error = err.error?.message || 'Step 1 Passkey authentication failed';
        this.isAuthenticating = false;
      }
    });
  }

  onStep2Submit() {
    if (!this.twoFactorCodeInput) return;
    this.isAuthenticating = true;
    this.step2Error = '';

    this.auth.verify2FA(this.auth.pendingEmail, this.twoFactorCodeInput).subscribe({
      next: () => {
        this.isAuthenticating = false;
        this.loginEmail = '';
        this.loginPasskey = '';
        this.twoFactorCodeInput = '';
        this.loadAllData();
      },
      error: (err) => {
        this.step2Error = err.error?.message || 'Invalid 2FA Verification Code';
        this.isAuthenticating = false;
      }
    });
  }

  // 1-Click Official Login (Pre-fills Step 1 Passkey + Step 2 2FA Code)
  quickLoginAsOfficial(officialEmail: string) {
    if (!this.employees || this.employees.length === 0) return;
    const found = this.employees.find(e => e.email.toLowerCase() === officialEmail.toLowerCase());
    if (found) {
      this.loginEmail = found.email;
      this.loginPasskey = found.passkey || 'password';
      this.twoFactorCodeInput = found.twoFactorCode || '123456';

      // Auto-trigger 1-click authentication
      this.auth.loginAsOfficial(found);
      this.loadAllData();
    }
  }

  logout() {
    this.auth.logout();
    this.loginEmail = '';
    this.loginPasskey = '';
    this.twoFactorCodeInput = '';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    this.sidebarOpen = false;
    this.searchTerm = '';
    this.statusFilter = 'ALL';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setTheme(theme: ThemeMode) {
    this.themeService.setTheme(theme);
  }

  // Filtered Datasets
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

  // Export Data to CSV
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

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cbg_official_${this.activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Vendor Management (Corporate Travel Manager)
  openCreateVendorModal() {
    this.showCreateVendorModal = true;
    this.newVendor = {
      name: '',
      category: 'FLIGHT',
      corporateRate: 0,
      standardRate: 0,
      rating: 4.8,
      preferred: true,
      badges: 'Corporate Partner',
      region: 'GLOBAL'
    };
  }

  submitVendor() {
    if (!this.newVendor.name || !this.newVendor.corporateRate) return;
    this.api.createVendor(this.newVendor).subscribe(() => {
      this.showCreateVendorModal = false;
      this.loadAllData();
    });
  }

  deleteVendor(vendorId: number) {
    if (confirm('Are you sure you want to remove this preferred vendor?')) {
      this.api.deleteVendor(vendorId).subscribe(() => this.loadAllData());
    }
  }

  // Travel Request Modals
  openCreateModal() {
    this.showCreateRequestModal = true;
    this.newRequest = {
      employeeId: this.auth.currentUserValue?.id || null,
      destination: '',
      countryCode: '',
      startDate: '',
      endDate: '',
      purpose: '',
      estimatedBudget: 0,
      flightClass: 'ECONOMY',
      hotelDailyRate: 0,
      mealAllowance: 50,
      groundTransportBudget: 100
    };
  }

  closeCreateModal() {
    this.showCreateRequestModal = false;
  }

  submitTravelRequest() {
    if (!this.newRequest.employeeId || !this.newRequest.destination) return;

    const payload = {
      employee: { id: this.newRequest.employeeId },
      destination: this.newRequest.destination,
      countryCode: this.newRequest.countryCode,
      startDate: this.newRequest.startDate,
      endDate: this.newRequest.endDate,
      purpose: this.newRequest.purpose,
      estimatedBudget: this.newRequest.estimatedBudget,
      flightClass: this.newRequest.flightClass,
      hotelDailyRate: this.newRequest.hotelDailyRate,
      mealAllowance: this.newRequest.mealAllowance,
      groundTransportBudget: this.newRequest.groundTransportBudget
    };

    this.api.createTravelRequest(payload).subscribe({
      next: () => {
        this.showCreateRequestModal = false;
        this.loadAllData();
      },
      error: (err) => console.error('Failed to create request:', err)
    });
  }

  viewRequestDetail(request: TravelRequest) {
    this.selectedRequest = request;
    this.showDetailModal = true;
    this.approvalRemarks = '';
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedRequest = null;
  }

  approveRequest() {
    if (!this.selectedRequest) return;
    this.api.updateTravelRequestStatus(this.selectedRequest.id, {
      status: 'APPROVED',
      approverId: String(this.auth.currentUserValue?.id || 1),
      remarks: this.approvalRemarks
    }).subscribe(() => {
      this.closeDetailModal();
      this.loadAllData();
    });
  }

  rejectRequest() {
    if (!this.selectedRequest) return;
    this.api.updateTravelRequestStatus(this.selectedRequest.id, {
      status: 'REJECTED',
      approverId: String(this.auth.currentUserValue?.id || 1),
      remarks: this.approvalRemarks
    }).subscribe(() => {
      this.closeDetailModal();
      this.loadAllData();
    });
  }

  // Expense Creation (Employee)
  openCreateExpenseModal() {
    this.showCreateExpenseModal = true;
    this.newExpense = {
      vendorName: '',
      category: 'MEALS',
      expenseDate: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: 'USD',
      receiptFileName: 'scanned_receipt.pdf'
    };
  }

  submitExpense() {
    if (!this.newExpense.vendorName || !this.newExpense.amount) return;
    const payload = {
      employee: { id: this.auth.currentUserValue?.id || 1 },
      vendorName: this.newExpense.vendorName,
      category: this.newExpense.category,
      expenseDate: this.newExpense.expenseDate,
      amount: this.newExpense.amount,
      currency: this.newExpense.currency,
      ocrConfidence: 97.5,
      auditStatus: 'PENDING_AUDIT',
      receiptFileName: this.newExpense.receiptFileName
    };

    this.api.createExpense(payload).subscribe(() => {
      this.showCreateExpenseModal = false;
      this.loadAllData();
    });
  }

  approveExpense(expense: ExpenseClaim) {
    this.api.auditExpense(expense.id, {
      auditStatus: 'APPROVED_PAYOUT',
      auditRemarks: 'Approved by Finance Director for payout',
      auditorId: String(this.auth.currentUserValue?.id || 1)
    }).subscribe(() => this.loadAllData());
  }

  flagExpense(expense: ExpenseClaim) {
    this.api.auditExpense(expense.id, {
      auditStatus: 'REJECTED_FLAGGED',
      auditRemarks: 'Flagged for audit review',
      auditorId: String(this.auth.currentUserValue?.id || 1)
    }).subscribe(() => this.loadAllData());
  }

  // Shipment Creation (Logistics Coordinator)
  openCreateShipmentModal() {
    this.showCreateShipmentModal = true;
    this.newShipment = {
      assetName: '',
      serialNumber: 'SN-' + Math.floor(100000 + Math.random() * 900000),
      destinationVenue: '',
      targetDeliveryDate: new Date().toISOString().split('T')[0],
      trackingCode: 'LOG-CBG-' + Math.floor(100000 + Math.random() * 900000),
      shippingCarrier: 'FedEx Express',
      weightKg: 8.5
    };
  }

  submitShipment() {
    if (!this.newShipment.assetName || !this.newShipment.destinationVenue) return;
    const payload = {
      assetName: this.newShipment.assetName,
      serialNumber: this.newShipment.serialNumber,
      destinationVenue: this.newShipment.destinationVenue,
      syncedEmployee: { id: this.auth.currentUserValue?.id || 1 },
      targetDeliveryDate: this.newShipment.targetDeliveryDate,
      trackingCode: this.newShipment.trackingCode,
      status: 'IN_TRANSIT',
      weightKg: this.newShipment.weightKg,
      shippingCarrier: this.newShipment.shippingCarrier
    };

    this.api.createShipment(payload).subscribe(() => {
      this.showCreateShipmentModal = false;
      this.loadAllData();
    });
  }

  updateShipmentStatus(shipment: Shipment, newStatus: string) {
    this.api.updateShipmentStatus(shipment.id, { status: newStatus }).subscribe(() => {
      this.loadAllData();
    });
  }

  markRead(notification: Notification) {
    this.api.markNotificationRead(notification.id).subscribe(() => {
      this.loadAllData();
    });
  }

  triggerSos(location: TravelerLocation) {
    this.api.triggerSos({ employeeId: location.employee.id }).subscribe(() => {
      this.loadAllData();
    });
  }

  // Formatters & Helpers
  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'APPROVED': '#30D158',
      'COMPLETED': '#30D158',
      'DELIVERED': '#30D158',
      'SAFE': '#30D158',
      'APPROVED_PAYOUT': '#30D158',
      'PENDING_APPROVAL': '#FF9F0A',
      'PENDING_AUDIT': '#FF9F0A',
      'IN_TRANSIT': '#0A84FF',
      'CUSTOMS_CLEARANCE': '#BF5AF2',
      'POLICY_VIOLATION': '#FF453A',
      'REJECTED': '#FF453A',
      'REJECTED_FLAGGED': '#FF453A',
      'ALERT': '#FF9F0A',
      'ASSISTANCE_REQUESTED': '#FF453A',
      'MODERATE': '#FF9F0A',
      'HIGH': '#FF453A',
      'CRITICAL': '#FF453A',
      'LOW': '#30D158',
      'DRAFT': '#8e8e93'
    };
    return map[status] || '#8e8e93';
  }

  getThreatIcon(level: string): string {
    const map: Record<string, string> = {
      'LOW': '🟢', 'MODERATE': '🟡', 'HIGH': '🔴', 'CRITICAL': '⚠️'
    };
    return map[level] || '⚪';
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      'FLIGHT': '✈️', 'HOTEL': '🏨', 'GROUND_TRANSPORT': '🚗',
      'MEALS': '🍽️', 'MISC': '📦', 'LOGISTICS': '📦',
      'RISK': '🛡️', 'SYSTEM': '⚙️'
    };
    return map[category] || '📋';
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
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  get unreadNotifications(): number {
    return this.notifications.filter(n => !n.readStatus).length;
  }

  get pendingRequestsCount(): number {
    return this.travelRequests.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'POLICY_VIOLATION').length;
  }

  get pendingExpensesCount(): number {
    return this.expenses.filter(e => e.auditStatus === 'PENDING_AUDIT').length;
  }

  getDeptSpendMax(): number {
    if (!this.analytics?.spendByDepartment?.length) return 1;
    return Math.max(...this.analytics.spendByDepartment.map(d => d.spend));
  }

  getVendorBadges(badges: string): string[] {
    return badges ? badges.split(',').map(b => b.trim()) : [];
  }
}
