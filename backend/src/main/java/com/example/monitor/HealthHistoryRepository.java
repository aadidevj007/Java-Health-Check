package com.example.monitor;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthHistoryRepository extends JpaRepository<HealthHistory, Long> {

    List<HealthHistory> findTop20ByOrderByCheckedAtDesc();
}
