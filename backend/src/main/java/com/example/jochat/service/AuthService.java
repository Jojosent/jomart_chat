package com.example.jochat.service;

import com.example.jochat.dto.*;
import com.example.jochat.entity.User;
import com.example.jochat.repository.UserRepository;
import com.example.jochat.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    // ── Регистрация ──────────────────────────────────────────────
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new RuntimeException("Email already registered");
        if (userRepository.existsByUsername(request.getUsername()))
            throw new RuntimeException("Username already taken");

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .emailVerified(false)
                .build();

        userRepository.save(user);

        String otp = otpService.generateAndSaveOtp(request.getEmail());
        emailService.sendOtpEmail(request.getEmail(), otp);
    }

    // ── Верификация OTP ──────────────────────────────────────────
    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp()))
            throw new RuntimeException("Invalid or expired OTP code");

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEmailVerified(true);
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    // ── Повторная отправка OTP ───────────────────────────────────
    public void resendOtp(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String otp = otpService.generateAndSaveOtp(email);
        emailService.sendOtpEmail(email, otp);
    }

    // ── Логин ────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        // Проверяем пароль через Spring Security
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isEmailVerified())
            throw new RuntimeException("Email not verified. Please verify your email first.");

        return buildAuthResponse(user);
    }

    // ── Refresh Token ────────────────────────────────────────────
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken))
            throw new RuntimeException("Invalid refresh token");

        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return buildAuthResponse(user);
    }

    // ── Текущий пользователь ─────────────────────────────────────
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDto(user);
    }

    // ── Helpers ──────────────────────────────────────────────────
    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .accessToken(jwtService.generateAccessToken(user))
                .refreshToken(jwtService.generateRefreshToken(user))
                .user(toDto(user))
                .build();
    }

    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .birthDate(user.getBirthDate())
                .phone(user.getPhone())
                .emailVerified(user.isEmailVerified())
                .phoneVerified(user.isPhoneVerified())
                .status(user.getStatus().name())
                .lastSeen(user.getLastSeen())
                .build();
    }
}