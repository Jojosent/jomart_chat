package com.example.jochat.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ChatDto {

    private Long id;
    private String type;
    private String name;        // ← добавь это
    private String avatarUrl;   // ← и это
    private List<UserDto> members;
    private MessageDto lastMessage;
    private LocalDateTime createdAt;
    private int unreadCount;
    
    private int messageCount;
  public int getMessageCount() { return messageCount; }
  public void setMessageCount(int messageCount) { this.messageCount = messageCount; }


    public ChatDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public List<UserDto> getMembers() { return members; }
    public void setMembers(List<UserDto> members) { this.members = members; }

    public MessageDto getLastMessage() { return lastMessage; }
    public void setLastMessage(MessageDto lastMessage) { this.lastMessage = lastMessage; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public int getUnreadCount() { return unreadCount; }
    public void setUnreadCount(int unreadCount) { this.unreadCount = unreadCount; }
}