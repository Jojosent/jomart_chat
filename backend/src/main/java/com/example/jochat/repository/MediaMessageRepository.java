package com.example.jochat.repository;

import com.example.jochat.entity.MediaMessage;
import com.example.jochat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MediaMessageRepository extends JpaRepository<MediaMessage, Long> {

    Optional<MediaMessage> findByMessage(Message message);

    // JOIN FETCH для загрузки chat + members в одном запросе (используется при доступе к файлу)
    @Query("""
        SELECT mm FROM MediaMessage mm
        JOIN FETCH mm.message msg
        JOIN FETCH msg.chat chat
        JOIN FETCH chat.members
        WHERE mm.storedName = :storedName
    """)
    Optional<MediaMessage> findByStoredName(@Param("storedName") String storedName);

    // ── НОВЫЙ МЕТОД: все записи с одним storedName (оригинал + пересланные копии)
    // Нужен для проверки доступа — пользователь может быть в чате любой из копий
    @Query("""
        SELECT mm FROM MediaMessage mm
        JOIN FETCH mm.message msg
        JOIN FETCH msg.chat chat
        JOIN FETCH chat.members
        WHERE mm.storedName = :storedName
    """)
    List<MediaMessage> findAllByStoredName(@Param("storedName") String storedName);
}