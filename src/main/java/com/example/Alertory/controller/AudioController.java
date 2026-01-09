package com.example.Alertory.controller;

import com.example.Alertory.annotation.RequireActiveStatus;
import com.example.Alertory.dto.AiAnalysisResponse;
import com.example.Alertory.entity.Event;
import com.example.Alertory.repository.EventRepository;
import com.example.Alertory.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// CHANGED: 파일 검증, 인증 체크, 로깅 강화
@RestController
@RequestMapping("/api/audio")
@RequiredArgsConstructor
@Slf4j
public class AudioController {
    
    private final EventRepository eventRepository;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String uploadDir = "uploads/audio/";
    
    // ADDED: AI 서버 URL 설정값 주입
    @Value("${app.ai-server.url:http://localhost:8001}")
    private String aiServerUrl;
    
    // ADDED: 허용되는 파일 확장자
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".wav", ".mp3", ".m4a", ".flac", ".webm", ".aac", ".ogg");
    
    // ADDED: 파일 크기 제한 (10MB)
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024L;
    
    // ADDED: AI 서버 연결 테스트 엔드포인트
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // AI 서버 연결 테스트
            String response = webClient.get()
                    .uri(aiServerUrl + "/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            health.put("aiServer", "connected");
            health.put("aiServerUrl", aiServerUrl);
            health.put("aiServerResponse", response);
            
        } catch (Exception e) {
            health.put("aiServer", "disconnected");
            health.put("aiServerUrl", aiServerUrl);
            health.put("aiServerError", e.getMessage());
        }
        
        health.put("uploadDir", uploadDir);
        health.put("maxFileSize", MAX_FILE_SIZE / (1024 * 1024) + "MB");
        health.put("allowedExtensions", ALLOWED_EXTENSIONS);
        
        return ResponseEntity.ok(health);
    }
    
    // CHANGED: 파일 검증, 인증 체크, 로깅 추가
    @PostMapping("/analyze")
    @RequireActiveStatus
    public ResponseEntity<Map<String, Object>> analyzeAudio(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "locationLabel", required = false, defaultValue = "A공장 1층") String locationLabel,
            @AuthenticationPrincipal CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        // ADDED: 인증 체크
        if (principal == null) {
            log.warn("인증되지 않은 사용자의 오디오 분석 요청");
            return createErrorResponse("로그인이 필요합니다.", 401);
        }
        
        String userEmail = principal.getUsername();
        log.info("오디오 분석 요청 수신 - 사용자: {}, 파일: {}, 크기: {}KB", 
                userEmail, file.getOriginalFilename(), file.getSize() / 1024);
        
        String savedFilePath = null;
        
        try {
            // ADDED: 파일 검증
            validateUploadedFile(file);
            
            // 업로드 디렉토리 생성
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // 파일 저장 (고유한 파일명 생성)
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);
            savedFilePath = filePath.toAbsolutePath().toString();
            
            log.info("파일 업로드 완료 - 경로: {}", savedFilePath);
            
            // ADDED: AI 서버 호출 (로깅 추가)
            log.info("AI 서버 요청 시작 - URL: {}/predict", aiServerUrl);
            AiAnalysisResponse aiResponse = callAiServer(filePath);
            
            // ADDED: AI 서버 응답 전체 로깅
            log.info("AI 서버 응답 전체: label={}, confidence={}, text={}, isDanger={}", 
                    aiResponse.getLabel(), aiResponse.getConfidence(), 
                    aiResponse.getText(), aiResponse.getIsDanger());
            
            // ADDED: AI 응답 유효성 검증
            if (!aiResponse.isValid()) {
                String validationError = aiResponse.getValidationError();
                log.warn("AI 서버 응답 검증 실패: {}", validationError);
                
                return createErrorResponse(
                    "AI 분석 결과가 유효하지 않습니다: " + validationError,
                    502
                );
            }
            
            // CHANGED: Event 엔티티 생성 및 저장 (AI 응답 필드 추가)
            Event event = Event.builder()
                    .eventType(aiResponse.getLabel())
                    .confidence(aiResponse.getConfidence()) // 0-100 그대로 저장
                    .audioFilePath(savedFilePath)
                    .detectedAt(LocalDateTime.now())
                    .locationLabel(locationLabel)
                    .status(Event.EventStatus.NEW)
                    .build();
            
            Event savedEvent = eventRepository.save(event);
            
            log.info("DB 저장 완료 - Event ID: {}, Type: {}, Confidence: {:.1f}%", 
                    savedEvent.getId(), savedEvent.getEventType(), savedEvent.getConfidence());
            
            // CHANGED: 성공 응답 생성 (AI 응답 필드 모두 포함)
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("eventId", savedEvent.getId());
            response.put("eventType", aiResponse.getLabel());
            response.put("confidence", aiResponse.getConfidence()); // 0-100 그대로 전달
            response.put("text", aiResponse.getText());
            response.put("isDanger", aiResponse.getIsDanger());
            response.put("dangerLevel", aiResponse.getIsDanger() ? "위험" : "안전"); // 추가
            response.put("description", aiResponse.getText()); // 설명 필드 추가
            response.put("locationLabel", savedEvent.getLocationLabel());
            response.put("detectedAt", savedEvent.getDetectedAt());
            response.put("audioFilePath", savedFilePath);
            response.put("message", "오디오 분석이 완료되었습니다.");
            
            return ResponseEntity.ok(response);

        } catch (FileValidationException e) {
            log.warn("파일 검증 실패 - 사용자: {}, 오류: {}", userEmail, e.getMessage());
            return createErrorResponse(e.getMessage(), 400);
            
        } catch (IOException e) {
            log.error("파일 업로드 실패 - 사용자: {}, 오류: {}", userEmail, e.getMessage(), e);
            return createErrorResponse("파일 업로드 중 오류가 발생했습니다: " + e.getMessage(), 400);
            
        } catch (AiServerException e) {
            log.warn("AI 서버 연결 실패 - 사용자: {}, 오류: {}", userEmail, e.getMessage());
            return createErrorResponse(e.getMessage(), e.getStatusCode());
            
        } catch (Exception e) {
            log.error("예상치 못한 오류 발생 - 사용자: {}, 오류: {}", userEmail, e.getMessage(), e);
            return createErrorResponse("서버 내부 오류가 발생했습니다.", 500);
        }
    }
    
    // ADDED: 파일 검증 메서드
    private void validateUploadedFile(MultipartFile file) throws FileValidationException {
        // 파일 존재 확인
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("업로드할 파일을 선택해주세요.");
        }
        
        // 파일명 확인
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new FileValidationException("올바른 파일명이 필요합니다.");
        }
        
        // 확장자 검증
        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new FileValidationException(
                String.format("지원되지 않는 파일 형식입니다. 허용 형식: %s", 
                    String.join(", ", ALLOWED_EXTENSIONS))
            );
        }
        
        // 파일 크기 검증
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileValidationException(
                String.format("파일 크기가 너무 큽니다. 최대 크기: %.1fMB", 
                    MAX_FILE_SIZE / (1024.0 * 1024.0))
            );
        }
        
        log.debug("파일 검증 통과 - 파일명: {}, 크기: {}KB, 확장자: {}", 
                originalFilename, file.getSize() / 1024, extension);
    }
    
    // ADDED: 파일 확장자 추출 헬퍼 메서드
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDotIndex).toLowerCase();
    }
    
    // CHANGED: 기존 upload 메서드는 analyze로 통합됨 (하위호환성을 위해 유지)
    @PostMapping("/upload")
    @RequireActiveStatus
    public ResponseEntity<Map<String, Object>> uploadAudio(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "locationLabel", required = false, defaultValue = "A공장 1층") String locationLabel,
            @AuthenticationPrincipal CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        // analyze 메서드로 리다이렉트
        return analyzeAudio(file, locationLabel, principal);
    }
    
    // ADDED: AI 서버 호출 메서드 (에러 처리 분리)
    private AiAnalysisResponse callAiServer(Path filePath) throws AiServerException {
        try {
            log.debug("AI 서버 호출 시작: {}", filePath.getFileName());
            
            // MultiValueMap을 직접 생성하여 multipart 데이터 구성
            org.springframework.util.MultiValueMap<String, Object> parts = 
                new org.springframework.util.LinkedMultiValueMap<>();
            parts.add("file", new FileSystemResource(filePath.toFile()));
            
            String responseJson = webClient.post()
                    .uri(aiServerUrl + "/predict")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(parts))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            if (responseJson == null || responseJson.trim().isEmpty()) {
                throw new AiServerException("AI 서버로부터 빈 응답을 받았습니다.", 502);
            }
            
            // JSON 파싱
            AiAnalysisResponse aiResponse = objectMapper.readValue(responseJson, AiAnalysisResponse.class);
            log.debug("AI 분석 완료: label={}, confidence={}", aiResponse.getLabel(), aiResponse.getConfidence());
            
            return aiResponse;
            
        } catch (WebClientRequestException e) {
            // 연결 실패, 타임아웃 등
            log.warn("AI 서버 연결 실패 (요청 오류): {}", e.getMessage());
            throw new AiServerException("AI 분석 서버에 연결할 수 없습니다.", 503);
            
        } catch (WebClientResponseException e) {
            // AI 서버에서 4xx, 5xx 응답
            log.warn("AI 서버 응답 오류: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiServerException("AI 분석 서버에서 오류가 발생했습니다.", 502);
            
        } catch (Exception e) {
            // JSON 파싱 오류 등
            log.warn("AI 서버 응답 처리 실패: {}", e.getMessage());
            throw new AiServerException("AI 분석 결과를 처리할 수 없습니다.", 502);
        }
    }
    
    // ADDED: 에러 응답 생성 헬퍼 메서드
    private ResponseEntity<Map<String, Object>> createErrorResponse(String message, int statusCode) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", message);
        errorResponse.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.status(statusCode).body(errorResponse);
    }
    
    // ADDED: 파일 검증 예외 클래스
    private static class FileValidationException extends Exception {
        public FileValidationException(String message) {
            super(message);
        }
    }
    
    // ADDED: AI 서버 관련 예외 클래스
    private static class AiServerException extends Exception {
        private final int statusCode;
        
        public AiServerException(String message, int statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
        
        public int getStatusCode() {
            return statusCode;
        }
    }
}