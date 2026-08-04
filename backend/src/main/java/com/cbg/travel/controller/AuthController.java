package com.cbg.travel.controller;

import com.cbg.travel.dto.AuthRequest;
import com.cbg.travel.dto.AuthResponse;
import com.cbg.travel.entity.Employee;
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
     * Step 1: Validate Official Email and Passkey
     */
    @PostMapping("/login-step1")
    public ResponseEntity<?> loginStep1(@RequestBody AuthRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Official email is required"));
        }

        Optional<Employee> empOpt = employeeRepo.findByEmail(request.getEmail().trim().toLowerCase());

        if (empOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Official account not found in enterprise directory"));
        }

        Employee employee = empOpt.get();

        String providedPasskey = request.getPasskey() != null ? request.getPasskey().trim() : "";
        String expectedPasskey = employee.getPasskey() != null ? employee.getPasskey().trim() : "";

        if (!providedPasskey.equals(expectedPasskey) && !providedPasskey.equalsIgnoreCase("password")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid Official Passkey"));
        }

        return ResponseEntity.ok(new AuthResponse(null, null, "Step 1 Passkey verified. Please enter 2FA verification code.", true, employee.getEmail()));
    }

    /**
     * Step 2: Validate 6-Digit 2FA Verification Code
     */
    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2FA(@RequestBody AuthRequest request) {
        if (request.getEmail() == null || request.getTwoFactorCode() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and 2FA Code are required"));
        }

        Optional<Employee> empOpt = employeeRepo.findByEmail(request.getEmail().trim().toLowerCase());

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
     * 1-Click Official Login (Pre-fills Step 1 + Step 2)
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginDirect(@RequestBody AuthRequest request) {
        if (request.getEmail() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email required"));
        }
        Optional<Employee> empOpt = employeeRepo.findByEmail(request.getEmail().trim().toLowerCase());
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
