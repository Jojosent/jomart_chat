package com.example.jochat.repository;

import com.example.jochat.entity.Notification;
import com.example.jochat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    List<Notification> findByRecipientAndReadFalseOrderByCreatedAtDesc(User recipient);

    int countByRecipientAndReadFalse(User recipient);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :user")
    void markAllAsRead(@Param("user") User user);
}