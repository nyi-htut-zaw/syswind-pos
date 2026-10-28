package com.syswind.controller;

import com.syswind.config.SecurityHelper;
import com.syswind.entity.Organization;
import com.syswind.entity.User;
import com.syswind.service.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    @Autowired
    private OrganizationService organizationService;

    @Autowired
    private SecurityHelper securityHelper;

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentOrganization() {
        Map<String, Object> resp = new HashMap<>();
        User currentUser = securityHelper.getCurrentUser().orElse(null);
        Optional<Organization> opt = organizationService.getCurrentOrganization(currentUser);

        if (opt.isEmpty()) {
            resp.put("success", false);
            resp.put("message", "No organization found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(resp);
        }

        resp.put("success", true);
        resp.put("organization", opt.get());
        return ResponseEntity.ok(resp);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listOrganizations() {
        Map<String, Object> resp = new HashMap<>();
        User currentUser = securityHelper.getCurrentUser().orElse(null);
        List<Map<String, Object>> list = organizationService.listOrganizations(currentUser);
        resp.put("success", true);
        resp.put("organizations", list);
        return ResponseEntity.ok(resp);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrganization(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            if (currentUser == null || !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
                resp.put("success", false);
                resp.put("message", "Only SYSADMIN can create new organizations. Organization Admin cannot create organizations.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(resp);
            }
            Map<String, Object> created = organizationService.createOrganization(body, currentUser);
            resp.put("success", true);
            resp.putAll(created);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (IllegalArgumentException e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateOrganization(@PathVariable("id") String idStr, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            UUID id = UUID.fromString(idStr);
            Organization updated = organizationService.updateOrganization(id, body, currentUser);
            resp.put("success", true);
            resp.put("message", "Organization details updated successfully");
            resp.put("organization", updated);
            return ResponseEntity.ok(resp);
        } catch (SecurityException e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }
}
