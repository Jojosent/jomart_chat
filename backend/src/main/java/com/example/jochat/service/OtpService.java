package com.example.jochat.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
public class OtpService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Value("${app.otp.expiration}")
    private long otpExpiration;

    private static final String OTP_PREFIX = "otp:";
    private static final SecureRandom random = new SecureRandom();

    public String generateAndSaveOtp(String email) {
        String otp = String.format("%06d", random.nextInt(999999));
        String key = OTP_PREFIX + email;
        redisTemplate.opsForValue().set(key, otp, Duration.ofSeconds(otpExpiration));
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        String key = OTP_PREFIX + email;
        String savedOtp = redisTemplate.opsForValue().get(key);
        if (savedOtp != null && savedOtp.equals(otp)) {
            redisTemplate.delete(key);
            return true;
        }
        return false;
    }

    public boolean hasOtp(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(OTP_PREFIX + email));
    }

}