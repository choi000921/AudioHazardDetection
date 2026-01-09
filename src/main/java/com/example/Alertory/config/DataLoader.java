package com.example.Alertory.config;

import com.example.Alertory.entity.Event;
import com.example.Alertory.entity.Settings;
import com.example.Alertory.entity.User;
import com.example.Alertory.repository.EventRepository;
import com.example.Alertory.repository.SettingsRepository;
import com.example.Alertory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

// CHANGED: 운영 환경에서 DataLoader 실행 제어
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "app.seed.enabled", 
    havingValue = "true", 
    matchIfMissing = true
)
public class DataLoader implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final SettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== DataLoader Started (app.seed.enabled=true) ===");
        
        // CHANGED: email을 username으로 사용하는 관리자 계정 생성
        if (!userRepository.existsByEmail("admin@alertory.com")) {
            User admin = User.builder()
                    .username("admin@alertory.com") // CHANGED: email을 username으로 사용
                    .email("admin@alertory.com")
                    .password(passwordEncoder.encode("1234"))
                    .name("System Admin")
                    .role(User.Role.ADMIN)
                    .status(User.Status.ACTIVE)
                    .build();
            userRepository.save(admin);
            System.out.println("=== Super Admin Account Created ===");
            System.out.println("Email: admin@alertory.com");
            System.out.println("Password: 1234");
            System.out.println("Status: ACTIVE");
        }
        
        // CHANGED: 테스트용 일반 사용자 계정 생성 (ACTIVE 상태)
        if (!userRepository.existsByEmail("user@test.com")) {
            User testUser = User.builder()
                    .username("user@test.com")
                    .email("user@test.com")
                    .password(passwordEncoder.encode("1234"))
                    .name("Test User")
                    .role(User.Role.MANAGER)
                    .status(User.Status.ACTIVE)
                    .build();
            userRepository.save(testUser);
            System.out.println("=== Test User Account Created ===");
            System.out.println("Email: user@test.com");
            System.out.println("Password: 1234");
            System.out.println("Status: ACTIVE");
        }
        
        // ADDED: 테스트용 PENDING 상태 사용자 계정 생성
        if (!userRepository.existsByEmail("pending@test.com")) {
            User pendingUser = User.builder()
                    .username("pending@test.com")
                    .email("pending@test.com")
                    .password(passwordEncoder.encode("1234"))
                    .name("Pending User")
                    .role(User.Role.MANAGER)
                    .status(User.Status.PENDING)
                    .build();
            userRepository.save(pendingUser);
            System.out.println("=== Pending User Account Created ===");
            System.out.println("Email: pending@test.com");
            System.out.println("Password: 1234");
            System.out.println("Status: PENDING (로그인 가능, 서비스 접근 제한)");
        }
        
        // 기본 설정 생성
        if (settingsRepository.count() == 0) {
            Settings defaultSettings = Settings.builder().build();
            settingsRepository.save(defaultSettings);
            System.out.println("=== Default Settings Created ===");
        }
        
        // 샘플 이벤트 생성
        if (eventRepository.count() == 0) {
            String[] locations = {"A공장 1층", "A공장 2층", "A공장 3층", "B공장 1층", "B공장 2층", "B공장 3층"};
            
            for (int i = 1; i <= 15; i++) {
                Event event = Event.builder()
                        .eventType(i % 3 == 0 ? "SCREAM" : (i % 2 == 0 ? "NOISE" : "NORMAL"))
                        .locationLabel(locations[i % locations.length])
                        .confidence(0.7 + (i % 3) * 0.1)
                        .status(i % 4 == 0 ? Event.EventStatus.ACKNOWLEDGED : Event.EventStatus.NEW)
                        .detectedAt(LocalDateTime.now().minusHours(i))
                        .build();
                eventRepository.save(event);
            }
            System.out.println("=== Sample Events Created ===");
        }
        
        System.out.println("=== DataLoader Completed ===");
    }
}