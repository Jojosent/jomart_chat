package com.example.jochat.controller;

import com.example.jochat.dto.*;
import com.example.jochat.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthService authService;

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(Map.of(
            "message", "OTP sent to " + request.getEmail(),
            "email", request.getEmail()
        ));
    }

    // POST /api/auth/verify-otp
    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    // POST /api/auth/resend-otp
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        authService.resendOtp(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "OTP resent successfully"));
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // POST /api/auth/refresh
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.refreshToken(body.get("refreshToken")));
    }

    // GET /api/auth/me  ← текущий пользователь
    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getUsername()));
    }
}