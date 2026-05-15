// backend/src/main/java/com/example/jochat/entity/MediaMessage.java
package com.example.jochat.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "media_messages")
public class MediaMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @Column(nullable = false)
    private String fileName;        // оригинальное имя файла

    @Column(nullable = false)
    private String storedName;      // зашифрованное имя на диске (UUID)

    @Column(nullable = false)
    private String mediaType;       // PHOTO, VIDEO, DOCUMENT

    @Column(nullable = false)
    private String mimeType;        // image/jpeg, video/mp4, etc.

    private Long fileSize;          // размер в байтах

    private Integer width;          // для фото/видео
    private Integer height;

    private Integer duration;       // для видео (секунды)

    @Column(nullable = false)
    private String ivHex;           // IV для AES-GCM (hex)

    @CreationTimestamp
    private LocalDateTime createdAt;

    public MediaMessage() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Message getMessage() { return message; }
    public void setMessage(Message message) { this.message = message; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getStoredName() { return storedName; }
    public void setStoredName(String storedName) { this.storedName = storedName; }

    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }

    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public String getIvHex() { return ivHex; }
    public void setIvHex(String ivHex) { this.ivHex = ivHex; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}