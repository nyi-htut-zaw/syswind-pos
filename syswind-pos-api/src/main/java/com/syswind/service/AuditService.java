package com.syswind.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public void logAudit(String userId, UUID organizationId, String action, String entityName, String entityId, Map<String, Object> details, String ipAddress) {
        try {
            String detailsJson = details != null ? objectMapper.writeValueAsString(details) : null;
            UUID userUuid = (userId != null && !userId.isBlank()) ? UUID.fromString(userId) : null;

            // If organizationId is not explicitly passed, attempt to resolve from user
            if (organizationId == null && userUuid != null) {
                try {
                    String orgSql = "SELECT organization_id FROM users WHERE id = ?";
                    List<UUID> orgs = jdbcTemplate.query(orgSql, (rs, rowNum) -> (UUID) rs.getObject("organization_id"), userUuid);
                    if (!orgs.isEmpty() && orgs.get(0) != null) {
                        organizationId = orgs.get(0);
                    }
                } catch (Exception ignored) {}
            }

            jdbcTemplate.update(
                    "INSERT INTO audit_logs (user_id, organization_id, action, entity_name, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?::jsonb, ?)",
                    userUuid, organizationId, action, entityName, entityId, detailsJson, ipAddress
            );
        } catch (Exception e) {
            System.err.println("Failed to insert audit log: " + e.getMessage());
        }
    }

    public void logAudit(String userId, String action, String entityName, String entityId, Map<String, Object> details, String ipAddress) {
        logAudit(userId, null, action, entityName, entityId, details, ipAddress);
    }
}
