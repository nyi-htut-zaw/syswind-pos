package com.syswind.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> resp = new HashMap<>();
        try {
            String dbTime = jdbcTemplate.queryForObject("SELECT NOW()", String.class);
            resp.put("status", "UP");
            resp.put("service", "Syswind Spring Boot Backend API");
            resp.put("database", "PostgreSQL Connected (" + dbTime + ")");
            resp.put("version", "2.0.0-spring-enterprise");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("status", "DOWN");
            resp.put("error", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }
}
