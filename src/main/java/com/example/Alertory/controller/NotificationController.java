package com.example.Alertory.controller;

import com.example.Alertory.entity.Notification;
import com.example.Alertory.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    
    private final NotificationService notificationService;
    
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications() {
        List<Notification> notifications = notificationService.getRecentNotifications();
        return ResponseEntity.ok(notifications);
    }
    
    @PostMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PostMapping("/test-emergency")
    public ResponseEntity<Map<String, Object>> testEmergencyAlert() {
        notificationService.createSystemAlert(
            "🚨 테스트 긴급 알림", 
            "이것은 테스트 긴급 알림입니다. 시스템이 정상 작동하고 있습니다."
        );
        return ResponseEntity.ok(Map.of("success", true, "message", "테스트 알림이 발송되었습니다."));
    }
    
    @PostMapping("/call-119")
    public ResponseEntity<Map<String, Object>> call119(@RequestBody Map<String, Object> request) {
        String location = (String) request.get("location");
        String eventType = (String) request.get("eventType");
        
        // 실제로는 119 신고 API 연동
        notificationService.createSystemAlert(
            "🚑 119 신고 완료", 
            String.format("위치: %s, 상황: %s - 119에 신고가 접수되었습니다.", location, eventType)
        );
        
        return ResponseEntity.ok(Map.of(
            "success", true, 
            "message", "119 신고가 완료되었습니다.",
            "reportNumber", "ALERT-" + System.currentTimeMillis()
        ));
    }
}