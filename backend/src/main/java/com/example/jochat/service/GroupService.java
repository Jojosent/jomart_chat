package com.example.jochat.service;

import com.example.jochat.dto.CreateGroupRequest;
import com.example.jochat.dto.GroupDto;
import com.example.jochat.dto.UserDto;
import com.example.jochat.entity.Chat;
import com.example.jochat.entity.Group;
import com.example.jochat.entity.User;
import com.example.jochat.repository.ChatRepository;
import com.example.jochat.repository.GroupRepository;
import com.example.jochat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private NotificationService notificationService;

    @Value("${app.upload.path}")
    private String uploadPath;

    // ── Создать группу ───────────────────────────────────────────
    @Transactional
    public GroupDto createGroup(String adminEmail, CreateGroupRequest request) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Создаём чат для группы
        Chat chat = new Chat();
        chat.setType(Chat.ChatType.GROUP);
        chat.setName(request.getName());

        List<User> chatMembers = new ArrayList<>();
        chatMembers.add(admin);

        // Добавляем участников
        if (request.getMemberIds() != null) {
            for (Long memberId : request.getMemberIds()) {
                userRepository.findById(memberId).ifPresent(chatMembers::add);
            }
        }
        chat.setMembers(chatMembers);
        chatRepository.save(chat);

        // Создаём группу
        Group group = new Group();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setAdmin(admin);
        group.setMembers(chatMembers);
        group.setChat(chat);
        groupRepository.save(group);

        return toDto(group);
    }

    // ── Получить группу ──────────────────────────────────────────
    public GroupDto getGroup(Long groupId, String email) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!group.getMembers().contains(user)) {
            throw new RuntimeException("Access denied");
        }

        return toDto(group);
    }

    // ── Мои группы ───────────────────────────────────────────────
    public List<GroupDto> getMyGroups(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return groupRepository.findAllByMember(user)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── Обновить группу (только админ) ──────────────────────────
    @Transactional
    public GroupDto updateGroup(Long groupId, String adminEmail,
            String name, String description) {
        Group group = findGroupAndCheckAdmin(groupId, adminEmail);

        if (name != null && !name.isBlank()) {
            group.setName(name);
            group.getChat().setName(name);
            chatRepository.save(group.getChat());
        }
        if (description != null) {
            group.setDescription(description);
        }

        groupRepository.save(group);
        return toDto(group);
    }

    // ── Загрузить аватар группы ──────────────────────────────────
    @Transactional
    public GroupDto uploadAvatar(Long groupId, String adminEmail,
            MultipartFile file) throws IOException {
        Group group = findGroupAndCheckAdmin(groupId, adminEmail);

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        Path uploadDir = Paths.get(uploadPath, "group-avatars");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        // Удаляем старый аватар
        if (group.getAvatarUrl() != null) {
            try {
                Path old = Paths.get(uploadPath,
                        group.getAvatarUrl().replace("/uploads/", ""));
                Files.deleteIfExists(old);
            } catch (Exception ignored) {
            }
        }

        String ext = getExt(file.getOriginalFilename());
        String filename = UUID.randomUUID() + "." + ext;
        Files.copy(file.getInputStream(),
                uploadDir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

        String avatarUrl = "/uploads/group-avatars/" + filename;
        group.setAvatarUrl(avatarUrl);
        group.getChat().setAvatarUrl(avatarUrl);
        chatRepository.save(group.getChat());
        groupRepository.save(group);

        return toDto(group);
    }

    // ── Добавить участника ───────────────────────────────────────
    @Transactional
    public GroupDto addMember(Long groupId, String adminEmail, Long userId) {
        Group group = findGroupAndCheckAdmin(groupId, adminEmail);
        User newMember = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (group.getMembers().contains(newMember)) {
            throw new RuntimeException("User is already a member");
        }

        group.getMembers().add(newMember);
        group.getChat().getMembers().add(newMember);
        chatRepository.save(group.getChat());
        groupRepository.save(group);
        notificationService.notifyGroupInvite(
                userRepository.findByEmail(adminEmail).get(),
                newMember,
                group.getId(),
                group.getName()
        );

        return toDto(group);
    }

    // ── Удалить участника ────────────────────────────────────────
    @Transactional
    public GroupDto removeMember(Long groupId, String adminEmail, Long userId) {
        Group group = findGroupAndCheckAdmin(groupId, adminEmail);
        User member = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (member.getId().equals(group.getAdmin().getId())) {
            throw new RuntimeException("Cannot remove admin from group");
        }

        group.getMembers().remove(member);
        group.getChat().getMembers().remove(member);
        chatRepository.save(group.getChat());
        groupRepository.save(group);
        notificationService.notifyGroupRemoved(
                userRepository.findByEmail(adminEmail).get(),
                member,
                group.getId(),
                group.getName()
        );

        return toDto(group);
    }

    // ── Передать права админа ────────────────────────────────────
    @Transactional
    public GroupDto transferAdmin(Long groupId, String currentAdminEmail, Long newAdminId) {
        Group group = findGroupAndCheckAdmin(groupId, currentAdminEmail);
        User newAdmin = userRepository.findById(newAdminId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!group.getMembers().contains(newAdmin)) {
            throw new RuntimeException("New admin must be a group member");
        }

        group.setAdmin(newAdmin);
        groupRepository.save(group);
        notificationService.notifyAdminTransferred(
                userRepository.findByEmail(currentAdminEmail).get(),
                newAdmin,
                group.getId(),
                group.getName()
        );
        return toDto(group);
    }

    // ── Выйти из группы ─────────────────────────────────────────
    @Transactional
    public void leaveGroup(Long groupId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (group.getAdmin().getId().equals(user.getId())) {
            throw new RuntimeException("Admin cannot leave. Transfer admin rights first.");
        }

        group.getMembers().remove(user);
        group.getChat().getMembers().remove(user);
        chatRepository.save(group.getChat());
        groupRepository.save(group);
    }

    // ── Удалить группу (только админ) ───────────────────────────
    @Transactional
    public void deleteGroup(Long groupId, String adminEmail) {
        Group group = findGroupAndCheckAdmin(groupId, adminEmail);
        Chat chat = group.getChat();
        groupRepository.delete(group);
        chatRepository.delete(chat);
    }

    // ── Helpers ──────────────────────────────────────────────────
    private Group findGroupAndCheckAdmin(Long groupId, String email) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!group.getAdmin().getId().equals(user.getId())) {
            throw new RuntimeException("Only admin can perform this action");
        }
        return group;
    }

    private String getExt(String filename) {
        if (filename == null) {
            return "jpg";
        }
        int i = filename.lastIndexOf('.');
        return i >= 0 ? filename.substring(i + 1).toLowerCase() : "jpg";
    }

    public GroupDto toDto(Group group) {
        GroupDto dto = new GroupDto();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setAvatarUrl(group.getAvatarUrl());
        dto.setAdmin(userService.toDto(group.getAdmin()));
        dto.setMembers(group.getMembers().stream()
                .map(userService::toDto).collect(Collectors.toList()));
        dto.setMemberCount(group.getMembers().size());
        if (group.getChat() != null) {
            dto.setChatId(group.getChat().getId());
        }
        dto.setCreatedAt(group.getCreatedAt());
        return dto;
    }
}
