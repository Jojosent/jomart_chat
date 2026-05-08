package com.example.jochat.dto;

import java.time.LocalDateTime;

public class AiMessageDto {

    private Long id;
    private String userMessage;
    private String aiResponse;
    private LocalDateTime createdAt;

    public AiMessageDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserMessage() { return userMessage; }
    public void setUserMessage(String m) { this.userMessage = m; }

    public String getAiResponse() { return aiResponse; }
    public void setAiResponse(String r) { this.aiResponse = r; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
}