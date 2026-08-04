package com.cbg.travel.dto;

import com.cbg.travel.entity.Employee;

public class AuthResponse {
    private String token;
    private Employee employee;
    private String message;
    private boolean requires2FA;
    private String email;

    public AuthResponse() {}

    public AuthResponse(String token, Employee employee, String message, boolean requires2FA, String email) {
        this.token = token;
        this.employee = employee;
        this.message = message;
        this.requires2FA = requires2FA;
        this.email = email;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isRequires2FA() { return requires2FA; }
    public void setRequires2FA(boolean requires2FA) { this.requires2FA = requires2FA; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
