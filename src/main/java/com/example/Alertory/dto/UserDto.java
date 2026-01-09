package com.example.Alertory.dto;

import com.example.Alertory.entity.User;
import lombok.Data;
import lombok.Builder;

// CHANGED: DB 기반 인증을 위한 UserDto 수정
public class UserDto {
    
    @Data
    @Builder
    public static class Response {
        private Long id;
        private String username;
        private String email;
        private String name;
        private String role;
        private String status;
        
        public static Response from(User user) {
            return Response.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole().name())
                    .status(user.getStatus().name())
                    .build();
        }
    }
    
    // CHANGED: email을 username으로 사용하는 회원가입 요청
    @Data
    public static class SignupRequest {
        private String email;    // CHANGED: email을 주요 식별자로 사용
        private String password;
        private String name;
        
        // DEPRECATED: 기존 필드 유지 (호환성)
        private String username;
    }
    
    // CHANGED: email을 username으로 사용하는 로그인 요청
    @Data
    public static class LoginRequest {
        private String email;    // CHANGED: email을 username으로 사용
        private String password;
        
        // DEPRECATED: 기존 필드 유지 (호환성)
        private String username;
    }
    
    @Data
    public static class UpdateRequest {
        private String name;
        private String email;
        private String role;
        private String status;
    }
}