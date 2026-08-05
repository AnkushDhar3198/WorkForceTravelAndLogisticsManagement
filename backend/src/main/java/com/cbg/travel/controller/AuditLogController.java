package com.cbg.travel.controller;

import com.cbg.travel.entity.AuditLog;
import com.cbg.travel.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditService auditService;

    public AuditLogController(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * Get all audit logs (admin-only in frontend).
     * Logs are immutable — no PUT/DELETE endpoints exist.
     */
    @GetMapping
    public List<AuditLog> getAll() {
        return auditService.getAll();
    }

    @GetMapping("/user/{userId}")
    public List<AuditLog> getByUser(@PathVariable Long userId) {
        return auditService.getByUser(userId);
    }

    @GetMapping("/action/{actionType}")
    public List<AuditLog> getByAction(@PathVariable String actionType) {
        return auditService.getByActionType(actionType);
    }

    @GetMapping("/entity/{entityType}")
    public List<AuditLog> getByEntity(@PathVariable String entityType) {
        return auditService.getByEntityType(entityType);
    }

    @GetMapping("/filter")
    public List<AuditLog> getFiltered(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long userId) {
        return auditService.getFiltered(actionType, entityType, userId);
    }
}
