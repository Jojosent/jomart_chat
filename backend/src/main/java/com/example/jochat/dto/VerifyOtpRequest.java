package com.example.jochat.dto;

import jakarta.validation.constraints.NotBlank;

public class VerifyOtpRequest {

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "OTP is required")
    private String otp;

    public VerifyOtpRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
