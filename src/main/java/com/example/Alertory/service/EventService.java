package com.example.Alertory.service;

import com.example.Alertory.dto.EventDto;
import com.example.Alertory.entity.Event;
import com.example.Alertory.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {
    
    private final EventRepository eventRepository;
    
    // 허용된 이벤트 타입 목록
    private static final List<String> VALID_EVENT_TYPES = Arrays.asList(
        "SCREAM", "HELP_REQUEST", "NOISE", "NORMAL"
    );
    
    // 최소/최대 신뢰도 범위
    private static final double MIN_CONFIDENCE = 0.0;
    private static final double MAX_CONFIDENCE = 1.0;
    
    /**
     * 이벤트 생성
     */
    public EventDto createEvent(EventDto.CreateRequest request) {
        // 검증
        validateEventType(request.getEventType());
        validateLocationLabel(request.getLocationLabel());
        validateConfidence(request.getConfidence());
        
        // Event 엔티티 생성
        Event event = Event.builder()
                .eventType(request.getEventType())
                .locationLabel(request.getLocationLabel())
                .confidence(request.getConfidence())
                .status(Event.EventStatus.NEW)
                .detectedAt(LocalDateTime.now())
                .build();
        
        // 저장
        Event savedEvent = eventRepository.save(event);
        
        // DTO로 변환하여 반환
        return EventDto.fromEntity(savedEvent);
    }
    
    /**
     * 이벤트 목록 조회 (필터링 및 페이징)
     */
    @Transactional(readOnly = true)
    public Page<EventDto> getEvents(
            String eventType,
            Event.EventStatus status,
            String location,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {
        
        Page<Event> events = eventRepository.findEventsWithFilters(
                eventType, status, location, startDate, endDate, pageable);
        
        return events.map(EventDto::fromEntity);
    }
    
    /**
     * 이벤트 상세 조회
     */
    @Transactional(readOnly = true)
    public EventDto getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with id: " + id));
        
        return EventDto.fromEntity(event);
    }
    
    /**
     * 이벤트 확인 처리
     */
    public EventDto acknowledgeEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with id: " + id));
        
        // 이미 확인된 경우 처리하지 않음
        if (event.getStatus() == Event.EventStatus.ACKNOWLEDGED) {
            return EventDto.fromEntity(event);
        }
        
        event.setStatus(Event.EventStatus.ACKNOWLEDGED);
        event.setAcknowledgedAt(LocalDateTime.now());
        
        Event savedEvent = eventRepository.save(event);
        
        return EventDto.fromEntity(savedEvent);
    }
    
    /**
     * 이벤트 타입 검증
     */
    private void validateEventType(String eventType) {
        if (eventType == null || eventType.trim().isEmpty()) {
            throw new IllegalArgumentException("eventType is required");
        }
        
        if (!VALID_EVENT_TYPES.contains(eventType)) {
            throw new IllegalArgumentException(
                "Invalid eventType: " + eventType + ". Valid types are: " + VALID_EVENT_TYPES);
        }
    }
    
    /**
     * 위치 라벨 검증
     */
    private void validateLocationLabel(String locationLabel) {
        if (locationLabel == null || locationLabel.trim().isEmpty()) {
            throw new IllegalArgumentException("locationLabel is required");
        }
    }
    
    /**
     * 신뢰도 검증
     */
    private void validateConfidence(Double confidence) {
        if (confidence == null) {
            throw new IllegalArgumentException("confidence is required");
        }
        
        if (confidence < MIN_CONFIDENCE || confidence > MAX_CONFIDENCE) {
            throw new IllegalArgumentException(
                "confidence must be between " + MIN_CONFIDENCE + " and " + MAX_CONFIDENCE);
        }
    }
}

