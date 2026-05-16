// backend/src/main/java/com/example/jochat/service/MediaService.java
package com.example.jochat.service;

import com.example.jochat.dto.MediaMessageDto;
import com.example.jochat.dto.MessageDto;
import com.example.jochat.entity.*;
import com.example.jochat.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.UUID;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
public class MediaService {

    @Autowired
    private MediaMessageRepository mediaMessageRepository;
    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FileEncryptionService encryptionService;
    @Autowired @Lazy
    private ChatService chatService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Value("${app.upload.path}")
    private String uploadPath;

    // ── Загрузить медиа и создать сообщение ─────────────────────
    @Transactional
    public MessageDto uploadMedia(String senderEmail,
            Long chatId,
            MultipartFile file,
            String mediaType) throws Exception {

        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        boolean isMember = chat.getMembers().stream()
                .anyMatch(m -> m.getId().equals(sender.getId()));
        if (!isMember) {
            throw new RuntimeException("Access denied");
        }

        validateFile(file, mediaType);

        // 1. Шифруем
        byte[] plainBytes = file.getBytes();
        FileEncryptionService.EncryptionResult encrypted
                = encryptionService.encrypt(plainBytes);

        // 2. Сохраняем .enc файл
        Path mediaDir = Paths.get(uploadPath, "media");
        if (!Files.exists(mediaDir)) {
            Files.createDirectories(mediaDir);
        }

        String storedName = UUID.randomUUID() + ".enc";
        Files.write(mediaDir.resolve(storedName), encrypted.cipherBytes);

        // 3. Создаём Message
        Message message = new Message();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent("[MEDIA]");
        message.setStatus(Message.MessageStatus.SENT);
        messageRepository.save(message);

        chat.setLastMessage(message);
        chatRepository.save(chat);

        // 4. Сохраняем MediaMessage
        MediaMessage media = new MediaMessage();
        media.setMessage(message);
        media.setFileName(file.getOriginalFilename());
        media.setStoredName(storedName);
        media.setMediaType(mediaType.toUpperCase());
        media.setMimeType(file.getContentType());
        media.setFileSize(file.getSize());
        media.setIvHex(encrypted.ivHex);
        mediaMessageRepository.save(media);

        // 5. Формируем DTO
        MessageDto dto = chatService.toMessageDto(message);

        // 6. WebSocket — рассылаем всем участникам
        chat.getMembers().forEach(member -> {
            try {
                messagingTemplate.convertAndSendToUser(
                        member.getEmail(),
                        "/queue/messages",
                        dto
                );
            } catch (Exception e) {
                System.err.println("Failed to send WS message to " + member.getEmail() + ": " + e.getMessage());
            }
        });

        return dto;
    }

    // ── Получить расшифрованные байты по storedName ──────────────
    public DecryptedFile getDecryptedFile(String storedName, String requestorEmail) throws Exception {
        // Проверяем что файл существует
        MediaMessage media = mediaMessageRepository.findByStoredName(storedName)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Проверяем что пользователь является участником чата
        User user = userRepository.findByEmail(requestorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Chat chat = media.getMessage().getChat();
        boolean isMember = chat.getMembers().stream()
                .anyMatch(m -> m.getId().equals(user.getId()));
        if (!isMember) {
            throw new RuntimeException("Access denied");
        }

        // Дешифруем
        Path storedPath = Paths.get(uploadPath, "media", storedName);
        byte[] cipherBytes = Files.readAllBytes(storedPath);
        byte[] plainBytes = encryptionService.decrypt(cipherBytes, media.getIvHex());

        return new DecryptedFile(plainBytes, media.getMimeType(), media.getFileName());
    }

    // ── Валидация файла ──────────────────────────────────────────
    private void validateFile(MultipartFile file, String mediaType) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        long maxSize = switch (mediaType.toUpperCase()) {
            case "PHOTO" ->
                20L * 1024 * 1024;   // 20 MB
            case "VIDEO" ->
                200L * 1024 * 1024;   // 200 MB
            case "DOCUMENT" ->
                50L * 1024 * 1024;   // 50 MB
            default ->
                throw new RuntimeException("Unknown media type: " + mediaType);
        };

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File too large");
        }

        String mime = file.getContentType();
        if (mime == null) {
            throw new RuntimeException("Cannot determine file type");
        }

        boolean valid = switch (mediaType.toUpperCase()) {
            case "PHOTO" ->
                mime.startsWith("image/");
            case "VIDEO" ->
                mime.startsWith("video/");
            case "DOCUMENT" ->
                true;   // любой тип документа
            default ->
                false;
        };

        if (!valid) {
            throw new RuntimeException("Invalid file type for " + mediaType);
        }
    }

    private String getExt(String name) {
        if (name == null) {
            return "bin";
        }
        int i = name.lastIndexOf('.');
        return i >= 0 ? name.substring(i + 1).toLowerCase() : "bin";
    }

    public MediaMessageDto toMediaDto(MediaMessage m) {
        MediaMessageDto dto = new MediaMessageDto();
        dto.setId(m.getId());
        dto.setMessageId(m.getMessage().getId());
        dto.setMediaType(m.getMediaType());
        dto.setMimeType(m.getMimeType());
        dto.setFileName(m.getFileName());
        dto.setFileSize(m.getFileSize());
        dto.setWidth(m.getWidth());
        dto.setHeight(m.getHeight());
        dto.setDuration(m.getDuration());
        // URL для стриминга — контроллер дешифрует на лету
        dto.setViewUrl("media/" + m.getStoredName());
        dto.setCreatedAt(m.getCreatedAt());
        return dto;
    }

    // ── Inner result class ───────────────────────────────────────
    public static class DecryptedFile {

        public final byte[] bytes;
        public final String mimeType;
        public final String fileName;

        public DecryptedFile(byte[] bytes, String mimeType, String fileName) {
            this.bytes = bytes;
            this.mimeType = mimeType;
            this.fileName = fileName;
        }
    }
}
