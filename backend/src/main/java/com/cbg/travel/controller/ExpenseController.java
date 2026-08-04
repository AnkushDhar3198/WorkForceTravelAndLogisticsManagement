package com.cbg.travel.controller;

import com.cbg.travel.entity.ExpenseClaim;
import com.cbg.travel.entity.Employee;
import com.cbg.travel.repository.ExpenseClaimRepository;
import com.cbg.travel.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    private final ExpenseClaimRepository expenseRepo;
    private final EmployeeRepository employeeRepo;

    public ExpenseController(ExpenseClaimRepository expenseRepo, EmployeeRepository employeeRepo) {
        this.expenseRepo = expenseRepo;
        this.employeeRepo = employeeRepo;
    }

    @GetMapping
    public List<ExpenseClaim> getAll() {
        return expenseRepo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/employee/{employeeId}")
    public List<ExpenseClaim> getByEmployee(@PathVariable Long employeeId) {
        return expenseRepo.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    @GetMapping("/pending-audit")
    public List<ExpenseClaim> getPendingAudit() {
        return expenseRepo.findByAuditStatusOrderByCreatedAtDesc("PENDING_AUDIT");
    }

    @PostMapping
    public ExpenseClaim create(@RequestBody ExpenseClaim claim) {
        if (claim.getAuditStatus() == null) {
            claim.setAuditStatus("PENDING_AUDIT");
        }
        return expenseRepo.save(claim);
    }

    @PutMapping("/{id}/audit")
    public ResponseEntity<ExpenseClaim> auditClaim(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return expenseRepo.findById(id)
                .map(existing -> {
                    existing.setAuditStatus(body.get("auditStatus"));
                    if (body.containsKey("auditRemarks")) existing.setAuditRemarks(body.get("auditRemarks"));
                    if (body.containsKey("auditorId")) {
                        employeeRepo.findById(Long.valueOf(body.get("auditorId")))
                                .ifPresent(existing::setAuditedBy);
                    }
                    existing.setAuditedAt(LocalDateTime.now());
                    return ResponseEntity.ok(expenseRepo.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reimburse")
    public ResponseEntity<ExpenseClaim> reimburse(@PathVariable Long id) {
        return expenseRepo.findById(id)
                .map(existing -> {
                    existing.setAuditStatus("APPROVED_PAYOUT");
                    existing.setAuditedAt(LocalDateTime.now());
                    return ResponseEntity.ok(expenseRepo.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
