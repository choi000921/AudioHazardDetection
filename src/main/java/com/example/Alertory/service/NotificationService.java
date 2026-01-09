package com.example.Alertory.service;

import com.example.Alertory.entity.Event;
import com.example.Alertory.entity.Notification;
import com.example.Alertory.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    // 긴급 이벤트 알림 생성
    public Notification createEmergencyAlert(Event event) {
        String title = "🚨 긴급 상황 감지!";
        String message = String.format(
            "%s에서 %s이(가) 감지되었습니다. (신뢰도: %.1f%%)",
            event.getLocationLabel(),
            getEventTypeText(event.getEventType()),
            event.getConfidence() // 이미 0-100 범위
        );
        
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(Notification.NotificationType.EMERGENCY_ALERT)
                .status(Notification.NotificationStatus.SENT)
                .eventId(event.getId())
                .userId(null) // 전체 알림
                .build();
        
        return notificationRepository.save(notification);
    }
    
    // 일반 이벤트 알림 생성
    public Notification createEventAlert(Event event) {
        String title = "이벤트 감지";
        String message = String.format(
            "%s에서 %s이(가) 감지되었습니다.",
            event.getLocationLabel(),
            getEventTypeText(event.getEventType())
        );
        
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(Notification.NotificationType.EVENT_DETECTED)
                .status(Notification.NotificationStatus.SENT)
                .eventId(event.getId())
                .userId(null)
                .build();
        
        return notificationRepository.save(notification);
    }
    
    // 시스템 알림 생성
    public Notification createSystemAlert(String title, String message) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(Notification.NotificationType.SYSTEM_ALERT)
                .status(Notification.NotificationStatus.SENT)
                .userId(null)
                .build();
        
        return notificationRepository.save(notification);
    }
    
    // 알림 읽음 처리
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setStatus(Notification.NotificationStatus.READ);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        });
    }
    
    // 최근 알림 조회
    public List<Notification> getRecentNotifications() {
        return notificationRepository.findTop20ByOrderBySentAtDesc();
    }
    
    private String getEventTypeText(String eventType) {
        return switch (eventType) {
            case "SCREAM" -> "비명";
            case "NOISE" -> "이상 소음";
            case "HELP_REQUEST" -> "도움 요청";
            default -> eventType;
        };
    }
}