package com.example.jochat.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    private MessageStatus status = MessageStatus.SENT;

    private boolean edited = false;
    private boolean deleted = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime readAt;

    public Message() {}

    public enum MessageStatus {
        SENT,       // одна серая птичка
        DELIVERED,  // две серых птички
        READ        // две синих птички
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Chat getChat() { return chat; }
    public void setChat(Chat chat) { this.chat = chat; }

    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public MessageStatus getStatus() { return status; }
    public void setStatus(MessageStatus status) { this.status = status; }

    public boolean isEdited() { return edited; }
    public void setEdited(boolean edited) { this.edited = edited; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
}