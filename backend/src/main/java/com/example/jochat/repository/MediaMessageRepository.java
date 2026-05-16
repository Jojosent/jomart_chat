package com.example.jochat.repository;

import com.example.jochat.entity.MediaMessage;
import com.example.jochat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MediaMessageRepository extends JpaRepository<MediaMessage, Long> {

    Optional<MediaMessage> findByMessage(Message message);

    // JOIN FETCH чтобы загрузить message → chat → members в одном запросе
    @Query("""
        SELECT mm FROM MediaMessage mm
        JOIN FETCH mm.message msg
        JOIN FETCH msg.chat chat
        JOIN FETCH chat.members
        WHERE mm.storedName = :storedName
    """)
    Optional<MediaMessage> findByStoredName(@Param("storedName") String storedName);
}   