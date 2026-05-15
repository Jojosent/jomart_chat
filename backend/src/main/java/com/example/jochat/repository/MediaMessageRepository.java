// backend/src/main/java/com/example/jochat/repository/MediaMessageRepository.java
package com.example.jochat.repository;

import com.example.jochat.entity.MediaMessage;
import com.example.jochat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MediaMessageRepository extends JpaRepository<MediaMessage, Long> {

    Optional<MediaMessage> findByMessage(Message message);

    Optional<MediaMessage> findByStoredName(String storedName);
}
