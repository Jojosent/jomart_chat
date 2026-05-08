package com.example.jochat.websocket;

import com.example.jochat.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    if (jwtService.isTokenValid(token)) {
                        String email = jwtService.extractEmail(token);
                        UserDetails userDetails =
                            userDetailsService.loadUserByUsername(email);

                        UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                userDetails, null,
                                Collections.emptyList()
                            );
                        accessor.setUser(auth);
                    }
                } catch (Exception e) {
                    System.err.println("WebSocket auth error: " + e.getMessage());
                }
            }
        }
        return message;
    }
}