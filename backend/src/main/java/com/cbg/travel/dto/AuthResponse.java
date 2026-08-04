package com.cbg.travel.dto;

import com.cbg.travel.entity.Employee;

public class AuthResponse {
    private String token;
    private Employee employee;
    private String message;

    public AuthResponse() {}

    public AuthResponse(String token, Employee employee, String message) {
        this.token = token;
        this.employee = employee;
        this.message = message;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
