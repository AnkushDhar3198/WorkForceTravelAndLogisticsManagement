import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { 
  TravelLogisticsService, 
  TravelRequest, 
  PreferredVendor, 
  LogisticsAsset, 
  DisruptionNotification, 
  TravelerRiskLocation, 
  ExpenseClaim, 
  AnalyticsSummary 
} from './services/travel-logistics.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  activeTab: string = 'pre-trip';
  activeRole: string = 'EMPLOYEE';

  // Story 1 & 2: New Trip Creation Form State
  newTrip = {
    employeeName: 'Sarah Jenkins',
    employeeRole: 'Senior AI Engineer',
    destination: 'San Francisco, USA',
    countryCode: 'US',
    startDate: '2026-09-10',
    endDate: '2026-09-16',
    purpose: 'Keynote Launch & Executive Partner Briefing',
    estimatedCost: 2950,
    flightClass: 'Economy Premium',
    hotelDailyRate: 310
  };

  // Data streams from Spring Boot Backend
  travelRequests: TravelRequest[] = [];
  vendors: PreferredVendor[] = [];
  logisticsAssets: LogisticsAsset[] = [];
  disruptions: DisruptionNotification[] = [];
  riskLocations: TravelerRiskLocation[] = [];
  expenses: ExpenseClaim[] = [];
  analytics: AnalyticsSummary | null = null;

  // Notification Toast & Modal states
  toastMessage: string | null = null;
  ocrScanning: boolean = false;
  ocrExtractedClaim: ExpenseClaim | null = null;
  selectedRiskTraveler: TravelerRiskLocation | null = null;

  constructor(private service: TravelLogisticsService) {}

  ngOnInit() {
    this.service.activeRole$.subscribe(r => this.activeRole = r);
    this.loadAllData();
  }

  loadAllData() {
    this.service.getTravelRequests().subscribe(data => this.travelRequests = data);
    this.service.getPreferredVendors().subscribe(data => this.vendors = data);
    this.service.getLogisticsAssets().subscribe(data => this.logisticsAssets = data);
    this.service.getDisruptionNotifications().subscribe(data => this.disruptions = data);
    this.service.getTravelerRiskLocations().subscribe(data => this.riskLocations = data);
    this.service.getExpenseClaims().subscribe(data => this.expenses = data);
    this.service.getAnalyticsSummary().subscribe(data => this.analytics = data);
  }

  switchRole(role: string) {
    this.service.setRole(role);
    this.showToast(`Switched view role to ${role}`);
  }

  submitTravelRequest() {
    this.service.createTravelRequest(this.newTrip).subscribe(res => {
      this.loadAllData();
      if (res.status === 'POLICY_VIOLATION') {
        this.showToast(`Trip created with Policy Exception flags!`);
      } else {
        this.showToast(`Travel Request submitted for Manager Approval!`);
      }
    });
  }

  updateRequestStatus(id: number, status: 'APPROVED' | 'REJECTED') {
    this.service.updateRequestStatus(id, status).subscribe(() => {
      this.loadAllData();
      this.showToast(`Request #${id} set to ${status}`);
    });
  }

  triggerOcrScan() {
    this.ocrScanning = true;
    setTimeout(() => {
      this.service.processOcrScan({ image: 'receipt_sample.png' }).subscribe(claim => {
        this.ocrScanning = false;
        this.ocrExtractedClaim = claim;
        this.loadAllData();
        this.showToast(`Receipt scanned with 99.4% OCR Confidence!`);
      });
    }, 2200);
  }

  approveReimbursement(claimId: number) {
    this.service.approveReimbursement(claimId).subscribe(() => {
      this.loadAllData();
      this.showToast(`Direct Bank Payout processed for Claim #${claimId}!`);
    });
  }

  triggerSosAlert(traveler: TravelerRiskLocation) {
    this.selectedRiskTraveler = traveler;
    this.showToast(`EMERGENCY SOS: Support team dispatched to ${traveler.city}!`);
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      this.toastMessage = null;
    }, 4000);
  }
}
