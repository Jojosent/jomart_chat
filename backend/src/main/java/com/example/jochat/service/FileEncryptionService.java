// backend/src/main/java/com/example/jochat/service/FileEncryptionService.java
package com.example.jochat.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.HexFormat;

@Service
public class FileEncryptionService {

    // AES-256-GCM
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG = 128;   // bits
    private static final int IV_LENGTH = 12;    // bytes (96 bits — рекомендовано для GCM)
    private static final int KEY_LENGTH = 32;    // bytes (256-bit AES)

    @Value("${app.media.encryption-key}")
    private String encryptionKeyHex;   // 64 hex-символа = 32 байта

    // ── Зашифровать байты файла ──────────────────────────────────
    public EncryptionResult encrypt(byte[] plainBytes) throws Exception {
        byte[] iv = new byte[IV_LENGTH];
        new SecureRandom().nextBytes(iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, buildKey(), new GCMParameterSpec(GCM_TAG, iv));
        byte[] cipherBytes = cipher.doFinal(plainBytes);

        String ivHex = HexFormat.of().formatHex(iv);
        return new EncryptionResult(cipherBytes, ivHex);
    }

    // ── Расшифровать байты файла ─────────────────────────────────
    public byte[] decrypt(byte[] cipherBytes, String ivHex) throws Exception {
        byte[] iv = HexFormat.of().parseHex(ivHex);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, buildKey(), new GCMParameterSpec(GCM_TAG, iv));
        return cipher.doFinal(cipherBytes);
    }

    private SecretKey buildKey() {
        byte[] keyBytes = HexFormat.of().parseHex(encryptionKeyHex);
        return new SecretKeySpec(keyBytes, "AES");
    }

    // ── Result DTO ───────────────────────────────────────────────
    public static class EncryptionResult {

        public final byte[] cipherBytes;
        public final String ivHex;

        public EncryptionResult(byte[] cipherBytes, String ivHex) {
            this.cipherBytes = cipherBytes;
            this.ivHex = ivHex;
        }
    }
}
