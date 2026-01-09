package com.example.Alertory.repository;

import com.example.Alertory.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserIdOrderBySentAtDesc(Long userId);
    
    List<Notification> findByUserIdIsNullOrderBySentAtDesc(); // 전체 알림
    
    List<Notification> findTop20ByOrderBySentAtDesc();
    
    long countByUserIdAndStatus(Long userId, Notification.NotificationStatus status);
}