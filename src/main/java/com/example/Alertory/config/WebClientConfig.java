package com.example.Alertory.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

// CHANGED: AI 서버 통신용 WebClient 설정 (타임아웃 추가)
@Configuration
public class WebClientConfig {
    
    @Bean
    public WebClient webClient() {
        // CHANGED: 타임아웃 설정 (30초로 증가 - AI 모델 추론 시간 고려)
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(30))
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000);
        
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
                .build();
    }
}