package com.cbg.travel.repository;

import com.cbg.travel.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByTimestampDesc();
    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);
    List<AuditLog> findByActionTypeOrderByTimestampDesc(String actionType);
    List<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType);

    @Query("SELECT a FROM AuditLog a WHERE a.timestamp >= :from AND a.timestamp <= :to ORDER BY a.timestamp DESC")
    List<AuditLog> findByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:actionType IS NULL OR a.actionType = :actionType) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) AND " +
           "(:userId IS NULL OR a.userId = :userId) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> findFiltered(@Param("actionType") String actionType,
                                @Param("entityType") String entityType,
                                @Param("userId") Long userId);
}
