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

@RestController
@RequestMapping("/api/admin")
public class AdminController {

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
}
