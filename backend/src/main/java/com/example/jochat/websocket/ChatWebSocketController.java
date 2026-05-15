// backend/src/main/java/com/example/jochat/websocket/ChatWebSocketController.java
package com.example.jochat.websocket;

import com.example.jochat.dto.MessageDto;
import com.example.jochat.dto.SendMessageRequest;
import com.example.jochat.entity.Chat;
import com.example.jochat.repository.ChatRepository;
import com.example.jochat.service.MessageService;
import com.example.jochat.service.ChatService;
import com.example.jochat.repository.MessageRepository;

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

@Controller
public class ChatWebSocketController {

    @Autowired private MessageService        messageService;
    @Autowired private ChatService           chatService;
    @Autowired private ChatRepository        chatRepository;
    @Autowired private MessageRepository     messageRepository;
    @Autowired private UserRepository        userRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    // ── Отправить текстовое сообщение ────────────────────────────
    @MessageMapping("/chat.send")
    public void sendMessage(SendMessageRequest request, Principal principal) {
        if (principal == null) return;

        MessageDto msg = messageService.sendMessage(principal.getName(), request);
        broadcastToChat(msg.getChatId(), msg, principal.getName());
        markDeliveredToOnlineMembers(request.getChatId(), principal.getName());
    }

    // ── Широковещание медиа-сообщения (вызывается из MediaService) ─
    // MediaController после upload вызывает этот метод через
    // отдельный REST endpoint — /api/media/broadcast
    // Или фронт сам добавляет в список, а WS только уведомляет других.
    // Здесь реализуем endpoint для уведомления других участников.
    @MessageMapping("/chat.media")
    public void broadcastMedia(@Payload Map<String, Object> payload,
                                Principal principal) {
        if (principal == null) return;

        Long chatId = ((Number) payload.get("chatId")).longValue();
        Long messageId = ((Number) payload.get("messageId")).longValue();

        messageRepository.findById(messageId).ifPresent(msg -> {
            MessageDto dto = chatService.toMessageDto(msg);
            // Отправляем всем участникам кроме отправителя
            Chat chat = msg.getChat();
            chat.getMembers().forEach(member -> {
                if (!member.getEmail().equals(principal.getName())) {
                    messagingTemplate.convertAndSendToUser(
                        member.getEmail(),
                        "/queue/messages",
                        dto
                    );
                }
            });
        });
    }

    // ── Прочитано ────────────────────────────────────────────────
    @MessageMapping("/chat.read")
    public void markRead(@Payload Map<String, Long> payload, Principal principal) {
        Long chatId = payload.get("chatId");
        List<MessageDto> readMessages =
                messageService.markAsRead(principal.getName(), chatId);

        if (readMessages.isEmpty()) return;

        Chat chat = chatRepository.findById(chatId).orElse(null);
        if (chat == null) return;

        chat.getMembers().forEach(member -> {
            if (!member.getEmail().equals(principal.getName())) {
                messagingTemplate.convertAndSendToUser(
                    member.getEmail(),
                    "/queue/read-status",
                    Map.of(
                        "chatId",     chatId,
                        "readBy",     principal.getName(),
                        "messageIds", readMessages.stream()
                                        .map(MessageDto::getId).toList()
                    )
                );
            }
        });
    }

    // ── Typing indicator ─────────────────────────────────────────
    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload, Principal principal) {
        Long chatId = ((Number) payload.get("chatId")).longValue();

        Chat chat = chatRepository.findById(chatId).orElse(null);
        if (chat == null) return;

        chat.getMembers().forEach(member -> {
            if (!member.getEmail().equals(principal.getName())) {
                messagingTemplate.convertAndSendToUser(
                    member.getEmail(),
                    "/queue/typing",
                    Map.of(
                        "chatId",   chatId,
                        "username", principal.getName(),
                        "typing",   payload.get("typing")
                    )
                );
            }
        });
    }

    // ── Helpers ──────────────────────────────────────────────────
    private void broadcastToChat(Long chatId, MessageDto msg, String senderEmail) {
        Chat chat = chatRepository.findById(chatId).orElse(null);
        if (chat == null) return;
        chat.getMembers().forEach(member ->
            messagingTemplate.convertAndSendToUser(
                member.getEmail(),
                "/queue/messages",
                msg
            )
        );
    }

    private void markDeliveredToOnlineMembers(Long chatId, String senderEmail) {
        Chat chat = chatRepository.findById(chatId).orElse(null);
        if (chat == null) return;
        chat.getMembers().forEach(member -> {
            if (!member.getEmail().equals(senderEmail)) {
                List<MessageDto> delivered =
                        messageService.markAsDelivered(member.getEmail(), chatId);
                delivered.forEach(d ->
                    messagingTemplate.convertAndSendToUser(
                        senderEmail,
                        "/queue/delivered",
                        d
                    )
                );
            }
        });
    }
}