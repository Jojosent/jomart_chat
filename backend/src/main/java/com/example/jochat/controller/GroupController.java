package com.example.jochat.controller;

import com.example.jochat.dto.CreateGroupRequest;
import com.example.jochat.dto.GroupDto;
import com.example.jochat.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "http://localhost:3000")
public class GroupController {

    @Autowired
    private GroupService groupService;

    // POST /api/groups — создать группу
    @PostMapping
    public ResponseEntity<GroupDto> createGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateGroupRequest request) {
        return ResponseEntity.ok(
                groupService.createGroup(userDetails.getUsername(), request)
        );
    }

    // GET /api/groups — мои группы
    @GetMapping
    public ResponseEntity<List<GroupDto>> getMyGroups(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                groupService.getMyGroups(userDetails.getUsername())
        );
    }

    // GET /api/groups/{id} — инфо о группе
    @GetMapping("/{id}")
    public ResponseEntity<GroupDto> getGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(
                groupService.getGroup(id, userDetails.getUsername())
        );
    }

    // PUT /api/groups/{id} — обновить группу
    @PutMapping("/{id}")
    public ResponseEntity<GroupDto> updateGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                groupService.updateGroup(
                        id,
                        userDetails.getUsername(),
                        body.get("name"),
                        body.get("description")
                )
        );
    }

    // POST /api/groups/{id}/avatar — аватар группы
    @PostMapping("/{id}/avatar")
    public ResponseEntity<GroupDto> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(
                groupService.uploadAvatar(id, userDetails.getUsername(), file)
        );
    }

    // POST /api/groups/{id}/members/{userId} — добавить участника
    @PostMapping("/{id}/members/{userId}")
    public ResponseEntity<GroupDto> addMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                groupService.addMember(id, userDetails.getUsername(), userId)
        );
    }

    // DELETE /api/groups/{id}/members/{userId} — удалить участника
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<GroupDto> removeMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                groupService.removeMember(id, userDetails.getUsername(), userId)
        );
    }

    // PUT /api/groups/{id}/admin/{userId} — передать права
    @PutMapping("/{id}/admin/{userId}")
    public ResponseEntity<GroupDto> transferAdmin(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                groupService.transferAdmin(id, userDetails.getUsername(), userId)
        );
    }

    // DELETE /api/groups/{id}/leave — выйти
    @DeleteMapping("/{id}/leave")
    public ResponseEntity<?> leaveGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        groupService.leaveGroup(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Left group successfully"));
    }

    // DELETE /api/groups/{id} — удалить группу
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        groupService.deleteGroup(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Group deleted"));
    }

    // POST /api/groups/{id}/accept-invite — принять приглашение
    @PostMapping("/{id}/accept-invite")
    public ResponseEntity<GroupDto> acceptInvite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(
                groupService.acceptInvite(id, userDetails.getUsername())
        );
    }

    // POST /api/groups/{id}/decline-invite — отклонить приглашение
    @PostMapping("/{id}/decline-invite")
    public ResponseEntity<?> declineInvite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        groupService.declineInvite(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Invite declined"));
    }
}
