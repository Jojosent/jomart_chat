package com.example.jochat.controller;

import com.example.jochat.dto.GroupDto;
import com.example.jochat.dto.UserDto;
import com.example.jochat.entity.User;
import com.example.jochat.repository.GroupRepository;
import com.example.jochat.repository.UserRepository;
import com.example.jochat.service.ChatService;
import com.example.jochat.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.example.jochat.dto.ChatDto;
import com.example.jochat.dto.MessageDto;
import com.example.jochat.entity.Chat;
import com.example.jochat.entity.Message;
import com.example.jochat.repository.ChatRepository;
import com.example.jochat.repository.MessageRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatService chatService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(userService::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String roleStr = body.get("role");
        user.setRole(User.UserRole.valueOf(roleStr.toUpperCase()));
        userRepository.save(user);
        return ResponseEntity.ok(userService.toDto(user));
    }

    @GetMapping("/groups")
    public ResponseEntity<List<GroupDto>> getAllGroups() {
        return ResponseEntity.ok(groupRepository.findAll().stream()
                .map(g -> {
                    GroupDto dto = new GroupDto();
                    dto.setId(g.getId());
                    dto.setName(g.getName());
                    dto.setDescription(g.getDescription());
                    dto.setAvatarUrl(g.getAvatarUrl());
                    dto.setCreatedAt(g.getCreatedAt());
                    if (g.getAdmin() != null) {
                        dto.setAdmin(userService.toDto(g.getAdmin()));
                    }
                    dto.setMemberCount(g.getMembers().size());
                    return dto;
                })
                .collect(Collectors.toList()));
    }

    @DeleteMapping("/groups/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
        groupRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
    }

    @GetMapping("/chats")
    public ResponseEntity<List<ChatDto>> getAllChats() {
        List<Chat> chats = chatRepository.findAll();
        User dummyUser = null; // Для подсчёта без фильтра

        List<ChatDto> result = chats.stream().map(chat -> {
            ChatDto dto = new ChatDto();
            dto.setId(chat.getId());
            dto.setType(chat.getType().name());
            dto.setName(chat.getName());
            dto.setAvatarUrl(chat.getAvatarUrl());
            dto.setCreatedAt(chat.getCreatedAt());

            List<UserDto> members = chat.getMembers()
                    .stream()
                    .map(userService::toDto)
                    .collect(Collectors.toList());
            dto.setMembers(members);

            if (chat.getLastMessage() != null) {
                dto.setLastMessage(chatService.toMessageDto(chat.getLastMessage()));
            }

            // Считаем кол-во сообщений
            long msgCount = messageRepository.countByChat(chat);
            // Добавь поле messageCount в ChatDto (или используй unreadCount временно)
            // dto.setMessageCount((int) msgCount);

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

// ─── GET /api/admin/chats/{id}/messages ─────────────────────
    @GetMapping("/chats/{id}/messages")
    public ResponseEntity<List<MessageDto>> getChatMessages(@PathVariable Long id) {
        Chat chat = chatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        List<MessageDto> messages = messageRepository
                .findByChatOrderByCreatedAtAsc(chat)
                .stream()
                .map(chatService::toMessageDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(messages);
    }

// ─── DELETE /api/admin/messages/{id} ─────────────────────────
    @DeleteMapping("/messages/{id}")
    public ResponseEntity<?> adminDeleteMessage(@PathVariable Long id) {
        Message msg = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        msg.setDeleted(true);
        msg.setContent("Message deleted by admin");
        messageRepository.save(msg);
        return ResponseEntity.ok(Map.of("message", "Message deleted"));
    }
}
