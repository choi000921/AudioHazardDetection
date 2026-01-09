package com.example.Alertory.repository;

import com.example.Alertory.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// ADDED: User repository for database operations
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    // ADDED: username으로 사용자 조회 (로그인용)
    Optional<User> findByUsername(String username);
    
    // ADDED: 승인 대기 중인 사용자 조회 (ADMIN용)
    List<User> findByStatus(User.Status status);
    
    boolean existsByEmail(String email);
    
    boolean existsByUsername(String username);
}