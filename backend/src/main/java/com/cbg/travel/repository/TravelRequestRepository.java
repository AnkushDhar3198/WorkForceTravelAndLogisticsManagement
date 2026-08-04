package com.cbg.travel.repository;

import com.cbg.travel.entity.TravelRequest;
import com.cbg.travel.entity.TravelRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TravelRequestRepository extends JpaRepository<TravelRequest, Long> {
    List<TravelRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<TravelRequest> findByStatusOrderByCreatedAtDesc(TravelRequestStatus status);
    List<TravelRequest> findAllByOrderByCreatedAtDesc();

    @Query("SELECT tr FROM TravelRequest tr WHERE tr.employee.managerId = :managerId AND tr.status = :status ORDER BY tr.createdAt DESC")
    List<TravelRequest> findPendingForManager(@Param("managerId") Long managerId, @Param("status") TravelRequestStatus status);

    @Query("SELECT COALESCE(SUM(tr.estimatedBudget), 0) FROM TravelRequest tr WHERE tr.status = 'APPROVED'")
    Double getTotalApprovedSpend();

    @Query("SELECT tr.employee.department, COALESCE(SUM(tr.estimatedBudget), 0) FROM TravelRequest tr WHERE tr.status = 'APPROVED' GROUP BY tr.employee.department")
    List<Object[]> getSpendByDepartment();

    @Query("SELECT COUNT(tr) FROM TravelRequest tr WHERE tr.status IN ('APPROVED', 'COMPLETED') AND tr.startDate <= CURRENT_DATE AND tr.endDate >= CURRENT_DATE")
    Long getActiveTripsCount();

    @Query("SELECT COUNT(tr) FROM TravelRequest tr WHERE tr.policyViolations IS NOT NULL AND tr.policyViolations <> ''")
    Long getPolicyViolationCount();

    @Query("SELECT COUNT(tr) FROM TravelRequest tr")
    Long getTotalRequestCount();
}
