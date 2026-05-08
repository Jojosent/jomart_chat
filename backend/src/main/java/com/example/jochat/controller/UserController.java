package com.example.jochat.controller;

import com.example.jochat.dto.UpdateProfileRequest;
import com.example.jochat.dto.UserDto;
import com.example.jochat.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private UserService userService;

    // GET /api/users/me
    @GetMapping("/me")
    public ResponseEntity<UserDto> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            userService.getProfile(userDetails.getUsername())
        );
    }

    // PUT /api/users/me
    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(
            userService.updateProfile(userDetails.getUsername(), request)
        );
    }

    // POST /api/users/me/avatar
    @PostMapping("/me/avatar")
    public ResponseEntity<UserDto> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(
            userService.uploadAvatar(userDetails.getUsername(), file)
        );
    }

    // DELETE /api/users/me/avatar
    @DeleteMapping("/me/avatar")
    public ResponseEntity<UserDto> deleteAvatar(
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {
        return ResponseEntity.ok(
            userService.deleteAvatar(userDetails.getUsername())
        );
    }

    // GET /api/users/search?q=...
    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(
            @RequestParam("q") String query,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            userService.searchUsers(query, userDetails.getUsername())
        );
    }

    // GET /api/users/{username}
    @GetMapping("/{username}")
    public ResponseEntity<UserDto> getByUsername(
            @PathVariable String username) {
        return ResponseEntity.ok(
            userService.getProfileByUsername(username)
        );
    }

    // GET /api/users/id/{id}
    @GetMapping("/id/{id}")
    public ResponseEntity<UserDto> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
            userService.getProfileById(id)
        );
    }
}