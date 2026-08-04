package com.cbg.travel.controller;

import com.cbg.travel.entity.Employee;
import com.cbg.travel.repository.EmployeeRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final EmployeeRepository employeeRepo;

    public EmployeeController(EmployeeRepository employeeRepo) {
        this.employeeRepo = employeeRepo;
    }

    @GetMapping
    public List<Employee> getAll() {
        return employeeRepo.findByActiveTrue();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getById(@PathVariable Long id) {
        return employeeRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Employee create(@RequestBody Employee employee) {
        return employeeRepo.save(employee);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> update(@PathVariable Long id, @RequestBody Employee updated) {
        return employeeRepo.findById(id)
                .map(existing -> {
                    existing.setFirstName(updated.getFirstName());
                    existing.setLastName(updated.getLastName());
                    existing.setEmail(updated.getEmail());
                    existing.setPhone(updated.getPhone());
                    existing.setDepartment(updated.getDepartment());
                    existing.setDesignation(updated.getDesignation());
                    existing.setRole(updated.getRole());
                    return ResponseEntity.ok(employeeRepo.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/departments")
    public List<String> getDepartments() {
        return employeeRepo.findAllDepartments();
    }
}
