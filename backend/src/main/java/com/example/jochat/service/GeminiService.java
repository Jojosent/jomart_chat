package com.example.jochat.service;

import com.example.jochat.dto.AiMessageDto;
import com.example.jochat.entity.AiMessage;
import com.example.jochat.entity.User;
import com.example.jochat.repository.AiMessageRepository;
import com.example.jochat.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    @Autowired
    private AiMessageRepository aiMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.gemini.api-key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    "gemini-3-flash-preview:generateContent?key=";
    // "gemini-2.0-flash-lite:generateContent?key=";

    private static final String SYSTEM_PROMPT =
        "You are JoBot — a helpful AI assistant inside JoChat messenger. " +
        "You are friendly, concise, and helpful. " +
        "You can help with: answering questions, writing text, " +
        "translating, summarizing, coding help, and general conversation. " +
        "Respond in the same language the user writes in. " +
        "Keep responses clear and not too long unless asked for detail.";

    // ── Отправить сообщение и получить ответ ─────────────────────
    public AiMessageDto chat(String email, String userMessage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Получаем последние 10 сообщений для контекста
        List<AiMessage> history = aiMessageRepository
                .findTop10ByUserOrderByCreatedAtDesc(user);
        Collections.reverse(history); // от старых к новым

        // Строим контекст из истории
        List<Map<String, Object>> contents = new ArrayList<>();

        // Системный промпт как первое сообщение
        contents.add(Map.of(
            "role", "user",
            "parts", List.of(Map.of("text", SYSTEM_PROMPT))
        ));
        contents.add(Map.of(
            "role", "model",
            "parts", List.of(Map.of("text",
                "Understood! I am JoBot, your assistant in JoChat. How can I help you?"))
        ));

        // История диалога
        for (AiMessage msg : history) {
            contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", msg.getUserMessage()))
            ));
            contents.add(Map.of(
                "role", "model",
                "parts", List.of(Map.of("text", msg.getAiResponse()))
            ));
        }

        // Текущее сообщение
        contents.add(Map.of(
            "role", "user",
            "parts", List.of(Map.of("text", userMessage))
        ));

        // Вызываем Gemini
        String aiResponse = callGemini(contents);

        // Сохраняем в БД
        AiMessage aiMessage = new AiMessage();
        aiMessage.setUser(user);
        aiMessage.setUserMessage(userMessage);
        aiMessage.setAiResponse(aiResponse);
        aiMessageRepository.save(aiMessage);

        return toDto(aiMessage);
    }

    // ── История диалога ───────────────────────────────────────────
    public List<AiMessageDto> getHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return aiMessageRepository.findByUserOrderByCreatedAtAsc(user)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── Очистить историю ─────────────────────────────────────────
    public void clearHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<AiMessage> history = aiMessageRepository
                .findByUserOrderByCreatedAtAsc(user);
        aiMessageRepository.deleteAll(history);
    }

    // ── Вызов Gemini API ─────────────────────────────────────────
    private String callGemini(List<Map<String, Object>> contents) {
        try {
            String url = GEMINI_URL + geminiApiKey;

            Map<String, Object> body = new HashMap<>();
            body.put("contents", contents);
            body.put("generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 1024
            ));

            String bodyJson = objectMapper.writeValueAsString(body);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(bodyJson, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                url, entity, String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());

            if (root.has("error")) {
                String errMsg = root.path("error").path("message").asText();
                throw new RuntimeException("Gemini error: " + errMsg);
            }

            return root
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text")
                .asText("Sorry, I couldn't generate a response.");

        } catch (Exception e) {
            System.err.println("Gemini error: " + e.getMessage());
            throw new RuntimeException("AI service error: " + e.getMessage());
        }
    }

    // ── Converter ─────────────────────────────────────────────────
    private AiMessageDto toDto(AiMessage msg) {
        AiMessageDto dto = new AiMessageDto();
        dto.setId(msg.getId());
        dto.setUserMessage(msg.getUserMessage());
        dto.setAiResponse(msg.getAiResponse());
        dto.setCreatedAt(msg.getCreatedAt());
        return dto;
    }
}