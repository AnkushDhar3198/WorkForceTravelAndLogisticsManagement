package com.cbg.travel.controller;

import com.cbg.travel.entity.ExpenseClaim;
import com.cbg.travel.repository.ExpenseClaimRepository;
import com.cbg.travel.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reimbursements")
@CrossOrigin(origins = "*")
public class ReimbursementController {

    private final ExpenseClaimRepository expenseRepo;
    private final AuditService auditService;

    public ReimbursementController(ExpenseClaimRepository expenseRepo, AuditService auditService) {
        this.expenseRepo = expenseRepo;
        this.auditService = auditService;
    }

    /**
     * Export approved expense claims for ERP/Payroll system (US-17).
     * Marks all exported claims as 'PAID'.
     * Returns a standardized export payload.
     */
    @PostMapping("/export")
    public ResponseEntity<?> exportForPayroll(@RequestBody(required = false) Map<String, Object> payload) {
        List<ExpenseClaim> approvedClaims = expenseRepo.findByAuditStatusOrderByCreatedAtDesc("APPROVED_PAYOUT");

        if (approvedClaims.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "message", "No approved claims pending for export",
                    "exportedCount", 0
            ));
        }

        // Build export records
        List<Map<String, Object>> exportRecords = new ArrayList<>();
        double totalAmount = 0;

        for (ExpenseClaim claim : approvedClaims) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("claimId", claim.getId());
            record.put("employeeCode", claim.getEmployee().getEmployeeCode());
            record.put("employeeName", claim.getEmployee().getFullName());
            record.put("department", claim.getEmployee().getDepartment());
            record.put("category", claim.getCategory());
            record.put("vendor", claim.getVendorName());
            record.put("expenseDate", claim.getExpenseDate().toString());
            record.put("amount", claim.getAmount());
            record.put("currency", claim.getCurrency() != null ? claim.getCurrency() : "USD");
            record.put("taxAmount", claim.getTaxAmount() != null ? claim.getTaxAmount() : 0.0);
            record.put("netPayable", claim.getAmount() + (claim.getTaxAmount() != null ? claim.getTaxAmount() : 0.0));
            exportRecords.add(record);
            totalAmount += claim.getAmount();

            // Mark as PAID
            claim.setAuditStatus("PAID");
            claim.setAuditedAt(LocalDateTime.now());
            expenseRepo.save(claim);
        }

        // Get user info from payload for audit
        Long userId = payload != null && payload.containsKey("userId") ?
                Long.valueOf(payload.get("userId").toString()) : 1L;
        String userName = payload != null && payload.containsKey("userName") ?
                (String) payload.get("userName") : "Finance Admin";

        auditService.log(userId, userName, "FINANCE_ADMIN",
                "EXPORT", "EXPENSE", "BATCH",
                "Exported " + approvedClaims.size() + " claims totaling $" +
                        String.format("%.2f", totalAmount) + " for ERP/Payroll processing");

        // Build CSV content
        StringBuilder csv = new StringBuilder();
        csv.append("ClaimID,EmployeeCode,EmployeeName,Department,Category,Vendor,ExpenseDate,Amount,Currency,Tax,NetPayable\n");
        for (Map<String, Object> rec : exportRecords) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%.2f\",\"%s\",\"%.2f\",\"%.2f\"\n",
                    rec.get("claimId"), rec.get("employeeCode"), rec.get("employeeName"),
                    rec.get("department"), rec.get("category"), rec.get("vendor"),
                    rec.get("expenseDate"), rec.get("amount"), rec.get("currency"),
                    rec.get("taxAmount"), rec.get("netPayable")));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Export completed successfully",
                "exportedCount", approvedClaims.size(),
                "totalAmount", totalAmount,
                "exportTimestamp", LocalDateTime.now().toString(),
                "records", exportRecords,
                "csvContent", csv.toString()
        ));
    }
}
