package com.example.jochat.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class UserDto {

    private Long id;
    private String email;
    private String username;
    private String fullName;
    private String bio;
    private String avatarUrl;
    private LocalDate birthDate;
    private String phone;
    private boolean emailVerified;
    private boolean phoneVerified;
    private String status;
    private LocalDateTime lastSeen;

    public UserDto() {
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {

        private Long id;
        private String email;
        private String username;
        private String fullName;
        private String bio;
        private String avatarUrl;
        private LocalDate birthDate;
        private String phone;
        private boolean emailVerified;
        private boolean phoneVerified;
        private String status;
        private LocalDateTime lastSeen;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public Builder bio(String bio) {
            this.bio = bio;
            return this;
        }

        public Builder avatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
            return this;
        }

        public Builder birthDate(LocalDate birthDate) {
            this.birthDate = birthDate;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder emailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
            return this;
        }

        public Builder phoneVerified(boolean phoneVerified) {
            this.phoneVerified = phoneVerified;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder lastSeen(LocalDateTime lastSeen) {
            this.lastSeen = lastSeen;
            return this;
        }

        public UserDto build() {
            UserDto dto = new UserDto();
            dto.id = this.id;
            dto.email = this.email;
            dto.username = this.username;
            dto.fullName = this.fullName;
            dto.bio = this.bio;
            dto.avatarUrl = this.avatarUrl;
            dto.birthDate = this.birthDate;
            dto.phone = this.phone;
            dto.emailVerified = this.emailVerified;
            dto.phoneVerified = this.phoneVerified;
            dto.status = this.status;
            dto.lastSeen = this.lastSeen;
            return dto;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public boolean isPhoneVerified() {
        return phoneVerified;
    }

    public void setPhoneVerified(boolean phoneVerified) {
        this.phoneVerified = phoneVerified;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(LocalDateTime lastSeen) {
        this.lastSeen = lastSeen;
    }
}
