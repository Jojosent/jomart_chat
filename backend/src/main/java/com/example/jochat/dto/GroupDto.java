package com.example.jochat.dto;

import java.time.LocalDateTime;
import java.util.List;

public class GroupDto {

    private Long id;
    private String name;
    private String description;
    private String avatarUrl;
    private UserDto admin;
    private List<UserDto> members;
    private Long chatId;
    private int memberCount;
    private LocalDateTime createdAt;

    public GroupDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public UserDto getAdmin() { return admin; }
    public void setAdmin(UserDto admin) { this.admin = admin; }

    public List<UserDto> getMembers() { return members; }
    public void setMembers(List<UserDto> members) { this.members = members; }

    public Long getChatId() { return chatId; }
    public void setChatId(Long chatId) { this.chatId = chatId; }

    public int getMemberCount() { return memberCount; }
    public void setMemberCount(int memberCount) { this.memberCount = memberCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}