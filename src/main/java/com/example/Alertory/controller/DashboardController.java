package com.example.Alertory.controller;

import com.example.Alertory.entity.Event;
import com.example.Alertory.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {
    
    private final EventRepository eventRepository;
    
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @RequestParam(required = false) String location) {
        Map<String, Object> dashboard = new HashMap<>();
        
        // 최근 이벤트 10개 (위치 필터링 적용)
        List<Event> recentEvents;
        if (location != null && !location.isEmpty()) {
            recentEvents = eventRepository.findAll().stream()
                .filter(e -> e.getLocationLabel().equals(location))
                .sorted((e1, e2) -> e2.getDetectedAt().compareTo(e1.getDetectedAt()))
                .limit(10)
                .toList();
        } else {
            recentEvents = eventRepository.findTop10ByOrderByDetectedAtDesc();
        }
        dashboard.put("recentEvents", recentEvents);
        
        // 통계 정보 (위치 필터링 적용)
        List<Event> filteredEvents;
        if (location != null && !location.isEmpty()) {
            filteredEvents = eventRepository.findAll().stream()
                .filter(e -> e.getLocationLabel().equals(location))
                .toList();
        } else {
            filteredEvents = eventRepository.findAll();
        }
        
        long totalEvents = filteredEvents.size();
        long newEvents = filteredEvents.stream()
            .mapToLong(e -> e.getStatus() == Event.EventStatus.NEW ? 1 : 0)
            .sum();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEvents", totalEvents);
        stats.put("newEvents", newEvents);
        stats.put("acknowledgedEvents", totalEvents - newEvents);
        
        dashboard.put("stats", stats);
        
        return ResponseEntity.ok(dashboard);
    }
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("aiStatus", "ACTIVE");
        status.put("detectionEnabled", true);
        status.put("lastUpdate", System.currentTimeMillis());
        status.put("version", "1.0.0");
        
        return ResponseEntity.ok(status);
    }
}