package com.example.jochat.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("JoChat — Код подтверждения");
            helper.setText(buildOtpHtml(otp), true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email");
        }
    }

    private String buildOtpHtml(String otp) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; margin: 0; padding: 40px; }
                .container { max-width: 480px; margin: 0 auto; background: #1a1a2e; border-radius: 16px;
                             padding: 40px; border: 1px solid #2d2d4e; }
                .logo { font-size: 28px; font-weight: 800; color: #7c6af7; letter-spacing: -1px;
                        text-align: center; margin-bottom: 8px; }
                .subtitle { text-align: center; color: #888; font-size: 14px; margin-bottom: 32px; }
                .otp-box { background: #0f0f1a; border: 2px solid #7c6af7; border-radius: 12px;
                           text-align: center; padding: 24px; margin: 24px 0; }
                .otp-code { font-size: 42px; font-weight: 900; color: #7c6af7; letter-spacing: 12px; }
                .info { color: #666; font-size: 13px; text-align: center; line-height: 1.6; }
                .expire { color: #f87171; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">JoChat</div>
                <div class="subtitle">Мессенджер нового поколения</div>
                <p style="color:#aaa; text-align:center; font-size:15px;">
                  Ваш код подтверждения для регистрации:
                </p>
                <div class="otp-box">
                  <div class="otp-code">%s</div>
                </div>
                <p class="info">
                  Код действителен <span class="expire">5 минут</span>.<br>
                  Если вы не запрашивали этот код — просто проигнорируйте письмо.
                </p>
              </div>
            </body>
            </html>
            """.formatted(otp);
    }
}