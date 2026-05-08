package com.example.jochat.controller;

import com.example.jochat.dto.NotificationDto;
import com.example.jochat.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // GET /api/notifications
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            notificationService.getAll(userDetails.getUsername())
        );
    }

    // GET /api/notifications/unread-count
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(Map.of(
            "count", notificationService.getUnreadCount(userDetails.getUsername())
        ));
    }

    // PUT /api/notifications/{id}/read
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        notificationService.markAsRead(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    // PUT /api/notifications/read-all
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }
}