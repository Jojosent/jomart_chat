package com.example.jochat.websocket;

import com.example.jochat.dto.MessageDto;
import com.example.jochat.dto.SendMessageRequest;
import com.example.jochat.entity.Chat;
import com.example.jochat.repository.ChatRepository;
import com.example.jochat.service.MessageService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import com.example.jochat.entity.User;
import com.example.jochat.repository.UserRepository;
import com.example.jochat.service.NotificationService;

@Controller
public class ChatWebSocketController {

    @Autowired
    private MessageService messageService;
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private UserRepository userRepository;

    // ── Отправить сообщение ──────────────────────────────────────
    @MessageMapping("/chat.send")
    public void sendMessage(SendMessageRequest request, Principal principal) {
        if (principal == null) {
            System.err.println("Principal is NULL — auth failed");
            return;
        }
        System.out.println("Message from: " + principal.getName());

        MessageDto msg = messageService.sendMessage(principal.getName(), request);

        Chat chat = chatRepository.findById(request.getChatId()).orElse(null);
        if (chat == null) {
            return;
        }

        // Отправляем всем участникам
        chat.getMembers().forEach(member -> {
            messagingTemplate.convertAndSendToUser(
                    member.getEmail(),
                    "/queue/messages",
                    msg
            );
        });

        // DELIVERED для онлайн получателей
        chat.getMembers().forEach(member -> {
            if (!member.getEmail().equals(principal.getName())) {
                List<MessageDto> delivered = messageService
                        .markAsDelivered(member.getEmail(), request.getChatId());
                delivered.forEach(d
                        -> messagingTemplate.convertAndSendToUser(
                                principal.getName(),
                                "/queue/delivered",
                                d
                        )
                );
            }
        });
    }

    // ── Прочитано ────────────────────────────────────────────────
    @MessageMapping("/chat.read")
    public void markRead(@Payload Map<String, Long> payload, Principal principal) {
        Long chatId = payload.get("chatId");

        List<MessageDto> readMessages = messageService
                .markAsRead(principal.getName(), chatId);

        if (readMessages.isEmpty()) {
            return;
        }

        Chat chat = chatRepository.findById(chatId).orElse(null);
        if (chat == null) {
            return;
        }

        // Уведомляем отправителей о прочтении
        chat.getMembers().forEach(member -> {
            if (!member.getEmail().equals(principal.getName())) {
                messagingTemplate.convertAndSendToUser(
                        member.getEmail(),
                        "/queue/read-status",
                        Map.of(
                                "chatId", chatId,
                                "readBy", principal.getName(),
                                "messageIds", readMessages.stream()
                                        .map(MessageDto::getId).toList()
                        )
                );
            }
        });
    }

    // ── Печатает... ──────────────────────────────────────────────
    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload, Principal principal) {
        Long chatId = ((Number) payload.get("chatId")).longValue();

        Chat chat = chatRepository.findById(chatId).orElse(null);
        if (chat == null) {
            return;
        }

        chat.getMembers().forEach(member -> {
            if (!member.getEmail().equals(principal.getName())) {
                messagingTemplate.convertAndSendToUser(
                        member.getEmail(),
                        "/queue/typing",
                        Map.of(
                                "chatId", chatId,
                                "username", principal.getName(),
                                "typing", payload.get("typing")
                        )
                );
            }
        });
    }
}
