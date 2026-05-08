package com.example.jochat.repository;

import com.example.jochat.entity.AiMessage;
import com.example.jochat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    // История диалога пользователя с ИИ
    List<AiMessage> findByUserOrderByCreatedAtAsc(User user);

    // Последние N сообщений для контекста
    List<AiMessage> findTop10ByUserOrderByCreatedAtDesc(User user);
}