import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  TravelRequest, Employee, Vendor, Shipment,
  Notification, TravelerLocation, ExpenseClaim, DashboardAnalytics
} from './services/api.service';
import { Subscription, interval, startWith, switchMap, forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  activeTab = 'dashboard';
  sidebarOpen = true;

  // Data
  analytics: DashboardAnalytics | null = null;
  travelRequests: TravelRequest[] = [];
  employees: Employee[] = [];
  vendors: Vendor[] = [];
  shipments: Shipment[] = [];
  notifications: Notification[] = [];
  travelerLocations: TravelerLocation[] = [];
  expenses: ExpenseClaim[] = [];

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

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadAllData();
    // Poll every 30 seconds for real-time updates
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

  switchTab(tab: string) {
    this.activeTab = tab;
    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Travel Request CRUD
  openCreateModal() {
    this.showCreateRequestModal = true;
    this.newRequest = {
      employeeId: null,
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
      approverId: '1',
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
      approverId: '1',
      remarks: this.approvalRemarks
    }).subscribe(() => {
      this.closeDetailModal();
      this.loadAllData();
    });
  }

  // Shipment actions
  updateShipmentStatus(shipment: Shipment, newStatus: string) {
    this.api.updateShipmentStatus(shipment.id, { status: newStatus }).subscribe(() => {
      this.loadAllData();
    });
  }

  // Notification actions
  markRead(notification: Notification) {
    this.api.markNotificationRead(notification.id).subscribe(() => {
      this.loadAllData();
    });
  }

  // Expense actions
  approveExpense(expense: ExpenseClaim) {
    this.api.auditExpense(expense.id, {
      auditStatus: 'APPROVED_PAYOUT',
      auditRemarks: 'Approved for reimbursement',
      auditorId: '1'
    }).subscribe(() => this.loadAllData());
  }

  flagExpense(expense: ExpenseClaim) {
    this.api.auditExpense(expense.id, {
      auditStatus: 'REJECTED_FLAGGED',
      auditRemarks: 'Flagged for review',
      auditorId: '1'
    }).subscribe(() => this.loadAllData());
  }

  // SOS
  triggerSos(location: TravelerLocation) {
    this.api.triggerSos({ employeeId: location.employee.id }).subscribe(() => {
      this.loadAllData();
    });
  }

  // Helpers
  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'APPROVED': '#34c759',
      'COMPLETED': '#34c759',
      'DELIVERED': '#34c759',
      'SAFE': '#34c759',
      'APPROVED_PAYOUT': '#34c759',
      'PENDING_APPROVAL': '#ff9f0a',
      'PENDING_AUDIT': '#ff9f0a',
      'IN_TRANSIT': '#007aff',
      'CUSTOMS_CLEARANCE': '#5856d6',
      'POLICY_VIOLATION': '#ff3b30',
      'REJECTED': '#ff3b30',
      'REJECTED_FLAGGED': '#ff3b30',
      'ALERT': '#ff9f0a',
      'ASSISTANCE_REQUESTED': '#ff3b30',
      'MODERATE': '#ff9f0a',
      'HIGH': '#ff3b30',
      'CRITICAL': '#ff3b30',
      'LOW': '#34c759',
      'DRAFT': '#8e8e93'
    };
    return map[status] || '#8e8e93';
  }

  getThreatIcon(level: string): string {
    const map: Record<string, string> = {
      'LOW': '🟢',
      'MODERATE': '🟡',
      'HIGH': '🔴',
      'CRITICAL': '⚠️'
    };
    return map[level] || '⚪';
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      'FLIGHT': '✈️',
      'HOTEL': '🏨',
      'GROUND_TRANSPORT': '🚗',
      'MEALS': '🍽️',
      'MISC': '📦',
      'LOGISTICS': '📦',
      'RISK': '🛡️',
      'SYSTEM': '⚙️'
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
