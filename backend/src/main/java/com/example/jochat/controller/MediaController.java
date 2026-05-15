// backend/src/main/java/com/example/jochat/controller/MediaController.java
package com.example.jochat.controller;

import com.example.jochat.dto.MessageDto;
import com.example.jochat.service.MediaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "http://localhost:3000")
public class MediaController {

    @Autowired
    private MediaService mediaService;

    // POST /api/media/upload
    // Params: file (multipart), chatId (form param), mediaType (PHOTO|VIDEO|DOCUMENT)
    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file")      MultipartFile file,
            @RequestParam("chatId")    Long chatId,
            @RequestParam("mediaType") String mediaType) {
        try {
            MessageDto msg = mediaService.uploadMedia(
                    userDetails.getUsername(), chatId, file, mediaType);
            return ResponseEntity.ok(msg);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    // GET /api/media/{storedName}
    // Дешифрует и стримит файл — доступно только участникам чата
    @GetMapping("/{storedName}")
    public ResponseEntity<byte[]> view(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String storedName) {
        try {
            MediaService.DecryptedFile decrypted =
                    mediaService.getDecryptedFile(storedName, userDetails.getUsername());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(decrypted.mimeType));
            // inline — браузер покажет, не скачает
            headers.setContentDisposition(
                    ContentDisposition.inline().filename(decrypted.fileName).build());
            headers.setContentLength(decrypted.bytes.length);
            // Запрещаем кеширование — каждый раз через авторизацию
            headers.setCacheControl("no-store, no-cache, must-revalidate");

            return new ResponseEntity<>(decrypted.bytes, headers, HttpStatus.OK);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}