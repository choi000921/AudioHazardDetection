package com.example.Alertory.config;

import com.example.Alertory.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.List;

// ADDED: ACTIVE가 아닌 사용자의 API 접근을 차단하는 인터셉터
@Component
public class StatusGuardInterceptor implements HandlerInterceptor {
    
    // ADDED: 차단 대상 경로 패턴
    private final List<String> blockedPatterns = Arrays.asList(
        "/api/settings/",
        "/api/events/",
        "/api/admin/"
    );
    
    // ADDED: 예외 경로 (접근 허용)
    private final List<String> allowedPaths = Arrays.asList(
        "/api/me",
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/signup"
    );
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestURI = request.getRequestURI();
        
        // ADDED: 예외 경로는 통과
        if (allowedPaths.stream().anyMatch(requestURI::startsWith)) {
            return true;
        }
        
        // ADDED: 차단 대상 경로인지 확인
        boolean isBlockedPath = blockedPatterns.stream().anyMatch(requestURI::startsWith);
        if (!isBlockedPath) {
            return true;
        }
        
        // ADDED: 인증된 사용자 확인
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return true; // Spring Security가 처리
        }
        
        // ADDED: 사용자 상태 확인
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            if (user.getStatus() != User.Status.ACTIVE) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Account not active\", \"status\": \"" + user.getStatus() + "\"}");
                return false;
            }
        }
        
        return true;
    }
}