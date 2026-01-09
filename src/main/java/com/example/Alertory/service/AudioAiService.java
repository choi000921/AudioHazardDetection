package com.example.Alertory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.File;

@Service
@RequiredArgsConstructor
public class AudioAiService {

    private final WebClient webClient;

    public String analyze(File audioFile) {

        return webClient.post()
                .uri("http://AI_SERVER_IP:8000/analyze")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(
                        "file", new FileSystemResource(audioFile)
                ))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}
