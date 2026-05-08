package com.example.jochat.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chats")
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private ChatType type = ChatType.PRIVATE;

    // Только для групп
    private String name;
    private String avatarUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "chat_members",
        joinColumns = @JoinColumn(name = "chat_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> members = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_message_id")
    private Message lastMessage;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public Chat() {}

    public enum ChatType { PRIVATE, GROUP }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ChatType getType() { return type; }
    public void setType(ChatType type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public List<User> getMembers() { return members; }
    public void setMembers(List<User> members) { this.members = members; }

    public Message getLastMessage() { return lastMessage; }
    public void setLastMessage(Message lastMessage) { this.lastMessage = lastMessage; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}