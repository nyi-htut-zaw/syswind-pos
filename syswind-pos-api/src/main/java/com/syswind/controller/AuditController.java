package com.syswind.controller;

import com.syswind.config.SecurityHelper;
import com.syswind.dto.AuditLogDto;
import com.syswind.entity.AuditLog;
import com.syswind.entity.User;
import com.syswind.repository.AuditLogRepository;
import com.syswind.specification.AuditSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SecurityHelper securityHelper;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "entity_name", required = false) String entityName,
            @RequestParam(value = "organization_id", required = false) String orgIdParam,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "100") int limit
    ) {
        Map<String, Object> resp = new HashMap<>();
        User currentUser = securityHelper.getCurrentUser().orElse(null);

        // Multi-tenant organization scoping
        UUID targetOrgId = null;
        if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
            // Non-sysadmin users are STRICTLY restricted to their own organization
            if (currentUser.getOrganization() != null) {
                targetOrgId = currentUser.getOrganization().getId();
            }
        } else if (orgIdParam != null && !orgIdParam.isBlank() && !"ALL".equalsIgnoreCase(orgIdParam.trim())) {
            // Sysadmin can optionally filter by a specific organization
            try {
                targetOrgId = UUID.fromString(orgIdParam.trim());
            } catch (Exception ignored) {}
        }

        PageRequest pageRequest = PageRequest.of(Math.max(0, page - 1), Math.min(200, Math.max(1, limit)), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<AuditLog> logPage = auditLogRepository.findAll(
                AuditSpecification.filter(search, action, entityName, targetOrgId),
                pageRequest
        );

        List<AuditLogDto> dtos = logPage.getContent().stream().map(this::mapToDto).collect(Collectors.toList());

        resp.put("success", true);
        resp.put("logs", dtos);
        resp.put("data", dtos);
        resp.put("total_elements", logPage.getTotalElements());
        resp.put("total_pages", logPage.getTotalPages());
        return ResponseEntity.ok(resp);
    }

    private AuditLogDto mapToDto(AuditLog a) {
        AuditLogDto dto = new AuditLogDto();
        dto.setId(a.getId().toString());
        dto.setAction(a.getAction());
        dto.setEntityName(a.getEntityName());
        dto.setEntityId(a.getEntityId());
        dto.setDetails(a.getDetails());
        dto.setIpAddress(a.getIpAddress());
        dto.setCreatedAt(a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);

        if (a.getUser() != null) {
            dto.setUserId(a.getUser().getId().toString());
            dto.setUsername(a.getUser().getUsername());
            dto.setUserFullName(a.getUser().getFullName());
        }

        if (a.getOrganization() != null) {
            dto.setOrganizationId(a.getOrganization().getId().toString());
            dto.setOrganizationName(a.getOrganization().getName());
        } else {
            dto.setOrganizationName("System / Platform");
        }
        return dto;
    }
}
