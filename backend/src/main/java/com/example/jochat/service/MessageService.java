package com.example.jochat.service;

import com.example.jochat.dto.MessageDto;
import com.example.jochat.dto.SendMessageRequest;
import com.example.jochat.entity.Chat;
import com.example.jochat.entity.Message;
import com.example.jochat.entity.User;
import com.example.jochat.repository.ChatRepository;
import com.example.jochat.repository.MessageRepository;
import com.example.jochat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {

    @Autowired private MessageRepository messageRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatService chatService;
    @Autowired private ProfanityFilterService profanityFilterService;

    // ── Отправить сообщение (SENT) ───────────────────────────────
    @Transactional
    public MessageDto sendMessage(String senderEmail, SendMessageRequest request) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Chat chat = chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        if (!chat.getMembers().contains(sender))
            throw new RuntimeException("Access denied");

        String filtered = profanityFilterService.filter(request.getContent());

        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(filtered);
        message.setStatus(Message.MessageStatus.SENT);
        messageRepository.save(message);

        chat.setLastMessage(message);
        chatRepository.save(chat);

        return chatService.toMessageDto(message);
    }

    // ── Пометить DELIVERED (получатель онлайн) ───────────────────
    @Transactional
    public List<MessageDto> markAsDelivered(String receiverEmail, Long chatId) {
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        // Все SENT сообщения НЕ от получателя → DELIVERED
        List<Message> sentMessages = messageRepository
                .findByChatAndStatusAndSenderNot(chat, Message.MessageStatus.SENT, receiver);

        for (Message msg : sentMessages) {
            msg.setStatus(Message.MessageStatus.DELIVERED);
        }
        messageRepository.saveAll(sentMessages);

        return sentMessages.stream()
                .map(chatService::toMessageDto)
                .toList();
    }

    // ── Пометить READ (получатель открыл чат) ────────────────────
    @Transactional
    public List<MessageDto> markAsRead(String readerEmail, Long chatId) {
        User reader = userRepository.findByEmail(readerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        // Все SENT и DELIVERED сообщения НЕ от читателя → READ
        List<Message> unread = messageRepository
                .findUnreadMessages(chat, reader);

        for (Message msg : unread) {
            msg.setStatus(Message.MessageStatus.READ);
            msg.setReadAt(LocalDateTime.now());
        }
        messageRepository.saveAll(unread);

        return unread.stream()
                .map(chatService::toMessageDto)
                .toList();
    }

    // ── Удалить сообщение ────────────────────────────────────────
    @Transactional
    public MessageDto deleteMessage(String email, Long messageId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!msg.getSender().getId().equals(user.getId()))
            throw new RuntimeException("You can only delete your own messages");

        msg.setDeleted(true);
        msg.setContent("Сообщение удалено");
        messageRepository.save(msg);

        return chatService.toMessageDto(msg);
    }
}