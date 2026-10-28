package com.syswind.controller;

import com.syswind.config.SecurityHelper;
import com.syswind.service.JwtService;
import com.syswind.entity.Organization;
import com.syswind.entity.Permission;
import com.syswind.entity.Role;
import com.syswind.entity.StoredImage;
import com.syswind.entity.User;
import com.syswind.repository.OrganizationRepository;
import com.syswind.repository.RoleRepository;
import com.syswind.repository.StoredImageRepository;
import com.syswind.repository.UserRepository;
import com.syswind.service.AuditService;
import com.syswind.specification.UserSpecification;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private StoredImageRepository imageRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private SecurityHelper securityHelper;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body, HttpServletRequest request) {
        Map<String, Object> resp = new HashMap<>();
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null || username.isBlank() || password.isBlank()) {
            resp.put("success", false);
            resp.put("message", "Please enter username and password.");
            return ResponseEntity.badRequest().body(resp);
        }

        Optional<User> opt = userRepository.findByUsernameOrEmail(username.trim());
        if (opt.isEmpty()) {
            resp.put("success", false);
            resp.put("message", "Invalid credentials or user not found.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(resp);
        }

        User user = opt.get();
        if (Boolean.FALSE.equals(user.getIsActive())) {
            resp.put("success", false);
            resp.put("message", "Account is deactivated. Contact system administrator.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(resp);
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            resp.put("success", false);
            resp.put("message", "Invalid credentials or incorrect password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(resp);
        }

        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(
                user.getId().toString(),
                user.getUsername(),
                user.getRole(),
                user.getFullName(),
                user.getEmail()
        );

        auditService.logAudit(
                user.getId().toString(),
                "USER_LOGIN",
                "USER",
                user.getId().toString(),
                Map.of("username", user.getUsername(), "role", user.getRole()),
                request.getRemoteAddr()
        );

        Map<String, Object> userDto = buildUserDto(user);
        resp.put("success", true);
        resp.put("message", "Login successful");
        resp.put("token", token);
        resp.put("user", userDto);

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getProfile() {
        Map<String, Object> resp = new HashMap<>();
        Optional<User> currentUserOpt = securityHelper.getCurrentUser();
        if (currentUserOpt.isEmpty()) {
            resp.put("success", false);
            resp.put("message", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(resp);
        }

        resp.put("success", true);
        resp.put("user", buildUserDto(currentUserOpt.get()));
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        Optional<User> currentUserOpt = securityHelper.getCurrentUser();
        if (currentUserOpt.isEmpty()) {
            resp.put("success", false);
            resp.put("message", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(resp);
        }

        User user = currentUserOpt.get();
        if (body.containsKey("full_name") && body.get("full_name") != null) {
            user.setFullName(((String) body.get("full_name")).trim());
        }
        if (body.containsKey("phone")) user.setPhone((String) body.get("phone"));
        if (body.containsKey("bio")) user.setBio((String) body.get("bio"));

        if (body.containsKey("avatar_image_id") && body.get("avatar_image_id") != null) {
            imageRepository.findById(UUID.fromString((String) body.get("avatar_image_id")))
                    .ifPresent(user::setAvatarImage);
        } else if (body.containsKey("avatar_url") && body.get("avatar_url") != null) {
            String avatarUrl = (String) body.get("avatar_url");
            user.setAvatarUrl(avatarUrl);
            if (avatarUrl.startsWith("/api/images/")) {
                try {
                    UUID imgId = UUID.fromString(avatarUrl.substring("/api/images/".length()));
                    imageRepository.findById(imgId).ifPresent(user::setAvatarImage);
                } catch (Exception ignored) {}
            }
        }

        User saved = userRepository.save(user);
        resp.put("success", true);
        resp.put("message", "Profile updated successfully");
        resp.put("user", buildUserDto(saved));
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> body) {
        Map<String, Object> resp = new HashMap<>();
        Optional<User> currentUserOpt = securityHelper.getCurrentUser();
        if (currentUserOpt.isEmpty()) {
            resp.put("success", false);
            resp.put("message", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(resp);
        }

        User user = currentUserOpt.get();
        String currentPassword = body.get("current_password");
        String newPassword = body.get("new_password");

        if (currentPassword == null || newPassword == null || newPassword.length() < 6) {
            resp.put("success", false);
            resp.put("message", "New password must be at least 6 characters.");
            return ResponseEntity.badRequest().body(resp);
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            resp.put("success", false);
            resp.put("message", "Current password does not match.");
            return ResponseEntity.badRequest().body(resp);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resp.put("success", true);
        resp.put("message", "Password changed successfully");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) String role
    ) {
        Map<String, Object> resp = new HashMap<>();
        User currentUser = securityHelper.getCurrentUser().orElse(null);

        // Tenant isolation: SYSADMIN sees all users, Org Admin sees their organization's users
        UUID orgId = (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole()) && currentUser.getOrganization() != null)
                ? currentUser.getOrganization().getId() : null;

        // JPA Criteria Query using UserSpecification
        List<User> list = userRepository.findAll(UserSpecification.filter(search, role, orgId));

        List<Map<String, Object>> dtos = list.stream().map(this::buildUserDto).collect(Collectors.toList());
        resp.put("success", true);
        resp.put("users", dtos);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);

            String username = (String) body.get("username");
            String email = (String) body.get("email");
            String password = (String) body.get("password");
            String fullName = (String) body.get("full_name");
            String roleName = (String) body.getOrDefault("role", "SALES_STAFF");
            String phone = (String) body.get("phone");

            if (username == null || email == null || password == null || fullName == null) {
                resp.put("success", false);
                resp.put("message", "Username, email, password, and full name are required.");
                return ResponseEntity.badRequest().body(resp);
            }

            if (userRepository.findByUsernameIgnoreCase(username.trim()).isPresent()) {
                resp.put("success", false);
                resp.put("message", "Username is already taken.");
                return ResponseEntity.badRequest().body(resp);
            }

            User user = new User();
            user.setUsername(username.trim().toLowerCase());
            user.setEmail(email.trim().toLowerCase());
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setFullName(fullName.trim());
            user.setPhone(phone != null ? phone.trim() : null);
            user.setIsActive(true);

            // Organization assignment: Org admin can only create users in their own org
            if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
                user.setOrganization(currentUser.getOrganization());
            } else if (body.containsKey("organization_id") && body.get("organization_id") != null && !((String) body.get("organization_id")).isBlank()) {
                organizationRepository.findById(UUID.fromString((String) body.get("organization_id")))
                        .ifPresent(user::setOrganization);
            }

            // Role assignment: match by role_id UUID or role name in roleRepository
            Role matchedRole = null;
            if (body.containsKey("role_id") && body.get("role_id") != null && !((String) body.get("role_id")).isBlank()) {
                try {
                    matchedRole = roleRepository.findById(UUID.fromString((String) body.get("role_id"))).orElse(null);
                } catch (Exception ignored) {}
            }
            if (matchedRole == null && roleName != null && !roleName.isBlank()) {
                matchedRole = roleRepository.findByNameIgnoreCase(roleName.trim()).orElse(null);
            }

            if (matchedRole != null) {
                user.setCustomRole(matchedRole);
                user.setRole(matchedRole.getName());
            } else {
                user.setRole(roleName != null ? roleName.trim() : "SALES_STAFF");
            }

            // Avatar image
            if (body.containsKey("avatar_url") && body.get("avatar_url") != null) {
                String avatarUrl = (String) body.get("avatar_url");
                user.setAvatarUrl(avatarUrl);
                if (avatarUrl.startsWith("/api/images/")) {
                    try {
                        UUID imgId = UUID.fromString(avatarUrl.substring("/api/images/".length()));
                        imageRepository.findById(imgId).ifPresent(user::setAvatarImage);
                    } catch (Exception ignored) {}
                }
            }

            User saved = userRepository.save(user);
            resp.put("success", true);
            resp.put("message", "User account registered successfully");
            resp.put("user", buildUserDto(saved));
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable("id") String idStr, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            UUID id = UUID.fromString(idStr);

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Tenant isolation check: Org Admin can only modify users in their own organization
            if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
                if (user.getOrganization() == null || currentUser.getOrganization() == null ||
                        !user.getOrganization().getId().equals(currentUser.getOrganization().getId())) {
                    resp.put("success", false);
                    resp.put("message", "Not authorized to update users in another organization.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(resp);
                }
            }

            if (body.containsKey("full_name") && body.get("full_name") != null) {
                user.setFullName(((String) body.get("full_name")).trim());
            }
            if (body.containsKey("phone")) user.setPhone((String) body.get("phone"));
            if (body.containsKey("is_active") && body.get("is_active") != null) {
                user.setIsActive((Boolean) body.get("is_active"));
            }
            if (body.containsKey("password") && body.get("password") != null && !((String) body.get("password")).isBlank()) {
                user.setPasswordHash(passwordEncoder.encode((String) body.get("password")));
            }

            // Role assignment update
            Role matchedRole = null;
            if (body.containsKey("role_id") && body.get("role_id") != null && !((String) body.get("role_id")).isBlank()) {
                try {
                    matchedRole = roleRepository.findById(UUID.fromString((String) body.get("role_id"))).orElse(null);
                } catch (Exception ignored) {}
            }
            if (matchedRole == null && body.containsKey("role") && body.get("role") != null) {
                String rName = (String) body.get("role");
                matchedRole = roleRepository.findByNameIgnoreCase(rName.trim()).orElse(null);
                if (matchedRole == null) {
                    user.setRole(rName.trim());
                }
            }
            if (matchedRole != null) {
                user.setCustomRole(matchedRole);
                user.setRole(matchedRole.getName());
            }

            // Organization update (SYSADMIN only)
            if (body.containsKey("organization_id") && body.get("organization_id") != null && (currentUser == null || "SYSADMIN".equalsIgnoreCase(currentUser.getRole()))) {
                organizationRepository.findById(UUID.fromString((String) body.get("organization_id")))
                        .ifPresent(user::setOrganization);
            }

            if (body.containsKey("avatar_url") && body.get("avatar_url") != null) {
                String avatarUrl = (String) body.get("avatar_url");
                user.setAvatarUrl(avatarUrl);
                if (avatarUrl.startsWith("/api/images/")) {
                    try {
                        UUID imgId = UUID.fromString(avatarUrl.substring("/api/images/".length()));
                        imageRepository.findById(imgId).ifPresent(user::setAvatarImage);
                    } catch (Exception ignored) {}
                }
            }

            User saved = userRepository.save(user);
            resp.put("success", true);
            resp.put("message", "User updated successfully");
            resp.put("user", buildUserDto(saved));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    private Map<String, Object> buildUserDto(User u) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", u.getId().toString());
        dto.put("username", u.getUsername());
        dto.put("email", u.getEmail());
        dto.put("full_name", u.getFullName());
        dto.put("phone", u.getPhone());
        dto.put("role", u.getRole());
        dto.put("role_id", u.getCustomRole() != null ? u.getCustomRole().getId().toString() : null);
        dto.put("custom_role_id", u.getCustomRole() != null ? u.getCustomRole().getId().toString() : null);
        if (u.getCustomRole() != null) {
            dto.put("role_display_name", u.getCustomRole().getDisplayName());
        }
        dto.put("avatar_url", u.getAvatarUrl());
        dto.put("bio", u.getBio());
        dto.put("is_active", u.getIsActive());
        dto.put("last_login_at", u.getLastLoginAt() != null ? u.getLastLoginAt().toString() : null);
        dto.put("created_at", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);

        if (u.getOrganization() != null) {
            Organization o = u.getOrganization();
            dto.put("organization_id", o.getId().toString());
            dto.put("organization", Map.of(
                    "id", o.getId().toString(),
                    "name", o.getName(),
                    "code", o.getCode(),
                    "logo_url", o.getLogoUrl() != null ? o.getLogoUrl() : "",
                    "currency", o.getCurrency() != null ? o.getCurrency() : "MMK"
            ));
        }

        // Permissions aggregation:
        // SYSADMIN has ALL permissions including creating new organizations
        final List<String> permCodes = new ArrayList<>();
        if ("SYSADMIN".equalsIgnoreCase(u.getRole())) {
            permCodes.addAll(List.of(
                    "menu:dashboard", "menu:pos", "menu:orders", "menu:inventory", "menu:customers",
                    "menu:delivery", "menu:finance", "menu:settings",
                    "product:create", "product:edit", "product:delete", "stock:adjust", "category:manage",
                    "order:create", "order:edit", "order:cancel", "order:invoice",
                    "customer:create", "customer:edit", "customer:delete",
                    "delivery:assign", "delivery:update_status", "delivery:reconcile", "township:manage", "provider:manage",
                    "payment:manage", "finance:income_record", "finance:expense_record",
                    "org:manage", "org:create", "role:manage", "user:manage"
            ));
        } else if ("ADMIN".equalsIgnoreCase(u.getRole())) {
            // Organization Admin has full operational permissions for their organization,
            // but CANNOT create new organizations (sysadmin-only).
            permCodes.addAll(List.of(
                    "menu:dashboard", "menu:pos", "menu:orders", "menu:inventory", "menu:customers",
                    "menu:delivery", "menu:finance", "menu:settings",
                    "product:create", "product:edit", "product:delete", "stock:adjust", "category:manage",
                    "order:create", "order:edit", "order:cancel", "order:invoice",
                    "customer:create", "customer:edit", "customer:delete",
                    "delivery:assign", "delivery:update_status", "delivery:reconcile", "township:manage", "provider:manage",
                    "payment:manage", "finance:income_record", "finance:expense_record",
                    "org:manage", "role:manage", "user:manage"
            ));
        } else if (u.getCustomRole() != null && u.getCustomRole().getPermissions() != null) {
            u.getCustomRole().getPermissions().forEach(p -> permCodes.add(p.getCode()));
        } else {
            // Check default role by name in role repository
            roleRepository.findByNameIgnoreCase(u.getRole()).ifPresent(r -> {
                if (r.getPermissions() != null) {
                    r.getPermissions().forEach(p -> permCodes.add(p.getCode()));
                }
            });
        }

        dto.put("permissions", permCodes);
        return dto;
    }
}
