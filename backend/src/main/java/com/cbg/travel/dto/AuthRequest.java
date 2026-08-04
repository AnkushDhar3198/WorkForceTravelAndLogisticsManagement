package com.cbg.travel.dto;

public class AuthRequest {
    private String email;
    private String passkey;
    private String twoFactorCode;

    public AuthRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasskey() { return passkey; }
    public void setPasskey(String passkey) { this.passkey = passkey; }

    public String getTwoFactorCode() { return twoFactorCode; }
    public void setTwoFactorCode(String twoFactorCode) { this.twoFactorCode = twoFactorCode; }
}
