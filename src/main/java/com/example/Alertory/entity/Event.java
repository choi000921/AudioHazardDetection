package com.example.Alertory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String eventType; // SCREAM, NOISE, etc.
    
    @Column(nullable = false)
    private String locationLabel; // "A구역 3층"
    
    @Column(nullable = false)
    private Double confidence; // 0.0 ~ 1.0
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status;
    
    private String audioFilePath;
    
    @Column(name = "detected_at")
    private LocalDateTime detectedAt;
    
    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;
    
    @PrePersist
    protected void onCreate() {
        if (detectedAt == null) {
            detectedAt = LocalDateTime.now();
        }
    }
    
    public enum EventStatus {
        NEW, ACKNOWLEDGED, RESOLVED
    }
}