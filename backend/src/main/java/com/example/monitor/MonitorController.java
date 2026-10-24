package com.example.monitor;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class MonitorController {

    private final HealthHistoryRepository historyRepository;

    public MonitorController(HealthHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    @GetMapping("/status")
    @Transactional
    public Map<String, Object> status(HttpServletRequest request) {
        Instant started = Instant.now();
        Map<String, Object> response = Map.of(
                "status", "UP",
                "message", "Java API is running",
                "application", "java-health-monitor",
                "port", 8080);
        saveHistory("api-status", "UP", 200, started, "Application responded successfully");
        return response;
    }

    @GetMapping("/health-history")
    @Transactional(readOnly = true)
    public List<HealthHistory> history() {
        return historyRepository.findTop20ByOrderByCheckedAtDesc();
    }

    @GetMapping("/diagnostics/database")
    @Transactional
    public ResponseEntity<Map<String, Object>> database() {
        Instant started = Instant.now();
        try {
            long count = historyRepository.count();
            saveHistory("postgresql", "UP", 200, started, "Database query succeeded; records=" + count);
            return ResponseEntity.ok(Map.of(
                    "status", "UP",
                    "message", "PostgreSQL is reachable",
                    "recordCount", count,
                    "responseTimeMs", elapsedMs(started)));
        } catch (RuntimeException exception) {
            saveHistory("postgresql", "DOWN", 503, started, "Database query failed");
            return ResponseEntity.status(503).body(Map.of(
                    "status", "DOWN",
                    "message", "PostgreSQL is unavailable",
                    "responseTimeMs", elapsedMs(started)));
        }
    }

    private void saveHistory(String name, String status, int httpStatus, Instant started, String detail) {
        historyRepository.save(new HealthHistory(name, status, httpStatus, elapsedMs(started), detail));
    }

    private long elapsedMs(Instant started) {
        return Duration.between(started, Instant.now()).toMillis();
    }
}
