package com.example.Alertory.dto;

import com.example.Alertory.entity.Event;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventDto {
    
    private Long id;
    private String eventType;
    private String locationLabel;
    private Double confidence;
    private Event.EventStatus status;
    private String audioFilePath;
    private LocalDateTime detectedAt;
    private LocalDateTime acknowledgedAt;
    
    // Event 엔티티를 DTO로 변환
    public static EventDto fromEntity(Event event) {
        return EventDto.builder()
                .id(event.getId())
                .eventType(event.getEventType())
                .locationLabel(event.getLocationLabel())
                .confidence(event.getConfidence())
                .status(event.getStatus())
                .audioFilePath(event.getAudioFilePath())
                .detectedAt(event.getDetectedAt())
                .acknowledgedAt(event.getAcknowledgedAt())
                .build();
    }
    
    // 요청용 DTO (이벤트 생성 시)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String eventType;
        private String locationLabel;
        private Double confidence;
    }
    
    // 에러 응답용 DTO
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorResponse {
        private String error;
        private String message;
        private String field;
    }
}

