package com.example.jochat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SendMessageRequest {

    @NotNull(message = "Chat ID is required")
    private Long chatId;

    @NotBlank(message = "Message content is required")
    private String content;

    public SendMessageRequest() {
    }

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
