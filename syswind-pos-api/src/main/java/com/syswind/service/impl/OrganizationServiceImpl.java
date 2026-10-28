package com.syswind.service.impl;

import com.syswind.entity.Organization;
import com.syswind.entity.StoredImage;
import com.syswind.entity.User;
import com.syswind.repository.OrganizationRepository;
import com.syswind.repository.StoredImageRepository;
import com.syswind.repository.UserRepository;
import com.syswind.service.AuditService;
import com.syswind.service.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class OrganizationServiceImpl implements OrganizationService {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoredImageRepository imageRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Autowired
    private com.syswind.service.RoleService roleService;

    @Autowired
    private com.syswind.repository.RoleRepository roleRepository;

    @Autowired
    private com.syswind.repository.PaymentMethodRepository paymentMethodRepository;

    @Override
    public Map<String, Object> createOrganization(Map<String, Object> request, User currentUser) {
        String name = (String) request.get("name");
        String code = (String) request.get("code");

        if (name == null || code == null || name.isBlank() || code.isBlank()) {
            throw new IllegalArgumentException("Organization name and code are required.");
        }

        String orgCode = code.trim().toUpperCase().replaceAll("[^A-Z0-9_-]", "");
        if (organizationRepository.findByCodeIgnoreCase(orgCode).isPresent()) {
            throw new IllegalArgumentException("Organization with code '" + orgCode + "' already exists.");
        }

        Organization org = new Organization();
        org.setName(name.trim());
        org.setCode(orgCode);
        org.setPhone((String) request.get("phone"));
        org.setEmail((String) request.get("email"));
        org.setAddress((String) request.get("address"));
        org.setCity((String) request.getOrDefault("city", "Yangon"));
        org.setStateDivision((String) request.getOrDefault("state_division", "Yangon"));
        org.setTaxNumber((String) request.get("tax_number"));
        org.setCurrency((String) request.getOrDefault("currency", "MMK"));
        org.setIsActive(true);

        // Logo Image
        String logoImageId = (String) request.get("logo_image_id");
        if (logoImageId != null && !logoImageId.isBlank()) {
            imageRepository.findById(UUID.fromString(logoImageId)).ifPresent(org::setLogoImage);
        } else if (request.get("logo_url") != null) {
            String logoUrl = (String) request.get("logo_url");
            org.setLogoUrl(logoUrl);
            if (logoUrl.startsWith("/api/images/")) {
                try {
                    UUID imgId = UUID.fromString(logoUrl.substring("/api/images/".length()));
                    imageRepository.findById(imgId).ifPresent(org::setLogoImage);
                } catch (Exception ignored) {}
            }
        }

        Organization savedOrg = organizationRepository.save(org);

        // Auto-create initial Org ADMIN user
        String adminUsername = (String) request.getOrDefault("admin_username", orgCode.toLowerCase() + "_admin");
        String adminPassword = (String) request.getOrDefault("admin_password", "admin123");
        String adminEmail = (String) request.getOrDefault("admin_email", "admin@" + orgCode.toLowerCase() + ".syswind.com");
        String adminFullName = (String) request.getOrDefault("admin_full_name", name.trim() + " Admin");

        // Ensure unique username
        String finalUsername = adminUsername;
        int count = 1;
        while (userRepository.findByUsernameIgnoreCase(finalUsername).isPresent()) {
            finalUsername = adminUsername + count++;
        }

        User orgAdmin = new User();
        orgAdmin.setUsername(finalUsername);
        orgAdmin.setEmail(adminEmail);
        orgAdmin.setFullName(adminFullName);
        orgAdmin.setPasswordHash(passwordEncoder.encode(adminPassword));
        orgAdmin.setRole("ADMIN");
        orgAdmin.setOrganization(savedOrg);
        orgAdmin.setIsActive(true);
        orgAdmin.setBio("Initial Administrator for " + name.trim());

        // 1. Seed organization's dedicated operational roles
        roleService.seedRolesForOrganization(savedOrg);
        Optional<com.syswind.entity.Role> adminRoleOpt = roleRepository.findByNameIgnoreCaseAndOrganizationId("ADMIN", savedOrg.getId());
        adminRoleOpt.ifPresent(orgAdmin::setCustomRole);

        userRepository.save(orgAdmin);

        // 2. Seed initial Myanmar payment methods
        seedOrganizationPaymentMethods(savedOrg);

        if (currentUser != null) {
            auditService.logAudit(
                currentUser.getId().toString(),
                "CREATE_ORGANIZATION",
                "ORGANIZATION",
                savedOrg.getId().toString(),
                Map.of("name", savedOrg.getName(), "code", savedOrg.getCode(), "admin_username", finalUsername),
                "127.0.0.1"
            );
        }

        Map<String, Object> result = new HashMap<>();
        result.put("organization", savedOrg);
        result.put("admin_user", Map.of(
            "id", orgAdmin.getId().toString(),
            "username", orgAdmin.getUsername(),
            "email", orgAdmin.getEmail(),
            "role", orgAdmin.getRole(),
            "initial_password", adminPassword
        ));
        result.put("message", "Organization created successfully with initial Admin user.");
        return result;
    }

    @Override
    public Organization updateOrganization(UUID id, Map<String, Object> request, User currentUser) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        // If not SYSADMIN, verify user belongs to this organization
        if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
            if (currentUser.getOrganization() == null || !currentUser.getOrganization().getId().equals(id)) {
                throw new SecurityException("You are not authorized to modify another organization's settings.");
            }
        }

        if (request.containsKey("name") && request.get("name") != null) {
            org.setName(((String) request.get("name")).trim());
        }
        if (request.containsKey("phone")) org.setPhone((String) request.get("phone"));
        if (request.containsKey("email")) org.setEmail((String) request.get("email"));
        if (request.containsKey("address")) org.setAddress((String) request.get("address"));
        if (request.containsKey("city")) org.setCity((String) request.get("city"));
        if (request.containsKey("state_division")) org.setStateDivision((String) request.get("state_division"));
        if (request.containsKey("tax_number")) org.setTaxNumber((String) request.get("tax_number"));
        if (request.containsKey("currency")) org.setCurrency((String) request.get("currency"));

        if (request.containsKey("logo_image_id") && request.get("logo_image_id") != null) {
            imageRepository.findById(UUID.fromString((String) request.get("logo_image_id"))).ifPresent(org::setLogoImage);
        } else if (request.containsKey("logo_url") && request.get("logo_url") != null) {
            String logoUrl = (String) request.get("logo_url");
            org.setLogoUrl(logoUrl);
            if (logoUrl.startsWith("/api/images/")) {
                try {
                    UUID imgId = UUID.fromString(logoUrl.substring("/api/images/".length()));
                    imageRepository.findById(imgId).ifPresent(org::setLogoImage);
                } catch (Exception ignored) {}
            }
        }

        return organizationRepository.save(org);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listOrganizations(User currentUser) {
        List<Organization> orgs;
        if (currentUser == null || "SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
            orgs = organizationRepository.findAllByOrderByCreatedAtAsc();
        } else if (currentUser.getOrganization() != null) {
            orgs = List.of(currentUser.getOrganization());
        } else {
            orgs = Collections.emptyList();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Organization o : orgs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", o.getId().toString());
            map.put("name", o.getName());
            map.put("code", o.getCode());
            map.put("logo_url", o.getLogoUrl());
            map.put("phone", o.getPhone());
            map.put("email", o.getEmail());
            map.put("address", o.getAddress());
            map.put("city", o.getCity());
            map.put("state_division", o.getStateDivision());
            map.put("tax_number", o.getTaxNumber());
            map.put("currency", o.getCurrency());
            map.put("is_active", o.getIsActive());
            map.put("user_count", userRepository.countByOrganizationId(o.getId()));
            map.put("created_at", o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);
            result.add(map);
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Organization> getOrganizationById(UUID id) {
        return organizationRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Organization> getCurrentOrganization(User currentUser) {
        if (currentUser != null && currentUser.getOrganization() != null) {
            return Optional.of(currentUser.getOrganization());
        }
        List<Organization> active = organizationRepository.findByIsActiveTrueOrderByCreatedAtAsc();
        return active.isEmpty() ? Optional.empty() : Optional.of(active.get(0));
    }

    private void seedOrganizationPaymentMethods(Organization org) {
        List<com.syswind.entity.PaymentMethod> methods = List.of(
                createPm(org, "Cash on Delivery (COD)", "ပစ္စည်းရောက်မှ ငွေချေ (COD)", "COD", null, null, "ပစ္စည်းပို့ဆောင်သူထံသို့ တိုက်ရိုက်ငွေချေပါ", 1),
                createPm(org, "KBZPay (Kpay)", "ကေဘီဇက်ပေး (KPay)", "KBZPAY", org.getName(), org.getPhone() != null ? org.getPhone() : "09971000000", "ငွေလွှဲပြီးပါက screenshot သို့မဟုတ် Transaction နောက်ဆုံး ၄ လုံးပို့ပေးပါ", 2),
                createPm(org, "Wave Money (WavePay)", "ဝေ့ဗ်မနီ (WavePay)", "WAVEMONEY", org.getName(), org.getPhone() != null ? org.getPhone() : "09971000000", "ငွေလွှဲပြီးပါက screenshot ပို့ပေးပါ", 3),
                createPm(org, "AYA Pay", "ဧရာပေး (AYA Pay)", "AYAPAY", org.getName(), org.getPhone() != null ? org.getPhone() : "09971000000", "ငွေလွှဲပြီးပါက screenshot ပို့ပေးပါ", 4),
                createPm(org, "CB Pay", "စီဘီပေး (CB Pay)", "CBPAY", org.getName(), org.getPhone() != null ? org.getPhone() : "09971000000", "ငွေလွှဲပြီးပါက screenshot ပို့ပေးပါ", 5)
        );
        paymentMethodRepository.saveAll(methods);
    }

    private com.syswind.entity.PaymentMethod createPm(Organization org, String name, String nameMm, String type, String accName, String accNum, String instruction, int sort) {
        com.syswind.entity.PaymentMethod pm = new com.syswind.entity.PaymentMethod();
        pm.setName(name);
        pm.setNameMm(nameMm);
        pm.setType(type);
        pm.setAccountName(accName);
        pm.setAccountNumber(accNum);
        pm.setInstruction(instruction);
        pm.setIsActive(true);
        pm.setSortOrder(sort);
        pm.setOrganization(org);
        return pm;
    }
}
