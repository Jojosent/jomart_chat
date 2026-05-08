package com.example.jochat.controller;

import com.example.jochat.dto.AiMessageDto;
import com.example.jochat.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AiController {

    @Autowired
    private GeminiService geminiService;

    // POST /api/ai/chat
    @PostMapping("/chat")
    public ResponseEntity<?> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        try {
            String message = body.get("message");
            if (message == null || message.isBlank())
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Message is required"));

            AiMessageDto response = geminiService.chat(
                userDetails.getUsername(), message
            );
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("message", e.getMessage()));
        }
    }

    // GET /api/ai/history
    @GetMapping("/history")
    public ResponseEntity<List<AiMessageDto>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            geminiService.getHistory(userDetails.getUsername())
        );
    }

    // DELETE /api/ai/history
    @DeleteMapping("/history")
    public ResponseEntity<?> clearHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        geminiService.clearHistory(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "History cleared"));
    }
}