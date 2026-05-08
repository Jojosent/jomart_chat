package com.example.jochat.dto;

import java.time.LocalDateTime;

public class NotificationDto {

    private Long id;
    private String type;
    private String title;
    private String body;
    private Long referenceId;
    private String referenceType;
    private boolean read;
    private LocalDateTime createdAt;
    private UserDto sender;

    public NotificationDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public UserDto getSender() { return sender; }
    public void setSender(UserDto sender) { this.sender = sender; }
}