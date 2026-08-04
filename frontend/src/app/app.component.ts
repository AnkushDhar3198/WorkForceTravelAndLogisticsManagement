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

  // Login form
  loginEmail = 'david.chen@company.com';
  loginPassword = 'password';
  loginError = '';
  isAuthenticating = false;

  // Modals
  showCreateRequestModal = false;
  showDetailModal = false;
  selectedRequest: TravelRequest | null = null;

  // Form
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

  // Login handlers
  onLoginSubmit() {
    if (!this.loginEmail) return;
    this.isAuthenticating = true;
    this.loginError = '';

    this.api.getEmployees().subscribe({
      next: (emps) => {
        const found = emps.find(e => e.email.toLowerCase() === this.loginEmail.toLowerCase());
        if (found) {
          this.auth.loginAsPersona(found);
          this.isAuthenticating = false;
          this.loadAllData();
        } else {
          this.loginError = 'User email not found in enterprise directory';
          this.isAuthenticating = false;
        }
      },
      error: () => {
        this.loginError = 'Server authentication error';
        this.isAuthenticating = false;
      }
    });
  }

  quickLoginAsRole(roleName: string) {
    if (!this.employees || this.employees.length === 0) return;
    const matched = this.employees.find(e => e.role === roleName);
    if (matched) {
      this.auth.loginAsPersona(matched);
      this.loadAllData();
    }
  }

  logout() {
    this.auth.logout();
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

  // Filtering
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
    link.setAttribute('download', `workforce_${this.activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Modals
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

  approveExpense(expense: ExpenseClaim) {
    this.api.auditExpense(expense.id, {
      auditStatus: 'APPROVED_PAYOUT',
      auditRemarks: 'Approved for reimbursement',
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

  triggerSos(location: TravelerLocation) {
    this.api.triggerSos({ employeeId: location.employee.id }).subscribe(() => {
      this.loadAllData();
    });
  }

  // Formatters
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
