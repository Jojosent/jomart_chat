package com.example.jochat.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class UpdateProfileRequest {

    @Size(min = 2, max = 50, message = "Full name must be 2–50 characters")
    private String fullName;

    @Size(min = 3, max = 50, message = "Username must be 3–50 characters")
    private String username;

    @Size(max = 200, message = "Bio max 200 characters")
    private String bio;

    private String phone;
    private LocalDate birthDate;

    public UpdateProfileRequest() {}

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
}