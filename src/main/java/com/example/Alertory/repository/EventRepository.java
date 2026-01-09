package com.example.Alertory.repository;

import com.example.Alertory.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    // 최근 이벤트 조회
    List<Event> findTop10ByOrderByDetectedAtDesc();
    
    // 날짜 범위로 이벤트 조회
    List<Event> findByDetectedAtBetweenOrderByDetectedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // 필터링된 이벤트 조회
    @Query("SELECT e FROM Event e WHERE " +
           "(:eventType IS NULL OR e.eventType = :eventType) AND " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:location IS NULL OR e.locationLabel = :location) AND " +
           "(:startDate IS NULL OR e.detectedAt >= :startDate) AND " +
           "(:endDate IS NULL OR e.detectedAt <= :endDate) " +
           "ORDER BY e.detectedAt DESC")
    Page<Event> findEventsWithFilters(
        @Param("eventType") String eventType,
        @Param("status") Event.EventStatus status,
        @Param("location") String location,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
}