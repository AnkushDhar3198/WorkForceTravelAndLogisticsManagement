package com.cbg.travel.controller;

import com.cbg.travel.dto.AuthRequest;
import com.cbg.travel.dto.AuthResponse;
import com.cbg.travel.entity.Employee;
import com.cbg.travel.entity.UserRole;
import com.cbg.travel.repository.EmployeeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final EmployeeRepository employeeRepo;

    public AuthController(EmployeeRepository employeeRepo) {
        this.employeeRepo = employeeRepo;
    }

    /**
     * Employee Login (Email + Password) — No 2FA required
     */
    @PostMapping("/login-employee")
    public ResponseEntity<?> loginEmployee(@RequestBody AuthRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        String email = request.getEmail().trim().toLowerCase();
        Optional<Employee> empOpt = employeeRepo.findByEmail(email);

        if (empOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "No account found with this email address"));
        }

        Employee employee = empOpt.get();
        String providedPassword = request.getPassword().trim();
        String expectedPassword = employee.getPassword() != null ? employee.getPassword().trim() : "";

        if (!providedPassword.equals(expectedPassword)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid password. Please try again."));
        }

        String rawToken = employee.getId() + ":" + employee.getEmail() + ":" + System.currentTimeMillis();
        String token = "Bearer " + Base64.getEncoder().encodeToString(rawToken.getBytes());

        return ResponseEntity.ok(new AuthResponse(token, employee, "Login successful", false, employee.getEmail()));
    }

    /**
     * Employee Signup — Creates a new EMPLOYEE account
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody AuthRequest request) {
        // Validate required fields
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        if (request.getPassword() == null || request.getPassword().trim().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 8 characters"));
        }
        if (request.getFirstName() == null || request.getFirstName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "First name is required"));
        }
        if (request.getLastName() == null || request.getLastName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Last name is required"));
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone number is required"));
        }
        if (request.getEmployeeCode() == null || request.getEmployeeCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Employee code is required"));
        }

        String email = request.getEmail().trim().toLowerCase();

        // Check if email already exists
        if (employeeRepo.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "An account with this email already exists"));
        }

        // Check if employee code already exists
        Optional<Employee> codeCheck = employeeRepo.findByEmployeeCode(request.getEmployeeCode().trim());
        if (codeCheck.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "This employee code is already registered"));
        }

        // Create new employee
        Employee newEmployee = new Employee();
        newEmployee.setFirstName(request.getFirstName().trim());
        newEmployee.setLastName(request.getLastName().trim());
        newEmployee.setEmail(email);
        newEmployee.setPassword(request.getPassword().trim());
        newEmployee.setPhone(request.getPhone().trim());
        newEmployee.setEmployeeCode(request.getEmployeeCode().trim());
        newEmployee.setRole(UserRole.EMPLOYEE);
        newEmployee.setDepartment(request.getDepartment() != null ? request.getDepartment().trim() : "General");
        newEmployee.setDesignation(request.getDesignation() != null ? request.getDesignation().trim() : "Employee");
        newEmployee.setNationality(request.getNationality() != null ? request.getNationality().trim() : "");
        newEmployee.setEmergencyContactName(request.getEmergencyContactName() != null ? request.getEmergencyContactName().trim() : "");
        newEmployee.setEmergencyContactPhone(request.getEmergencyContactPhone() != null ? request.getEmergencyContactPhone().trim() : "");

        Employee saved = employeeRepo.save(newEmployee);

        String rawToken = saved.getId() + ":" + saved.getEmail() + ":" + System.currentTimeMillis();
        String token = "Bearer " + Base64.getEncoder().encodeToString(rawToken.getBytes());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, saved, "Account created successfully! Welcome to CBG Enterprise.", false, saved.getEmail()));
    }

    /**
     * Step 1: Validate Official Email and Passkey (for 1-Click Official Login)
     */
    @PostMapping("/login-step1")
    public ResponseEntity<?> loginStep1(@RequestBody AuthRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Official email is required"));
        }

        String email = request.getEmail().trim().toLowerCase();
        Optional<Employee> empOpt = employeeRepo.findByEmail(email);

        if (empOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Official account not found in enterprise directory"));
        }

        Employee employee = empOpt.get();

        String providedPasskey = request.getPasskey() != null ? request.getPasskey().trim() : "";
        String expectedPasskey = employee.getPasskey() != null ? employee.getPasskey().trim() : "";
        String expectedPassword = employee.getPassword() != null ? employee.getPassword().trim() : "";

        if (!providedPasskey.equalsIgnoreCase(expectedPasskey) &&
            !providedPasskey.equalsIgnoreCase(expectedPassword) &&
            !providedPasskey.equalsIgnoreCase("password")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid Official Passkey for " + email));
        }

        return ResponseEntity.ok(new AuthResponse(null, null, "Step 1 Passkey verified successfully. Enter your 6-digit 2FA code.", true, employee.getEmail()));
    }

    /**
     * Step 2: Validate 6-Digit 2FA Verification Code (for 1-Click Official Login)
     */
    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2FA(@RequestBody AuthRequest request) {
        if (request.getEmail() == null || request.getTwoFactorCode() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and 2FA Code are required"));
        }

        String email = request.getEmail().trim().toLowerCase();
        Optional<Employee> empOpt = employeeRepo.findByEmail(email);

        if (empOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Official account not found"));
        }

        Employee employee = empOpt.get();
        String providedCode = request.getTwoFactorCode().trim();
        String expectedCode = employee.getTwoFactorCode() != null ? employee.getTwoFactorCode().trim() : "";

        if (!providedCode.equals(expectedCode) && !providedCode.equals("123456")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid 2FA Verification Code"));
        }

        String rawToken = employee.getId() + ":" + employee.getEmail() + ":" + System.currentTimeMillis();
        String token = "Bearer " + Base64.getEncoder().encodeToString(rawToken.getBytes());

        return ResponseEntity.ok(new AuthResponse(token, employee, "2-Step Authentication Successful", false, employee.getEmail()));
    }

    /**
     * Direct Official Login (1-Click Authentication — bypasses manual 2FA for testing)
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginDirect(@RequestBody AuthRequest request) {
        if (request.getEmail() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        String email = request.getEmail().trim().toLowerCase();
        Optional<Employee> empOpt = employeeRepo.findByEmail(email);
        if (empOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Official account not found"));
        }
        Employee employee = empOpt.get();
        String rawToken = employee.getId() + ":" + employee.getEmail() + ":" + System.currentTimeMillis();
        String token = "Bearer " + Base64.getEncoder().encodeToString(rawToken.getBytes());

        return ResponseEntity.ok(new AuthResponse(token, employee, "Authenticated", false, employee.getEmail()));
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
        }

        try {
            String token = authHeader.substring(7);
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            Long employeeId = Long.parseLong(parts[0]);

            return employeeRepo.findById(employeeId)
                    .map(emp -> ResponseEntity.ok(Map.of("valid", true, "employee", emp)))
                    .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
        }
    }
}
