package com.example.jochat.dto;

public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private UserDto user;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, String refreshToken, UserDto user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
    }

    // Builder вручную
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {

        private String accessToken;
        private String refreshToken;
        private UserDto user;

        public Builder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        public Builder refreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
            return this;
        }

        public Builder user(UserDto user) {
            this.user = user;
            return this;
        }

        public AuthResponse build() {
            return new AuthResponse(accessToken, refreshToken, user);
        }
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public UserDto getUser() {
        return user;
    }

    public void setUser(UserDto user) {
        this.user = user;
    }
}
