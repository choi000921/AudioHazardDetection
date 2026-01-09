package com.example.Alertory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivityLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String action; // LOGIN, LOGOUT, SETTINGS_CHANGE, EVENT_ACK, etc.
    
    @Column(length = 1000)
    private String details; // 상세 정보 (JSON 형태)
    
    @Column(nullable = false)
    private String ipAddress;
    
    @Column(nullable = false)
    private String userAgent;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}