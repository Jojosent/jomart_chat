package com.example.jochat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.*;

@Service
public class TranslationService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.gemini.api-key}")
    private String geminiApiKey;

    private static final String MYMEMORY_URL = "https://api.mymemory.translated.net/get";
    private static final String GEMINI_URL
            = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=";

    public TranslationResult translateAuto(String text, String targetLang) {
        try {
            // ── Шаг 1: расшифровываем сленг через Gemini ────────
            String expanded = expandSlang(text);
            System.out.println("Expanded: " + expanded);

            String detectedLang = guessLanguage(expanded);

            if (detectedLang.equalsIgnoreCase(targetLang)) {
                TranslationResult same = new TranslationResult();
                same.setOriginal(text);
                same.setTranslated(expanded);
                same.setDetectedLang(detectedLang);
                same.setTargetLang(targetLang);
                return same;
            }

            String langPair = detectedLang + "|" + targetLang;

            // ── Шаг 2: переводим расшифрованный текст ───────────
            URI uri = UriComponentsBuilder
                    .fromHttpUrl(MYMEMORY_URL)
                    .queryParam("q", expanded)
                    .queryParam("langpair", langPair)
                    .build(false) // false = не кодировать повторно
                    .encode() // кодируем один раз правильно
                    .toUri();

            System.out.println("Request URI: " + uri);

            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            System.out.println("Response: " + response.getBody());

            JsonNode root = objectMapper.readTree(response.getBody());
            int status = root.path("responseStatus").asInt(200);

            if (status != 200) {
                String detail = root.path("responseDetails").asText("Unknown error");
                throw new RuntimeException("MyMemory error: " + detail);
            }

            String translated = root
                    .path("responseData")
                    .path("translatedText")
                    .asText(text);

            if (translated.isBlank() || translated.contains("MYMEMORY WARNING")) {
                translated = text;
            }

            TranslationResult result = new TranslationResult();
            result.setOriginal(text);
            result.setTranslated(translated);
            result.setDetectedLang(detectedLang);
            result.setTargetLang(targetLang);
            return result;

        } catch (Exception e) {
            System.err.println("Translation error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Translation failed: " + e.getMessage());
        }
    }

    // ── Gemini: расшифровка сленга ───────────────────────────────
    private String expandSlang(String text) {
        try {
            String prompt = """
                You are a text normalizer. Your job is to expand internet slang, \
                abbreviations and informal shortenings into proper full words.
                
                Rules:
                - Keep the SAME language as the input (Russian stays Russian, \
                Kazakh stays Kazakh, English stays English)
                - Only expand clear abbreviations/slang (u→you, r→are, \
                спс→спасибо, пж→пожалуйста, норм→нормально, \
                ок→окей, лол→смеюсь, btw→by the way, \
                рахмет→рахмет (keep Kazakh words), \
                жақсы→жақсы (keep Kazakh words))
                - Do NOT translate — only normalize within the same language
                - Do NOT add punctuation or change meaning
                - If nothing to expand, return the original text exactly
                - Return ONLY the normalized text, nothing else
                
                Text to normalize: %s
                """.formatted(text);

            Map<String, Object> body = new HashMap<>();
            body.put("contents", List.of(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt))
            )));
            body.put("generationConfig", Map.of(
                    "temperature", 0.1,
                    "maxOutputTokens", 200
            ));

            String bodyJson = objectMapper.writeValueAsString(body);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_URL + geminiApiKey,
                    new HttpEntity<>(bodyJson, headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String result = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text")
                    .asText("").trim();

            // Если Gemini вернул пустое или ошибку — используем оригинал
            return result.isBlank() ? text : result;

        } catch (Exception e) {
            System.err.println("Slang expand error: " + e.getMessage());
            return text; // fallback — оригинальный текст
        }
    }

    // ── Определение языка по символам ───────────────────────────
    private String guessLanguage(String text) {
        if (text == null || text.isBlank()) {
            return "en";
        }

        int cyrillicCount = 0;
        int latinCount = 0;
        int kazakhCount = 0;

        String kazakhSpecific = "әіңғүұқөһӘІҢҒҮҰҚӨҺ";

        for (char c : text.toCharArray()) {
            if (kazakhSpecific.indexOf(c) >= 0) {
                kazakhCount++;
            } else if ((c >= 'а' && c <= 'я') || (c >= 'А' && c <= 'Я')
                    || c == 'ё' || c == 'Ё') {
                cyrillicCount++;
            } else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
                latinCount++;
            }
        }

        if (kazakhCount > 0) {
            return "kk";
        }
        if (cyrillicCount > latinCount) {
            return "ru";
        }
        return "en";
    }

    // ── Result DTO ───────────────────────────────────────────────
    public static class TranslationResult {

        private String original;
        private String translated;
        private String detectedLang;
        private String targetLang;

        public String getOriginal() {
            return original;
        }

        public void setOriginal(String o) {
            this.original = o;
        }

        public String getTranslated() {
            return translated;
        }

        public void setTranslated(String t) {
            this.translated = t;
        }

        public String getDetectedLang() {
            return detectedLang;
        }

        public void setDetectedLang(String d) {
            this.detectedLang = d;
        }

        public String getTargetLang() {
            return targetLang;
        }

        public void setTargetLang(String t) {
            this.targetLang = t;
        }
    }
}
