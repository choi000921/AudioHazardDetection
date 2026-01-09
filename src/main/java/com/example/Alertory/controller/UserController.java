package com.example.Alertory.controller;

import com.example.Alertory.dto.UserDto;
import com.example.Alertory.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

// ADDED: User controller for user info
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {
    
    // ADDED: 현재 로그인한 사용자 정보 조회 (status와 무관하게 접근 허용)
    @GetMapping("/me")
    public ResponseEntity<UserDto.Response> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(UserDto.Response.from(user));
    }
}