package com.syswind.service.impl;

import com.syswind.entity.Organization;
import com.syswind.entity.Permission;
import com.syswind.entity.Role;
import com.syswind.entity.User;
import com.syswind.repository.OrganizationRepository;
import com.syswind.repository.PermissionRepository;
import com.syswind.repository.RoleRepository;
import com.syswind.repository.UserRepository;
import com.syswind.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoleServiceImpl implements RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listRoles(User currentUser) {
        List<Role> roles;
        if (currentUser == null || "SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
            // Global sysadmin can view all roles across all organizations
            roles = roleRepository.findAllByOrderByIsSystemDescCreatedAtAsc();
        } else if (currentUser.getOrganization() != null) {
            // Organization admin/staff ONLY sees roles belonging to their own organization
            roles = roleRepository.findByOrganizationIdOrderByIsSystemDescCreatedAtAsc(currentUser.getOrganization().getId());
        } else {
            roles = Collections.emptyList();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Role r : roles) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId().toString());
            map.put("name", r.getName());
            map.put("display_name", r.getDisplayName());
            map.put("description", r.getDescription());
            map.put("is_system", r.getIsSystem());
            map.put("organization_id", r.getOrganization() != null ? r.getOrganization().getId().toString() : null);
            map.put("organization_name", r.getOrganization() != null ? r.getOrganization().getName() : "Global Template");

            List<String> permCodes = r.getPermissions().stream()
                    .map(Permission::getCode)
                    .sorted()
                    .collect(Collectors.toList());
            map.put("permission_codes", permCodes);
            map.put("permissions", r.getPermissions());
            map.put("user_count", userRepository.countByCustomRoleId(r.getId()));
            map.put("created_at", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
            result.add(map);
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> listAllPermissions() {
        List<Permission> all = permissionRepository.findAllByOrderByModuleAscTypeDescCodeAsc();
        List<Permission> menus = all.stream().filter(p -> "MENU".equalsIgnoreCase(p.getType())).collect(Collectors.toList());
        List<Permission> buttons = all.stream().filter(p -> "BUTTON".equalsIgnoreCase(p.getType())).collect(Collectors.toList());

        Map<String, Object> resp = new HashMap<>();
        resp.put("permissions", all);
        resp.put("menus", menus);
        resp.put("buttons", buttons);
        return resp;
    }

    @Override
    public Role createRole(Map<String, Object> request, User currentUser) {
        String name = (String) request.get("name");
        String displayName = (String) request.get("display_name");
        String description = (String) request.get("description");
        @SuppressWarnings("unchecked")
        List<String> permissionCodes = (List<String>) request.get("permission_codes");

        if (name == null || displayName == null || name.isBlank() || displayName.isBlank()) {
            throw new IllegalArgumentException("Role code name and display name are required.");
        }

        String roleCode = name.trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_");

        Role role = new Role();
        role.setName(roleCode);
        role.setDisplayName(displayName.trim());
        role.setDescription(description);
        role.setIsSystem(false);

        if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
            if (currentUser.getOrganization() == null) {
                throw new IllegalArgumentException("User must belong to an organization to create custom roles.");
            }
            role.setOrganization(currentUser.getOrganization());
        } else if (request.containsKey("organization_id") && request.get("organization_id") != null) {
            organizationRepository.findById(UUID.fromString((String) request.get("organization_id")))
                    .ifPresent(role::setOrganization);
        }

        // Validate uniqueness within organization
        if (role.getOrganization() != null) {
            if (roleRepository.findByNameIgnoreCaseAndOrganizationId(roleCode, role.getOrganization().getId()).isPresent()) {
                throw new IllegalArgumentException("Role '" + roleCode + "' already exists in this organization.");
            }
        }

        if (permissionCodes != null && !permissionCodes.isEmpty()) {
            List<Permission> perms = permissionRepository.findByCodeIn(permissionCodes);
            role.setPermissions(new HashSet<>(perms));
        }

        return roleRepository.save(role);
    }

    @Override
    public Role updateRole(UUID id, Map<String, Object> request, User currentUser) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));

        // Multi-tenant authorization
        if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
            if (role.getOrganization() == null || currentUser.getOrganization() == null ||
                    !role.getOrganization().getId().equals(currentUser.getOrganization().getId())) {
                throw new IllegalArgumentException("Access denied: You can only edit roles belonging to your own organization.");
            }
        }

        if (request.containsKey("display_name") && request.get("display_name") != null) {
            role.setDisplayName(((String) request.get("display_name")).trim());
        }
        if (request.containsKey("description")) {
            role.setDescription((String) request.get("description"));
        }

        if (request.containsKey("permission_codes")) {
            @SuppressWarnings("unchecked")
            List<String> permissionCodes = (List<String>) request.get("permission_codes");
            if (permissionCodes != null) {
                List<Permission> perms = permissionRepository.findByCodeIn(permissionCodes);
                role.setPermissions(new HashSet<>(perms));
            }
        }

        return roleRepository.save(role);
    }

    @Override
    public void deleteRole(UUID id, User currentUser) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));

        if (Boolean.TRUE.equals(role.getIsSystem())) {
            throw new IllegalArgumentException("Default system roles cannot be deleted.");
        }

        // Multi-tenant authorization
        if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
            if (role.getOrganization() == null || currentUser.getOrganization() == null ||
                    !role.getOrganization().getId().equals(currentUser.getOrganization().getId())) {
                throw new IllegalArgumentException("Access denied: You can only delete roles belonging to your own organization.");
            }
        }

        long userCount = userRepository.countByCustomRoleId(id);
        if (userCount > 0) {
            throw new IllegalArgumentException("Cannot delete role: active users are currently assigned to it.");
        }

        roleRepository.delete(role);
    }

    @Override
    public void seedRolesForOrganization(Organization org) {
        if (org == null) return;

        Map<String, List<String>> rolePerms = Map.of(
                "ADMIN", List.of(
                        "menu:dashboard", "menu:pos", "menu:orders", "menu:inventory", "menu:customers",
                        "menu:delivery", "menu:finance", "menu:settings",
                        "product:create", "product:edit", "product:delete", "stock:adjust", "category:manage",
                        "order:create", "order:edit", "order:cancel", "order:invoice",
                        "customer:create", "customer:edit", "customer:delete",
                        "delivery:assign", "delivery:update_status", "delivery:reconcile", "township:manage", "provider:manage",
                        "payment:manage", "finance:income_record", "finance:expense_record",
                        "role:manage", "user:manage", "org:manage"
                ),
                "ACCOUNTANT", List.of(
                        "menu:dashboard", "menu:orders", "menu:finance",
                        "order:invoice", "delivery:reconcile",
                        "payment:manage", "finance:income_record", "finance:expense_record"
                ),
                "SALES_STAFF", List.of(
                        "menu:pos", "menu:orders", "menu:inventory", "menu:customers",
                        "product:create", "product:edit", "stock:adjust", "category:manage",
                        "order:create", "order:invoice",
                        "customer:create", "customer:edit"
                ),
                "DELIVERY_COORDINATOR", List.of(
                        "menu:delivery", "menu:orders",
                        "delivery:assign", "delivery:update_status", "delivery:reconcile", "township:manage",
                        "order:invoice"
                ),
                "CASHIER", List.of(
                        "menu:pos", "menu:orders",
                        "order:create", "order:invoice"
                )
        );

        Map<String, String> displayNames = Map.of(
                "ADMIN", "Organization Admin (အဖွဲ့အစည်း စီမံခန့်ခွဲသူ)",
                "ACCOUNTANT", "Accountant (စာရင်းကိုင် / ဘဏ္ဍာရေး)",
                "SALES_STAFF", "Sales Staff (အရောင်းနှင့် ကုန်ပစ္စည်း စာရင်း)",
                "DELIVERY_COORDINATOR", "Delivery Coordinator (ပို့ဆောင်ရေး တာဝန်ခံ)",
                "CASHIER", "Cashier (ငွေကိုင် / အရောင်းကောင်တာ)"
        );

        for (Map.Entry<String, List<String>> entry : rolePerms.entrySet()) {
            String roleCode = entry.getKey();
            Optional<Role> existing = roleRepository.findByNameIgnoreCaseAndOrganizationId(roleCode, org.getId());
            Role role = existing.orElseGet(Role::new);
            role.setName(roleCode);
            role.setDisplayName(displayNames.getOrDefault(roleCode, roleCode));
            role.setOrganization(org);
            role.setIsSystem(true);
            role.setDescription("Operational role for " + org.getName());

            List<Permission> perms = permissionRepository.findByCodeIn(entry.getValue());
            role.setPermissions(new HashSet<>(perms));
            roleRepository.save(role);
        }
    }
}
