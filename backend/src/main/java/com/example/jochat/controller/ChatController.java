package com.example.jochat.controller;

import com.example.jochat.dto.ChatDto;
import com.example.jochat.dto.MessageDto;
import com.example.jochat.service.ChatService;
import com.example.jochat.service.MessageService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.example.jochat.service.ProfanityFilterService;

@RestController
@RequestMapping("/api/chats")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {

    @Autowired
    private ChatService chatService;
    @Autowired
    private ProfanityFilterService profanityFilterService;
    @Autowired
    private MessageService messageService;

    // GET /api/chats — все мои чаты
    @GetMapping
    public ResponseEntity<List<ChatDto>> getMyChats(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.getMyChats(userDetails.getUsername()));
    }

    // POST /api/chats/private/{userId} — создать/получить приватный чат
    @PostMapping("/private/{userId}")
    public ResponseEntity<ChatDto> getOrCreatePrivate(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                chatService.getOrCreatePrivateChat(userDetails.getUsername(), userId)
        );
    }

    // GET /api/chats/{chatId}/messages — история сообщений
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<MessageDto>> getMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId) {
        return ResponseEntity.ok(
                chatService.getChatMessages(userDetails.getUsername(), chatId)
        );
    }

    // DELETE /api/chats/messages/{messageId} — удалить сообщение
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<MessageDto> deleteMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId) {
        return ResponseEntity.ok(
                messageService.deleteMessage(userDetails.getUsername(), messageId)
        );
    }

    // POST /api/chats/check-profanity
    @PostMapping("/check-profanity")
    public ResponseEntity<?> checkProfanity(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        String filtered = profanityFilterService.filter(text);
        boolean hasProfanity = profanityFilterService.containsProfanity(text);
        return ResponseEntity.ok(Map.of(
                "original", text,
                "filtered", filtered,
                "hasProfanity", hasProfanity
        ));
    }
    
}
