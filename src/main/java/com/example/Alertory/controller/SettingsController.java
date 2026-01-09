package com.example.Alertory.controller;

import com.example.Alertory.annotation.RequireActiveStatus;
import com.example.Alertory.entity.Settings;
import com.example.Alertory.repository.SettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

// CHANGED: ACTIVE 상태 사용자만 설정 관리 가능
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@RequireActiveStatus
public class SettingsController {
    
    private final SettingsRepository settingsRepository;
    
    @GetMapping("/me")
    public ResponseEntity<Settings> getSettings() {
        // 첫 번째 설정을 가져오거나 기본값 생성
        Optional<Settings> settingsOpt = settingsRepository.findAll().stream().findFirst();
        if (settingsOpt.isPresent()) {
            return ResponseEntity.ok(settingsOpt.get());
        } else {
            // 기본 설정 생성
            Settings defaultSettings = Settings.builder().build();
            Settings saved = settingsRepository.save(defaultSettings);
            return ResponseEntity.ok(saved);
        }
    }
    
    @PutMapping("/me")
    public ResponseEntity<Settings> updateSettings(@RequestBody Settings settings) {
        // ID가 없으면 첫 번째 설정을 업데이트하거나 새로 생성
        if (settings.getId() == null) {
            Optional<Settings> existingOpt = settingsRepository.findAll().stream().findFirst();
            if (existingOpt.isPresent()) {
                settings.setId(existingOpt.get().getId());
            }
        }
        
        Settings saved = settingsRepository.save(settings);
        return ResponseEntity.ok(saved);
    }
}