package com.example.jochat.controller;

import com.example.jochat.service.TranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/translate")
@CrossOrigin(origins = "http://localhost:3000")
public class TranslationController {

    @Autowired
    private TranslationService translationService;

    @PostMapping
    public ResponseEntity<?> translate(@RequestBody Map<String, String> body) {
        try {
            String text = body.get("text");
            String targetLang = body.get("targetLang");

            System.out.println("=== TRANSLATE REQUEST ===");
            System.out.println("Text: " + text);
            System.out.println("TargetLang: " + targetLang);

            if (text == null || text.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Text is required"));
            }

            if (targetLang == null || targetLang.isBlank()) {
                targetLang = "ru";
            }

            TranslationService.TranslationResult result
                    = translationService.translateAuto(text, targetLang);

            System.out.println("=== TRANSLATE RESULT ===");
            System.out.println("Translated: " + result.getTranslated());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("=== TRANSLATE ERROR ===");
            System.err.println(e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
