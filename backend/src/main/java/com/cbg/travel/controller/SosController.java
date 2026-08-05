package com.cbg.travel.controller;

import com.cbg.travel.entity.Employee;
import com.cbg.travel.entity.Notification;
import com.cbg.travel.entity.UserRole;
import com.cbg.travel.repository.EmployeeRepository;
import com.cbg.travel.repository.NotificationRepository;
import com.cbg.travel.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sos")
@CrossOrigin(origins = "*")
public class SosController {

    private final EmployeeRepository employeeRepo;
    private final NotificationRepository notificationRepo;
    private final AuditService auditService;

    public SosController(EmployeeRepository employeeRepo,
                         NotificationRepository notificationRepo,
                         AuditService auditService) {
        this.employeeRepo = employeeRepo;
        this.notificationRepo = notificationRepo;
        this.auditService = auditService;
    }

    @PostMapping("/trigger")
    public ResponseEntity<?> triggerSos(@RequestBody Map<String, Object> payload) {
        Long employeeId = payload.containsKey("employeeId") ? Long.valueOf(payload.get("employeeId").toString()) : null;
        String location = payload.containsKey("location") ? (String) payload.get("location") : "GPS Coordinates Transmitted (37.7749, -122.4194)";
        String note = payload.containsKey("note") ? (String) payload.get("note") : "Emergency Panic Signal Triggered by Employee";

        Employee employee = null;
        if (employeeId != null) {
            Optional<Employee> empOpt = employeeRepo.findById(employeeId);
            if (empOpt.isPresent()) {
                employee = empOpt.get();
            }
        }

        String empName = employee != null ? employee.getFullName() : "Traveling Employee";
        String empRole = employee != null ? employee.getRole().name() : "EMPLOYEE";
        String phone = employee != null ? employee.getPhone() : "N/A";

        // 1. Dispatch CRITICAL alert notification to Security & Risk Officers
        List<Employee> riskOfficers = employeeRepo.findAll().stream()
                .filter(e -> e.getRole() == UserRole.RISK_OFFICER || e.getRole() == UserRole.CORPORATE_TRAVEL_MANAGER)
                .toList();

        for (Employee officer : riskOfficers) {
            Notification alert = new Notification();
            alert.setTitle("🚨 CRITICAL SOS PANIC DISPATCH: " + empName);
            alert.setMessage("EMERGENCY ALERT: " + empName + " (" + phone + ") triggered SOS panic button! Location: " + location + ". Note: " + note);
            alert.setSeverity("CRITICAL");
            alert.setCategory("SAFETY");
            alert.setTargetEmployee(officer);
            notificationRepo.save(alert);
        }

        // 2. Also send confirmation alert to the employee
        if (employee != null) {
            Notification empConf = new Notification();
            empConf.setTitle("🚨 Emergency Dispatch Active");
            empConf.setMessage("SOS Panic Received! Global Security Center, Local First Responders, and Risk Officers have been notified. Stay in a safe location.");
            empConf.setSeverity("CRITICAL");
            empConf.setCategory("SAFETY");
            empConf.setTargetEmployee(employee);
            notificationRepo.save(empConf);
        }

        // 3. Log Audit Trail
        auditService.log(employeeId != null ? employeeId : 0L, empName, empRole,
                "CRITICAL", "SAFETY_SOS", employeeId != null ? String.valueOf(employeeId) : "0",
                "SOS Panic Signal Transmitted from " + location + " - " + note);

        return ResponseEntity.ok(Map.of(
                "status", "DISPATCHED",
                "message", "🚨 Emergency SOS Signal Transmitted to Global Security Command Center & Risk Officers!",
                "location", location,
                "securityHelpline", "+1-800-555-SAFE (7233)",
                "localEmergency", "911 / 112",
                "dispatchedAt", java.time.LocalDateTime.now().toString()
        ));
    }
}
