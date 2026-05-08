package com.example.jochat.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String phone;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String fullName;
    private String bio;
    private String avatarUrl;
    private LocalDate birthDate;

    @Column(nullable = false)
    private boolean emailVerified = false;

    private boolean phoneVerified = false;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.OFFLINE;

    private LocalDateTime lastSeen;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public User() {
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {

        private String email;
        private String phone;
        private String username;
        private String password;
        private String fullName;
        private String bio;
        private String avatarUrl;
        private LocalDate birthDate;
        private boolean emailVerified = false;
        private boolean phoneVerified = false;
        private UserRole role = UserRole.USER;
        private UserStatus status = UserStatus.OFFLINE;

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder username(String username) {
            this.username = username;
            return this;
        }

        public Builder password(String password) {
            this.password = password;
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

        public Builder emailVerified(boolean emailVerified) {
            this.emailVerified = emailVerified;
            return this;
        }

        public Builder phoneVerified(boolean phoneVerified) {
            this.phoneVerified = phoneVerified;
            return this;
        }

        public Builder role(UserRole role) {
            this.role = role;
            return this;
        }

        public Builder status(UserStatus status) {
            this.status = status;
            return this;
        }

        public User build() {
            User u = new User();
            u.email = this.email;
            u.phone = this.phone;
            u.username = this.username;
            u.password = this.password;
            u.fullName = this.fullName;
            u.bio = this.bio;
            u.avatarUrl = this.avatarUrl;
            u.birthDate = this.birthDate;
            u.emailVerified = this.emailVerified;
            u.phoneVerified = this.phoneVerified;
            u.role = this.role;
            u.status = this.status;
            return u;
        }
    }

    // Getters & Setters
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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public LocalDateTime getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(LocalDateTime lastSeen) {
        this.lastSeen = lastSeen;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public enum UserRole {
        USER, ADMIN
    }

    public enum UserStatus {
        ONLINE, OFFLINE
    }
}
