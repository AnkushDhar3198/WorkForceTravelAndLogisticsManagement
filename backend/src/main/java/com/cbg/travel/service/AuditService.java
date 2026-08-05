package com.cbg.travel.service;

import com.cbg.travel.entity.AuditLog;
import com.cbg.travel.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class AuditService {

    private final AuditLogRepository auditLogRepo;

    public AuditService(AuditLogRepository auditLogRepo) {
        this.auditLogRepo = auditLogRepo;
    }

    public void log(Long userId, String userName, String userRole,
                    String actionType, String entityType, String entityId,
                    String details, String ipAddress) {
        AuditLog log = new AuditLog(userId, userName, userRole, actionType,
                entityType, entityId, details, ipAddress);
        auditLogRepo.save(log);
    }

    public void log(Long userId, String userName, String userRole,
                    String actionType, String entityType, String entityId, String details) {
        log(userId, userName, userRole, actionType, entityType, entityId, details, "0.0.0.0");
    }

    public List<AuditLog> getAll() {
        return auditLogRepo.findAllByOrderByTimestampDesc();
    }

    public List<AuditLog> getByUser(Long userId) {
        return auditLogRepo.findByUserIdOrderByTimestampDesc(userId);
    }

    public List<AuditLog> getByActionType(String actionType) {
        return auditLogRepo.findByActionTypeOrderByTimestampDesc(actionType);
    }

    public List<AuditLog> getByEntityType(String entityType) {
        return auditLogRepo.findByEntityTypeOrderByTimestampDesc(entityType);
    }

    public List<AuditLog> getByDateRange(LocalDateTime from, LocalDateTime to) {
        return auditLogRepo.findByDateRange(from, to);
    }

    public List<AuditLog> getFiltered(String actionType, String entityType, Long userId) {
        return auditLogRepo.findFiltered(actionType, entityType, userId);
    }
}
