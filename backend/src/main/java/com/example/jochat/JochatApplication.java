package com.example.jochat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class JochatApplication {
    public static void main(String[] args) {
        SpringApplication.run(JochatApplication.class, args);
    }
}