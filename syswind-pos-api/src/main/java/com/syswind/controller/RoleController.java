package com.syswind.controller;

import com.syswind.config.SecurityHelper;
import com.syswind.entity.Role;
import com.syswind.entity.User;
import com.syswind.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @Autowired
    private SecurityHelper securityHelper;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listRoles() {
        Map<String, Object> resp = new HashMap<>();
        User currentUser = securityHelper.getCurrentUser().orElse(null);
        List<Map<String, Object>> roles = roleService.listRoles(currentUser);
        resp.put("success", true);
        resp.put("roles", roles);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/permissions")
    public ResponseEntity<Map<String, Object>> listAllPermissions() {
        Map<String, Object> resp = roleService.listAllPermissions();
        resp.put("success", true);
        return ResponseEntity.ok(resp);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createRole(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            Role role = roleService.createRole(body, currentUser);
            resp.put("success", true);
            resp.put("message", "Custom role created successfully.");
            resp.put("role", role);
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
    public ResponseEntity<Map<String, Object>> updateRole(@PathVariable("id") String idStr, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            UUID id = UUID.fromString(idStr);
            Role role = roleService.updateRole(id, body, currentUser);
            resp.put("success", true);
            resp.put("message", "Role permissions updated successfully.");
            resp.put("role", role);
            return ResponseEntity.ok(resp);
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRole(@PathVariable("id") String idStr) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            UUID id = UUID.fromString(idStr);
            roleService.deleteRole(id, currentUser);
            resp.put("success", true);
            resp.put("message", "Role deleted successfully.");
            return ResponseEntity.ok(resp);
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
}
