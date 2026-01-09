package com.example.Alertory.service;

import com.example.Alertory.entity.User;
import com.example.Alertory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// CHANGED: DB 기반 인증을 위한 UserService 수정
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // CHANGED: BCryptPasswordEncoder 대신 PasswordEncoder 주입
    
    // ADDED: email을 username으로 사용하는 회원가입 메서드
    public User registerUser(String email, String password, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }
        
        User user = User.builder()
                .username(email) // CHANGED: email을 username으로 사용
                .email(email)
                .password(passwordEncoder.encode(password))
                .name(name)
                .role(User.Role.MANAGER)
                .status(User.Status.PENDING)
                .build();
        
        return userRepository.save(user);
    }
    
    // DEPRECATED: 기존 메서드 유지 (호환성)
    public User registerManager(String username, String email, String password, String name) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .name(name)
                .role(User.Role.MANAGER)
                .status(User.Status.PENDING)
                .build();
        
        return userRepository.save(user);
    }
    
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
    
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
    
    public List<User> getPendingUsers() {
        return userRepository.findByStatus(User.Status.PENDING);
    }
    
    public User approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (user.getStatus() != User.Status.PENDING) {
            throw new IllegalArgumentException("User is not in pending status");
        }
        
        user.setStatus(User.Status.ACTIVE);
        return userRepository.save(user);
    }
    
    public User rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (user.getStatus() != User.Status.PENDING) {
            throw new IllegalArgumentException("User is not in pending status");
        }
        
        user.setStatus(User.Status.REJECTED);
        return userRepository.save(user);
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
    
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found");
        }
        userRepository.deleteById(userId);
    }
    
    public User updateUser(Long userId, com.example.Alertory.dto.UserDto.UpdateRequest request) {
        User user = findById(userId);
        
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getRole() != null) {
            user.setRole(User.Role.valueOf(request.getRole()));
        }
        if (request.getStatus() != null) {
            user.setStatus(User.Status.valueOf(request.getStatus()));
        }
        
        return userRepository.save(user);
    }
}