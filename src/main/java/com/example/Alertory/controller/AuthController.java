package com.example.Alertory.controller;

import com.example.Alertory.dto.UserDto;
import com.example.Alertory.entity.User;
import com.example.Alertory.service.CustomUserDetailsService;
import com.example.Alertory.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

// CHANGED: DB 기반 인증을 위한 AuthController 수정
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final UserService userService;
    
    // CHANGED: 회원가입 (email을 username으로 사용)
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody UserDto.SignupRequest request) {
        try {
            // CHANGED: email을 username으로 사용하도록 수정
            User user = userService.registerUser(
                request.getEmail(), 
                request.getPassword(), 
                request.getName()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.");
            response.put("user", UserDto.Response.from(user));
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // ADDED: 현재 로그인한 사용자 정보 조회
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "인증되지 않은 사용자입니다.");
            return ResponseEntity.status(401).body(errorResponse);
        }
        
        CustomUserDetailsService.CustomUserPrincipal principal = 
            (CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", UserDto.Response.from(user));
        
        return ResponseEntity.ok(response);
    }
}