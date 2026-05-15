package com.example.jochat.service;

import com.example.jochat.dto.ChatDto;
import com.example.jochat.dto.MessageDto;
import com.example.jochat.dto.UserDto;
import com.example.jochat.entity.Chat;
import com.example.jochat.entity.Message;
import com.example.jochat.entity.User;
import com.example.jochat.repository.ChatRepository;
import com.example.jochat.repository.MessageRepository;
import com.example.jochat.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.example.jochat.dto.MediaMessageDto;
import com.example.jochat.repository.MediaMessageRepository;

@Service
public class ChatService {

    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private MediaService mediaService;
    @Autowired
    private MediaMessageRepository mediaMessageRepository;

    // Получить или создать приватный чат
    @Transactional
    public ChatDto getOrCreatePrivateChat(String myEmail, Long otherUserId) {
        User me = userRepository.findByEmail(myEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User other = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Other user not found"));

        // Ищем существующий
        return chatRepository.findPrivateChat(me, other)
                .map(chat -> toChatDto(chat, me))
                .orElseGet(() -> {
                    // Создаём новый
                    Chat chat = new Chat();
                    chat.setType(Chat.ChatType.PRIVATE);
                    List<User> members = new ArrayList<>();
                    members.add(me);
                    members.add(other);
                    chat.setMembers(members);
                    chatRepository.save(chat);
                    return toChatDto(chat, me);
                });
    }

    // Все мои чаты
    public List<ChatDto> getMyChats(String email) {
        User me = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return chatRepository.findAllByMember(me)
                .stream()
                .map(chat -> toChatDto(chat, me))
                .collect(Collectors.toList());
    }

    // Сообщения чата
    public List<MessageDto> getChatMessages(String email, Long chatId) {
        User me = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        // Проверяем что пользователь в чате
        if (!chat.getMembers().contains(me)) {
            throw new RuntimeException("Access denied");
        }

        return messageRepository.findByChatOrderByCreatedAtAsc(chat)
                .stream()
                .map(this::toMessageDto)
                .collect(Collectors.toList());
    }

    // ── Converters ───────────────────────────────────────────────
    public ChatDto toChatDto(Chat chat, User me) {
        ChatDto dto = new ChatDto();
        dto.setId(chat.getId());
        dto.setType(chat.getType().name());
        dto.setCreatedAt(chat.getCreatedAt());

        // ← Добавь эти две строки:
        dto.setName(chat.getName());
        dto.setAvatarUrl(chat.getAvatarUrl());

        List<UserDto> members = chat.getMembers()
                .stream()
                .map(userService::toDto)
                .collect(Collectors.toList());
        dto.setMembers(members);

        if (chat.getLastMessage() != null) {
            dto.setLastMessage(toMessageDto(chat.getLastMessage()));
        }

        dto.setUnreadCount(
                messageRepository.countUnread(chat, me)
        );

        return dto;
    }

    public MessageDto toMessageDto(Message msg) {
        MessageDto dto = new MessageDto();
        dto.setId(msg.getId());
        dto.setChatId(msg.getChat().getId());
        dto.setSenderId(msg.getSender().getId());
        dto.setSenderName(msg.getSender().getFullName());
        dto.setSenderAvatar(msg.getSender().getAvatarUrl());
        dto.setContent(msg.isDeleted() ? "Сообщение удалено" : msg.getContent());
        dto.setStatus(msg.getStatus().name());
        dto.setEdited(msg.isEdited());
        dto.setDeleted(msg.isDeleted());
        dto.setCreatedAt(msg.getCreatedAt());
        dto.setReadAt(msg.getReadAt());

        // Подгружаем медиа если есть
        mediaMessageRepository.findByMessage(msg).ifPresent(media -> {
            dto.setMedia(mediaService.toMediaDto(media));
        });

        return dto;
    }
}
