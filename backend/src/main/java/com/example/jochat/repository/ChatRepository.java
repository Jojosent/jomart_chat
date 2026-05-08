package com.example.jochat.repository;

import com.example.jochat.entity.Chat;
import com.example.jochat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRepository extends JpaRepository<Chat, Long> {

    // Все чаты пользователя
    @Query("SELECT c FROM Chat c JOIN c.members m WHERE m = :user ORDER BY c.createdAt DESC")
    List<Chat> findAllByMember(@Param("user") User user);

    // Найти приватный чат между двумя пользователями
    @Query("""
        SELECT c FROM Chat c
        WHERE c.type = 'PRIVATE'
        AND :user1 MEMBER OF c.members
        AND :user2 MEMBER OF c.members
    """)
    Optional<Chat> findPrivateChat(
        @Param("user1") User user1,
        @Param("user2") User user2
    );
}