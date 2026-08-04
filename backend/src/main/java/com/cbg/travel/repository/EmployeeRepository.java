package com.cbg.travel.repository;

import com.cbg.travel.entity.Employee;
import com.cbg.travel.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByEmployeeCode(String employeeCode);
    List<Employee> findByRole(UserRole role);
    List<Employee> findByDepartment(String department);
    List<Employee> findByManagerId(Long managerId);
    List<Employee> findByActiveTrue();

    @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.active = true")
    List<String> findAllDepartments();
}
