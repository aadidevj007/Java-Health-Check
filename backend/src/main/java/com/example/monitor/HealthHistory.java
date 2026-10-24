package com.example.monitor;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class HealthHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String checkName;
    private String status;
    private Integer httpStatus;
    private Long responseTimeMs;
    private String detail;
    private Instant checkedAt;

    protected HealthHistory() {
    }

    public HealthHistory(String checkName, String status, Integer httpStatus, Long responseTimeMs, String detail) {
        this.checkName = checkName;
        this.status = status;
        this.httpStatus = httpStatus;
        this.responseTimeMs = responseTimeMs;
        this.detail = detail;
        this.checkedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getCheckName() {
        return checkName;
    }

    public String getStatus() {
        return status;
    }

    public Integer getHttpStatus() {
        return httpStatus;
    }

    public Long getResponseTimeMs() {
        return responseTimeMs;
    }

    public String getDetail() {
        return detail;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }
}
