package com.example.Alertory.controller;

import com.example.Alertory.dto.UserDto;
import com.example.Alertory.entity.User;
import com.example.Alertory.entity.UserActivityLog;
import com.example.Alertory.service.UserService;
import com.example.Alertory.service.UserActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // ADDED: ADMIN 권한 필요
public class AdminController {
    
    private final UserService userService;
    private final UserActivityLogService activityLogService;
    
    // 모든 사용자 조회
    @GetMapping("/users")
    public ResponseEntity<List<UserDto.Response>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserDto.Response> response = users.stream()
                .map(UserDto.Response::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    // 승인 대기 중인 사용자 목록 조회
    @GetMapping("/users/pending")
    public ResponseEntity<List<UserDto.Response>> getPendingUsers() {
        List<User> pendingUsers = userService.getPendingUsers();
        List<UserDto.Response> response = pendingUsers.stream()
                .map(UserDto.Response::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    // 사용자 승인
    @PostMapping("/users/{id}/approve")
    public ResponseEntity<UserDto.Response> approveUser(@PathVariable Long id, HttpServletRequest request) {
        try {
            User approvedUser = userService.approveUser(id);
            activityLogService.logUserManagement(1L, "admin", "사용자 승인", approvedUser.getUsername(), request);
            return ResponseEntity.ok(UserDto.Response.from(approvedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
    
    // 사용자 거절
    @PostMapping("/users/{id}/reject")
    public ResponseEntity<UserDto.Response> rejectUser(@PathVariable Long id, HttpServletRequest request) {
        try {
            User rejectedUser = userService.rejectUser(id);
            activityLogService.logUserManagement(1L, "admin", "사용자 거절", rejectedUser.getUsername(), request);
            return ResponseEntity.ok(UserDto.Response.from(rejectedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
    
    // 사용자 삭제
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        try {
            User user = userService.findById(id);
            userService.deleteUser(id);
            activityLogService.logUserManagement(1L, "admin", "사용자 삭제", user.getUsername(), request);
            return ResponseEntity.ok(Map.of("success", true, "message", "사용자가 삭제되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    // 사용자 정보 수정
    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto.Response> updateUser(@PathVariable Long id, @RequestBody UserDto.UpdateRequest request, HttpServletRequest httpRequest) {
        try {
            User updatedUser = userService.updateUser(id, request);
            activityLogService.logUserManagement(1L, "admin", "사용자 정보 수정", updatedUser.getUsername(), httpRequest);
            return ResponseEntity.ok(UserDto.Response.from(updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
    
    // 사용자 활동 로그 조회
    @GetMapping("/activity-logs")
    public ResponseEntity<Page<UserActivityLog>> getActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserActivityLog> logs = activityLogService.getAllLogs(pageable);
        return ResponseEntity.ok(logs);
    }
    
    // 특정 사용자 활동 로그 조회
    @GetMapping("/users/{userId}/activity-logs")
    public ResponseEntity<Page<UserActivityLog>> getUserActivityLogs(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserActivityLog> logs = activityLogService.getUserLogs(userId, pageable);
        return ResponseEntity.ok(logs);
    }
}