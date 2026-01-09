package com.example.Alertory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false, length = 1000)
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;
    
    private Long eventId; // 관련 이벤트 ID
    
    private Long userId; // 수신자 ID (null이면 전체)
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
    }
    
    public enum NotificationType {
        EMERGENCY_ALERT, // 긴급 알림
        EVENT_DETECTED, // 이벤트 감지
        SYSTEM_ALERT, // 시스템 알림
        USER_ACTION // 사용자 액션
    }
    
    public enum NotificationStatus {
        SENT, READ, DISMISSED
    }
}