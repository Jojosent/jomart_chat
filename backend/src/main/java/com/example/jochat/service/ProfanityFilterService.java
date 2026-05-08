package com.example.jochat.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.*;

@Service
public class ProfanityFilterService {

    // ── Список запрещённых слов (рус / каз / eng) ────────────────
    private static final List<String> BAD_WORDS = List.of(

        // 🇷🇺 Русские маты (основные формы)
        "блять", "блядь", "блядина", "бляд",
        "ёбаный", "ебаный", "ёб", "еб", "ёбать", "ебать",
        "пиздец", "пизда", "пизд",
        "хуй", "хуйня", "хуйло", "хуёвый", "хуевый",
        "сука", "суки", "сучка", "сучары",
        "мудак", "мудаки", "мудила",
        "долбоёб", "долбоеб",
        "залупа", "залупон",
        "ёбнутый", "ебнутый",
        "блин",  // мягкий
        "чёрт",  // мягкий
        "шлюха", "шлюхи",
        "пиздюк", "пиздюки",
        "ублюдок", "ублюдки",
        "придурок", "придурки",
        "идиот",   // спорный, но фильтруем
        "дебил", "дебилы",
        "кретин", "кретины",
        "тупица", "тупой",
        "скотина", "скот",
        "урод", "уроды",

        // 🇰🇿 Казахские маты
        "сикпей", "сикпейді",
        "боқ", "боқтық",
        "піш", "піша",
        "қотыр", "қотырсың",
        "нашар",
        "арам",
        "итсің", "ит",
        "есек", "есекпін",
        "шошқа",
        "жезөкше",
        "ңкыр",

        // 🇺🇸 English profanity
        "fuck", "fucked", "fucker", "fucking", "fucks",
        "shit", "shits", "shitty",
        "bitch", "bitches",
        "asshole", "assholes",
        "bastard", "bastards",
        "damn", "damned",
        "cunt", "cunts",
        "dick", "dicks",
        "cock", "cocks",
        "pussy", "pussies",
        "ass", "asses",
        "hell",
        "whore", "whores",
        "slut", "sluts",
        "idiot", "idiots",
        "moron", "morons",
        "retard", "retarded",
        "nigger", "nigga",
        "faggot", "fag"
    );

    // ── Карта замены букв (leetspeak / обход фильтра) ────────────
    private static final Map<String, String> LEET_MAP = new LinkedHashMap<>();

    static {
        LEET_MAP.put("@", "а");
        LEET_MAP.put("4", "а");
        LEET_MAP.put("3", "е");
        LEET_MAP.put("€", "е");
        LEET_MAP.put("0", "о");
        LEET_MAP.put("1", "и");
        LEET_MAP.put("!", "и");
        LEET_MAP.put("5", "с");
        LEET_MAP.put("$", "с");
        LEET_MAP.put("8", "б");
        LEET_MAP.put("|", "л");
        LEET_MAP.put("ё", "е");  // нормализация
        LEET_MAP.put("Ё", "Е");
        LEET_MAP.put("й", "и");
    }

    // ── Скомпилированные паттерны (один раз при старте) ─────────
    private static final List<Pattern> PATTERNS;

    static {
        PATTERNS = new ArrayList<>();
        for (String word : BAD_WORDS) {
            // Нормализуем слово
            String normalized = normalize(word);
            // Паттерн с учётом пробелов/символов между буквами
            String regex = buildPattern(normalized);
            PATTERNS.add(Pattern.compile(regex,
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE));
        }
    }

    // ── Основной метод фильтрации ────────────────────────────────
    public String filter(String text) {
        if (text == null || text.isBlank()) return text;

        String normalized = normalize(text);
        String result = text;

        for (int i = 0; i < PATTERNS.size(); i++) {
            Pattern pattern = PATTERNS.get(i);
            String badWord = BAD_WORDS.get(i);

            Matcher matcher = pattern.matcher(normalized);
            if (matcher.find()) {
                // Заменяем в оригинальном тексте
                result = replaceInOriginal(result, pattern, badWord.length());
            }
        }

        return result;
    }

    // ── Проверить содержит ли текст маты ────────────────────────
    public boolean containsProfanity(String text) {
        if (text == null || text.isBlank()) return false;
        String normalized = normalize(text);
        return PATTERNS.stream().anyMatch(p -> p.matcher(normalized).find());
    }

    // ── Нормализация текста ──────────────────────────────────────
    private static String normalize(String text) {
        String result = text.toLowerCase();
        for (Map.Entry<String, String> entry : LEET_MAP.entrySet()) {
            result = result.replace(entry.getKey(), entry.getValue());
        }
        return result;
    }

    // ── Строим regex паттерн ─────────────────────────────────────
    private static String buildPattern(String word) {
        StringBuilder sb = new StringBuilder();
        // Слово может содержать спец. символы между буквами
        for (int i = 0; i < word.length(); i++) {
            sb.append(Pattern.quote(String.valueOf(word.charAt(i))));
            if (i < word.length() - 1) {
                // Между буквами могут быть пробелы, точки, дефисы
                sb.append("[\\s\\-\\.\\*_]*");
            }
        }
        // Границы слова
        return "(?<![а-яёa-z])" + sb + "(?![а-яёa-z])";
    }

    // ── Замена в оригинальном тексте ────────────────────────────
    private String replaceInOriginal(String text, Pattern pattern, int wordLen) {
        // Нормализуем для поиска позиций
        String normalized = normalize(text);
        Matcher matcher = pattern.matcher(normalized);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            int start = matcher.start();
            int end = matcher.end();
            int matchLen = end - start;
            // Звёздочки по длине найденного слова
            String stars = "*".repeat(Math.max(wordLen, matchLen));
            // Заменяем соответствующий кусок в оригинальном тексте
            if (end <= text.length()) {
                matcher.appendReplacement(sb, Matcher.quoteReplacement(stars));
            }
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}