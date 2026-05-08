package com.example.jochat.repository;

import com.example.jochat.entity.Chat;
import com.example.jochat.entity.Message;
import com.example.jochat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByChatOrderByCreatedAtAsc(Chat chat);

    // Непрочитанные (SENT или DELIVERED), не от текущего юзера
    @Query("""
        SELECT m FROM Message m
        WHERE m.chat = :chat
        AND m.sender != :user
        AND m.status != 'READ'
    """)
    List<Message> findUnreadMessages(
        @Param("chat") Chat chat,
        @Param("user") User user
    );

    // SENT сообщения не от получателя (для DELIVERED)
    List<Message> findByChatAndStatusAndSenderNot(
        Chat chat,
        Message.MessageStatus status,
        User sender
    );

    // Количество непрочитанных
    @Query("""
        SELECT COUNT(m) FROM Message m
        WHERE m.chat = :chat
        AND m.sender != :user
        AND m.status != 'READ'
    """)
    int countUnread(@Param("chat") Chat chat, @Param("user") User user);
}