package com.cbg.travel.repository;

import com.cbg.travel.entity.ExpenseClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ExpenseClaimRepository extends JpaRepository<ExpenseClaim, Long> {
    List<ExpenseClaim> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<ExpenseClaim> findByAuditStatusOrderByCreatedAtDesc(String auditStatus);
    List<ExpenseClaim> findByTravelRequestIdOrderByExpenseDateAsc(Long travelRequestId);
    List<ExpenseClaim> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(ec.amount), 0) FROM ExpenseClaim ec WHERE ec.auditStatus = 'APPROVED_PAYOUT'")
    Double getTotalReimbursedAmount();

    @Query("SELECT ec.category, COALESCE(SUM(ec.amount), 0) FROM ExpenseClaim ec GROUP BY ec.category")
    List<Object[]> getSpendByCategory();
}
