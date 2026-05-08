package com.example.jochat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class TranslationService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String MYMEMORY_URL =
        "https://api.mymemory.translated.net/get";

    // ── Перевести текст ──────────────────────────────────────────
    public TranslationResult translateAuto(String text, String targetLang) {
        try {
            // Определяем язык по символам
            String detectedLang = guessLanguage(text);
            System.out.println("Detected lang: " + detectedLang);
            System.out.println("Target lang: " + targetLang);

            // Если язык совпадает — не переводим
            if (detectedLang.equalsIgnoreCase(targetLang)) {
                TranslationResult same = new TranslationResult();
                same.setOriginal(text);
                same.setTranslated(text);
                same.setDetectedLang(detectedLang);
                same.setTargetLang(targetLang);
                return same;
            }

            // Простые 2-буквенные коды: en, ru, kk
            String langPair = detectedLang + "|" + targetLang;
            System.out.println("Lang pair: " + langPair);

            String url = MYMEMORY_URL
                + "?q=" + java.net.URLEncoder.encode(text, "UTF-8")
                + "&langpair=" + langPair;

            System.out.println("Request URL: " + url);

            String response = restTemplate.getForObject(url, String.class);
            System.out.println("Response: " + response);

            JsonNode root = objectMapper.readTree(response);
            int status = root.path("responseStatus").asInt(200);

            if (status != 200) {
                String detail = root.path("responseDetails").asText("Unknown");
                throw new RuntimeException("MyMemory error: " + detail);
            }

            String translated = root
                .path("responseData")
                .path("translatedText")
                .asText(text);

            if (translated.contains("MYMEMORY WARNING") || translated.isBlank()) {
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

    // ── Определение языка по символам ───────────────────────────
    private String guessLanguage(String text) {
        if (text == null || text.isBlank()) return "en";

        int cyrillicCount = 0;
        int latinCount    = 0;
        int kazakhCount   = 0;

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

        System.out.println("Chars — kazakh: " + kazakhCount
            + ", cyrillic: " + cyrillicCount
            + ", latin: " + latinCount);

        if (kazakhCount > 0)                  return "kk";
        if (cyrillicCount > latinCount)       return "ru";
        return "en";
    }

    // ── Result DTO ───────────────────────────────────────────────
    public static class TranslationResult {
        private String original;
        private String translated;
        private String detectedLang;
        private String targetLang;

        public String getOriginal() { return original; }
        public void setOriginal(String o) { this.original = o; }

        public String getTranslated() { return translated; }
        public void setTranslated(String t) { this.translated = t; }

        public String getDetectedLang() { return detectedLang; }
        public void setDetectedLang(String d) { this.detectedLang = d; }

        public String getTargetLang() { return targetLang; }
        public void setTargetLang(String t) { this.targetLang = t; }
    }
}