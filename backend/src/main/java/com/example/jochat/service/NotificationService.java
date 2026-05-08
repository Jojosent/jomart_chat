package com.example.jochat.service;

import com.example.jochat.dto.NotificationDto;
import com.example.jochat.entity.Notification;
import com.example.jochat.entity.User;
import com.example.jochat.repository.NotificationRepository;
import com.example.jochat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private UserService userService;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    // ── Создать и отправить уведомление ─────────────────────────
    @Transactional
    public void createAndSend(
            User recipient,
            User sender,
            Notification.NotificationType type,
            String title,
            String body,
            Long referenceId,
            String referenceType) {

        // Не уведомляем самого себя
        if (recipient.getId().equals(sender.getId())) return;

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setSender(sender);
        notification.setType(type);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notificationRepository.save(notification);

        // Реал-тайм через WebSocket
        NotificationDto dto = toDto(notification);
        messagingTemplate.convertAndSendToUser(
            recipient.getEmail(),
            "/queue/notifications",
            dto
        );
    }

    // ── Уведомление о новом сообщении ────────────────────────────
    @Transactional
    public void notifyNewMessage(User sender, User recipient,
                                  Long chatId, String messagePreview) {
        String preview = messagePreview.length() > 50
            ? messagePreview.substring(0, 50) + "..."
            : messagePreview;

        createAndSend(
            recipient, sender,
            Notification.NotificationType.NEW_MESSAGE,
            sender.getFullName(),
            preview,
            chatId, "CHAT"
        );
    }

    // ── Уведомление о приглашении в группу ───────────────────────
    @Transactional
    public void notifyGroupInvite(User admin, User newMember,
                                   Long groupId, String groupName) {
        createAndSend(
            newMember, admin,
            Notification.NotificationType.GROUP_INVITE,
            "Приглашение в группу",
            admin.getFullName() + " добавил вас в группу «" + groupName + "»",
            groupId, "GROUP"
        );
    }

    // ── Уведомление об удалении из группы ────────────────────────
    @Transactional
    public void notifyGroupRemoved(User admin, User member,
                                    Long groupId, String groupName) {
        createAndSend(
            member, admin,
            Notification.NotificationType.GROUP_REMOVED,
            "Удалён из группы",
            "Вы были удалены из группы «" + groupName + "»",
            groupId, "GROUP"
        );
    }

    // ── Уведомление о передаче прав ──────────────────────────────
    @Transactional
    public void notifyAdminTransferred(User oldAdmin, User newAdmin,
                                        Long groupId, String groupName) {
        createAndSend(
            newAdmin, oldAdmin,
            Notification.NotificationType.ADMIN_TRANSFERRED,
            "Вы стали администратором",
            "Вы стали администратором группы «" + groupName + "»",
            groupId, "GROUP"
        );
    }

    // ── Получить все уведомления ─────────────────────────────────
    public List<NotificationDto> getAll(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository
                .findByRecipientOrderByCreatedAtDesc(user)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── Количество непрочитанных ─────────────────────────────────
    public int getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    // ── Прочитать одно ───────────────────────────────────────────
    @Transactional
    public void markAsRead(Long notificationId, String email) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!n.getRecipient().getEmail().equals(email))
            throw new RuntimeException("Access denied");
        n.setRead(true);
        notificationRepository.save(n);
    }

    // ── Прочитать все ────────────────────────────────────────────
    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        notificationRepository.markAllAsRead(user);
    }

    // ── Converter ────────────────────────────────────────────────
    public NotificationDto toDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getId());
        dto.setType(n.getType().name());
        dto.setTitle(n.getTitle());
        dto.setBody(n.getBody());
        dto.setReferenceId(n.getReferenceId());
        dto.setReferenceType(n.getReferenceType());
        dto.setRead(n.isRead());
        dto.setCreatedAt(n.getCreatedAt());
        if (n.getSender() != null)
            dto.setSender(userService.toDto(n.getSender()));
        return dto;
    }
}