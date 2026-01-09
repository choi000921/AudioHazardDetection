package com.example.Alertory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalTime;

@Entity
@Table(name = "settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Settings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @Builder.Default
    private Double noiseThreshold = 0.7;
    
    @Column(nullable = false)
    @Builder.Default
    private Double screamThreshold = 0.8;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean alertEnabled = true;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DetectMode detectMode = DetectMode.ALWAYS;
    
    @Builder.Default
    private LocalTime activeStart = LocalTime.of(9, 0); // 09:00
    
    @Builder.Default
    private LocalTime activeEnd = LocalTime.of(18, 0); // 18:00
    
    @Column(nullable = false)
    @Builder.Default
    private Integer retentionDays = 30;
    
    public enum DetectMode {
        ALWAYS, SCHEDULED
    }
}