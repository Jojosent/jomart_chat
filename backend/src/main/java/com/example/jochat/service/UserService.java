package com.example.jochat.service;

import com.example.jochat.dto.UpdateProfileRequest;
import com.example.jochat.dto.UserDto;
import com.example.jochat.entity.User;
import com.example.jochat.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Value("${app.upload.path}")
    private String uploadPath;

    // ── Получить профиль ─────────────────────────────────────────
    public UserDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDto(user);
    }

    // ── Получить профиль по username ─────────────────────────────
    public UserDto getProfileByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDto(user);
    }

    // ── Получить профиль по ID ───────────────────────────────────
    public UserDto getProfileById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toDto(user);
    }

    // ── Обновить профиль ─────────────────────────────────────────
    @Transactional
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Проверяем уникальность username
        if (request.getUsername() != null
                && !request.getUsername().equals(user.getUsername())
                && userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        // Проверяем уникальность phone
        if (request.getPhone() != null
                && !request.getPhone().equals(user.getPhone())
                && userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone already in use");
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }

        userRepository.save(user);
        return toDto(user);
    }

    // ── Загрузить аватар ─────────────────────────────────────────
    @Transactional
    public UserDto uploadAvatar(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Проверка типа файла
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        // Создаём папку если нет
        Path uploadDir = Paths.get(uploadPath, "avatars");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        // Удаляем старый аватар
        if (user.getAvatarUrl() != null) {
            try {
                Path oldFile = Paths.get(uploadPath,
                        user.getAvatarUrl().replace("/uploads/", ""));
                Files.deleteIfExists(oldFile);
            } catch (Exception ignored) {
            }
        }

        // Сохраняем новый файл
        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + "." + ext;
        Path filePath = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String avatarUrl = "/uploads/avatars/" + filename;
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        return toDto(user);
    }

    // ── Удалить аватар ───────────────────────────────────────────
    @Transactional
    public UserDto deleteAvatar(String email) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getAvatarUrl() != null) {
            try {
                Path filePath = Paths.get(uploadPath,
                        user.getAvatarUrl().replace("/uploads/", ""));
                Files.deleteIfExists(filePath);
            } catch (Exception ignored) {
            }
            user.setAvatarUrl(null);
            userRepository.save(user);
        }

        return toDto(user);
    }

    // ── Helper ───────────────────────────────────────────────────
    private String getExtension(String filename) {
        if (filename == null) {
            return "jpg";
        }
        int idx = filename.lastIndexOf('.');
        return idx >= 0 ? filename.substring(idx + 1).toLowerCase() : "jpg";
    }

    public UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setUsername(user.getUsername());
        dto.setFullName(user.getFullName());
        dto.setBio(user.getBio());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setBirthDate(user.getBirthDate());
        dto.setPhone(user.getPhone());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setPhoneVerified(user.isPhoneVerified());
        dto.setStatus(user.getStatus().name());
        dto.setLastSeen(user.getLastSeen());
        return dto;
    }

    // Поиск пользователей по имени или username
    public List<UserDto> searchUsers(String query, String excludeEmail) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }
        return userRepository.searchUsers(query.trim(), excludeEmail)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

}
