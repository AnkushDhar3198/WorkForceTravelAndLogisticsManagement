package com.cbg.travel.service;

import com.cbg.travel.entity.*;
import com.cbg.travel.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TravelRequestService {

    private final TravelRequestRepository travelRequestRepo;
    private final EmployeeRepository employeeRepo;
    private final PolicyRuleRepository policyRuleRepo;
    private final NotificationRepository notificationRepo;

    public TravelRequestService(TravelRequestRepository travelRequestRepo,
                                EmployeeRepository employeeRepo,
                                PolicyRuleRepository policyRuleRepo,
                                NotificationRepository notificationRepo) {
        this.travelRequestRepo = travelRequestRepo;
        this.employeeRepo = employeeRepo;
        this.policyRuleRepo = policyRuleRepo;
        this.notificationRepo = notificationRepo;
    }

    public List<TravelRequest> getAllRequests() {
        return travelRequestRepo.findAllByOrderByCreatedAtDesc();
    }

    public Optional<TravelRequest> getById(Long id) {
        return travelRequestRepo.findById(id);
    }

    public List<TravelRequest> getByEmployee(Long employeeId) {
        return travelRequestRepo.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    public List<TravelRequest> getPendingForApproval() {
        return travelRequestRepo.findByStatusOrderByCreatedAtDesc(TravelRequestStatus.PENDING_APPROVAL);
    }

    /**
     * Creates a new travel request with automated policy engine validation.
     * This is the core business logic for User Story 1 & 2.
     */
    public TravelRequest createRequest(TravelRequest request) {
        // Validate employee exists
        Employee reqEmployee = request.getEmployee();
        if (reqEmployee == null || reqEmployee.getId() == null) {
            throw new IllegalArgumentException("Employee is required");
        }
        final Long employeeId = reqEmployee.getId();
        Employee employee = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));
        request.setEmployee(employee);

        // Validate dates
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }

        // Run automated policy engine
        List<String> violations = runPolicyEngine(request);

        if (!violations.isEmpty()) {
            request.setStatus(TravelRequestStatus.POLICY_VIOLATION);
            request.setPolicyViolations(String.join("; ", violations));
            request.setPolicyComplianceScore(calculateComplianceScore(violations.size()));
        } else {
            request.setStatus(TravelRequestStatus.PENDING_APPROVAL);
            request.setPolicyComplianceScore(100);
        }

        // Calculate ROI score based on business factors
        request.setRoiScore(calculateRoiScore(request));

        TravelRequest saved = travelRequestRepo.save(request);

        // Create notification for manager
        createApprovalNotification(saved);

        return saved;
    }

    /**
     * Automated Policy Engine - evaluates all active policy rules against the request.
     * This implements User Story 2.
     */
    private List<String> runPolicyEngine(TravelRequest request) {
        List<String> violations = new ArrayList<>();
        List<PolicyRule> rules = policyRuleRepo.findByActiveTrue();

        for (PolicyRule rule : rules) {
            switch (rule.getRuleType()) {
                case "HOTEL_CAP":
                    if (request.getHotelDailyRate() != null && rule.getThresholdValue() != null) {
                        if ("GT".equals(rule.getComparisonOperator()) && request.getHotelDailyRate() > rule.getThresholdValue()) {
                            violations.add(String.format(rule.getViolationMessage(),
                                    request.getHotelDailyRate(), rule.getThresholdValue()));
                        }
                    }
                    break;

                case "FLIGHT_CLASS":
                    if (request.getFlightClass() != null && rule.getAllowedValues() != null) {
                        List<String> allowed = Arrays.asList(rule.getAllowedValues().split(","));
                        if ("NOT_IN".equals(rule.getComparisonOperator()) && allowed.contains(request.getFlightClass())) {
                            violations.add(rule.getViolationMessage());
                        }
                    }
                    break;

                case "ADVANCE_BOOKING":
                    if (request.getStartDate() != null && rule.getThresholdValue() != null) {
                        long daysInAdvance = ChronoUnit.DAYS.between(LocalDate.now(), request.getStartDate());
                        if ("LT".equals(rule.getComparisonOperator()) && daysInAdvance < rule.getThresholdValue()) {
                            violations.add(String.format(rule.getViolationMessage(), (int) daysInAdvance));
                        }
                    }
                    break;

                case "BUDGET_CAP":
                    if (request.getEstimatedBudget() != null && rule.getThresholdValue() != null) {
                        if ("GT".equals(rule.getComparisonOperator()) && request.getEstimatedBudget() > rule.getThresholdValue()) {
                            violations.add(String.format(rule.getViolationMessage(),
                                    request.getEstimatedBudget(), rule.getThresholdValue()));
                        }
                    }
                    break;
            }
        }

        return violations;
    }

    /**
     * Manager approval/rejection workflow - User Story 3
     */
    public TravelRequest updateStatus(Long requestId, TravelRequestStatus newStatus, Long approverId, String remarks) {
        TravelRequest request = travelRequestRepo.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Travel request not found: " + requestId));

        request.setStatus(newStatus);
        request.setManagerRemarks(remarks);

        if (approverId != null) {
            Employee approver = employeeRepo.findById(approverId).orElse(null);
            request.setApprovedBy(approver);
        }

        if (newStatus == TravelRequestStatus.APPROVED || newStatus == TravelRequestStatus.REJECTED) {
            request.setApprovedAt(LocalDateTime.now());

            // Create notification for employee
            Notification notification = new Notification();
            notification.setTitle("Travel Request " + newStatus.name());
            notification.setMessage("Your request #" + requestId + " to " + request.getDestination()
                    + " has been " + newStatus.name().toLowerCase() + "."
                    + (remarks != null ? " Remarks: " + remarks : ""));
            notification.setSeverity(newStatus == TravelRequestStatus.APPROVED ? "INFO" : "HIGH");
            notification.setCategory("SYSTEM");
            notification.setTargetEmployee(request.getEmployee());
            notificationRepo.save(notification);
        }

        return travelRequestRepo.save(request);
    }

    private int calculateComplianceScore(int violationCount) {
        return Math.max(0, 100 - (violationCount * 25));
    }

    private int calculateRoiScore(TravelRequest request) {
        int score = 70; // base score

        // Purpose-based scoring
        String purpose = request.getPurpose() != null ? request.getPurpose().toLowerCase() : "";
        if (purpose.contains("conference") || purpose.contains("summit")) score += 10;
        if (purpose.contains("client") || purpose.contains("deal")) score += 15;
        if (purpose.contains("training")) score += 5;
        if (purpose.contains("audit") || purpose.contains("compliance")) score += 12;

        // Cost efficiency
        if (request.getEstimatedBudget() != null && request.getEstimatedBudget() < 3000) score += 5;
        if ("ECONOMY".equals(request.getFlightClass())) score += 5;

        // Advance booking
        if (request.getStartDate() != null) {
            long daysAhead = ChronoUnit.DAYS.between(LocalDate.now(), request.getStartDate());
            if (daysAhead > 14) score += 5;
        }

        return Math.min(100, score);
    }

    private void createApprovalNotification(TravelRequest request) {
        if (request.getEmployee().getManagerId() != null) {
            employeeRepo.findById(request.getEmployee().getManagerId()).ifPresent(manager -> {
                Notification notification = new Notification();
                notification.setTitle("New Travel Request Pending Approval");
                notification.setMessage(request.getEmployee().getFullName() + " submitted request #"
                        + request.getId() + " to " + request.getDestination()
                        + " ($" + request.getEstimatedBudget() + ")");
                notification.setSeverity(request.getStatus() == TravelRequestStatus.POLICY_VIOLATION ? "HIGH" : "MEDIUM");
                notification.setCategory("SYSTEM");
                notification.setTargetEmployee(manager);
                notificationRepo.save(notification);
            });
        }
    }
}
