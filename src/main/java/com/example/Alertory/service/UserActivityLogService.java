package com.example.Alertory.service;

import com.example.Alertory.entity.UserActivityLog;
import com.example.Alertory.repository.UserActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;

@Service
@RequiredArgsConstructor
@Transactional
public class UserActivityLogService {
    
    private final UserActivityLogRepository activityLogRepository;
    
    public void logActivity(Long userId, String username, String action, String details, HttpServletRequest request) {
        UserActivityLog log = UserActivityLog.builder()
                .userId(userId)
                .username(username)
                .action(action)
                .details(details)
                .ipAddress(getClientIpAddress(request))
                .userAgent(request.getHeader("User-Agent"))
                .build();
        
        activityLogRepository.save(log);
    }
    
    public void logLogin(Long userId, String username, HttpServletRequest request) {
        logActivity(userId, username, "LOGIN", "사용자 로그인", request);
    }
    
    public void logLogout(Long userId, String username, HttpServletRequest request) {
        logActivity(userId, username, "LOGOUT", "사용자 로그아웃", request);
    }
    
    public void logSettingsChange(Long userId, String username, String settingName, HttpServletRequest request) {
        logActivity(userId, username, "SETTINGS_CHANGE", 
                   String.format("설정 변경: %s", settingName), request);
    }
    
    public void logEventAcknowledge(Long userId, String username, Long eventId, HttpServletRequest request) {
        logActivity(userId, username, "EVENT_ACK", 
                   String.format("이벤트 확인: #%d", eventId), request);
    }
    
    public void logUserManagement(Long adminId, String adminUsername, String action, String targetUser, HttpServletRequest request) {
        logActivity(adminId, adminUsername, "USER_MANAGEMENT", 
                   String.format("%s: %s", action, targetUser), request);
    }
    
    public Page<UserActivityLog> getAllLogs(Pageable pageable) {
        return activityLogRepository.findByOrderByCreatedAtDesc(pageable);
    }
    
    public Page<UserActivityLog> getUserLogs(Long userId, Pageable pageable) {
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}