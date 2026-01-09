package com.example.Alertory.controller;

import com.example.Alertory.entity.Event;
import com.example.Alertory.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    
    private final EventRepository eventRepository;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        // 기본값 설정 (최근 7일)
        LocalDateTime startDateTime;
        LocalDateTime endDateTime;
        
        if (startDate == null || startDate.isEmpty()) {
            startDateTime = LocalDateTime.now().minusDays(7);
        } else {
            startDateTime = LocalDate.parse(startDate).atStartOfDay();
        }
        
        if (endDate == null || endDate.isEmpty()) {
            endDateTime = LocalDateTime.now();
        } else {
            endDateTime = LocalDate.parse(endDate).atTime(23, 59, 59);
        }
        
        List<Event> events = eventRepository.findByDetectedAtBetweenOrderByDetectedAtDesc(startDateTime, endDateTime);
        
        Map<String, Object> analytics = new HashMap<>();
        
        // 요약 통계
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalEvents", events.size());
        summary.put("emergencyEvents", events.stream().mapToLong(e -> 
            (e.getEventType().equals("SCREAM") || e.getEventType().equals("HELP_REQUEST")) ? 1 : 0).sum());
        summary.put("falseAlarms", events.stream().mapToLong(e -> 
            e.getEventType().equals("NORMAL") ? 1 : 0).sum());
        summary.put("responseTime", calculateAverageResponseTime(events));
        analytics.put("summary", summary);
        
        // 시간대별 분석
        List<Map<String, Object>> eventsByHour = new ArrayList<>();
        for (int hour = 0; hour < 24; hour++) {
            final int currentHour = hour;
            long count = events.stream().filter(e -> 
                e.getDetectedAt().getHour() == currentHour).count();
            
            Map<String, Object> hourData = new HashMap<>();
            hourData.put("hour", hour);
            hourData.put("count", count);
            eventsByHour.add(hourData);
        }
        analytics.put("eventsByHour", eventsByHour);
        
        // 위치별 분석
        Map<String, Long> locationCounts = events.stream()
            .collect(Collectors.groupingBy(Event::getLocationLabel, Collectors.counting()));
        
        List<Map<String, Object>> eventsByLocation = locationCounts.entrySet().stream()
            .map(entry -> {
                Map<String, Object> locationData = new HashMap<>();
                locationData.put("location", entry.getKey());
                locationData.put("count", entry.getValue());
                locationData.put("percentage", Math.round((entry.getValue() * 100.0 / events.size()) * 10.0) / 10.0);
                return locationData;
            })
            .sorted((a, b) -> Long.compare((Long) b.get("count"), (Long) a.get("count")))
            .collect(Collectors.toList());
        analytics.put("eventsByLocation", eventsByLocation);
        
        // 유형별 분석
        Map<String, Long> typeCounts = events.stream()
            .collect(Collectors.groupingBy(Event::getEventType, Collectors.counting()));
        
        List<Map<String, Object>> eventsByType = typeCounts.entrySet().stream()
            .map(entry -> {
                Map<String, Object> typeData = new HashMap<>();
                typeData.put("type", entry.getKey());
                typeData.put("count", entry.getValue());
                typeData.put("percentage", Math.round((entry.getValue() * 100.0 / events.size()) * 10.0) / 10.0);
                return typeData;
            })
            .sorted((a, b) -> Long.compare((Long) b.get("count"), (Long) a.get("count")))
            .collect(Collectors.toList());
        analytics.put("eventsByType", eventsByType);
        
        // 주간 트렌드
        List<Map<String, Object>> weeklyTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime date = LocalDateTime.now().minusDays(i);
            LocalDateTime dayStart = date.toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            
            long dayEvents = events.stream().filter(e -> 
                e.getDetectedAt().isAfter(dayStart) && e.getDetectedAt().isBefore(dayEnd)).count();
            
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toLocalDate().toString());
            dayData.put("events", dayEvents);
            weeklyTrend.add(dayData);
        }
        analytics.put("weeklyTrend", weeklyTrend);
        
        return ResponseEntity.ok(analytics);
    }
    
    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportReport(
            @RequestParam String format,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        // 실제로는 PDF/Excel 생성 로직 구현
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", format.toUpperCase() + " 리포트가 생성되었습니다.",
            "downloadUrl", "/api/analytics/download/" + format + "/" + System.currentTimeMillis()
        ));
    }
    
    private double calculateAverageResponseTime(List<Event> events) {
        List<Event> acknowledgedEvents = events.stream()
            .filter(e -> e.getAcknowledgedAt() != null)
            .collect(Collectors.toList());
        
        if (acknowledgedEvents.isEmpty()) {
            return 0.0;
        }
        
        double totalMinutes = acknowledgedEvents.stream()
            .mapToDouble(e -> {
                long seconds = java.time.Duration.between(e.getDetectedAt(), e.getAcknowledgedAt()).getSeconds();
                return seconds / 60.0;
            })
            .sum();
        
        return Math.round((totalMinutes / acknowledgedEvents.size()) * 10.0) / 10.0;
    }
}