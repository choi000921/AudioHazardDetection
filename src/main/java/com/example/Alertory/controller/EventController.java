package com.example.Alertory.controller;

import com.example.Alertory.annotation.RequireActiveStatus;
import com.example.Alertory.dto.EventDto;
import com.example.Alertory.entity.Event;
import com.example.Alertory.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

// CHANGED: ACTIVE 상태 사용자만 이벤트 관련 기능 사용 가능
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@RequireActiveStatus
public class EventController {
    
    private final EventService eventService;
    
    /**
     * 이벤트 생성
     * POST /api/events
     */
    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody EventDto.CreateRequest request) {
        try {
            EventDto createdEvent = eventService.createEvent(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
        } catch (IllegalArgumentException e) {
            EventDto.ErrorResponse errorResponse = new EventDto.ErrorResponse(
                "Validation failed",
                e.getMessage(),
                extractFieldName(e.getMessage())
            );
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            EventDto.ErrorResponse errorResponse = new EventDto.ErrorResponse(
                "Internal server error",
                "Failed to create event: " + e.getMessage(),
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * 이벤트 목록 조회 (필터링 및 페이징)
     * GET /api/events
     */
    @GetMapping
    public ResponseEntity<Page<EventDto>> getEvents(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) Event.EventStatus status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        // size 최대값 제한
        if (size > 100) {
            size = 100;
        }
        
        Pageable pageable = PageRequest.of(page, size);
        Page<EventDto> events = eventService.getEvents(
                eventType, status, location, startDate, endDate, pageable);
        
        return ResponseEntity.ok(events);
    }
    
    /**
     * 이벤트 상세 조회
     * GET /api/events/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getEvent(@PathVariable Long id) {
        try {
            EventDto event = eventService.getEventById(id);
            return ResponseEntity.ok(event);
        } catch (IllegalArgumentException e) {
            EventDto.ErrorResponse errorResponse = new EventDto.ErrorResponse(
                "Event not found",
                e.getMessage(),
                "id"
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    /**
     * 이벤트 확인 처리
     * POST /api/events/{id}/acknowledge
     */
    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<?> acknowledgeEvent(@PathVariable Long id) {
        try {
            EventDto acknowledgedEvent = eventService.acknowledgeEvent(id);
            return ResponseEntity.ok(acknowledgedEvent);
        } catch (IllegalArgumentException e) {
            EventDto.ErrorResponse errorResponse = new EventDto.ErrorResponse(
                "Event not found",
                e.getMessage(),
                "id"
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    /**
     * 오디오 파일 다운로드
     * GET /api/events/{id}/audio
     */
    @GetMapping("/{id}/audio")
    public ResponseEntity<Resource> downloadAudio(@PathVariable Long id) {
        try {
            EventDto eventDto = eventService.getEventById(id);
            
            if (eventDto.getAudioFilePath() == null || eventDto.getAudioFilePath().isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = Paths.get(eventDto.getAudioFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, 
                               "attachment; filename=\"event_" + id + "_audio.wav\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 에러 메시지에서 필드명 추출 (헬퍼 메서드)
     */
    private String extractFieldName(String message) {
        if (message == null) {
            return null;
        }
        
        // 메시지에서 필드명 추출 시도
        if (message.contains("eventType")) {
            return "eventType";
        } else if (message.contains("locationLabel")) {
            return "locationLabel";
        } else if (message.contains("confidence")) {
            return "confidence";
        }
        
        return null;
    }
}