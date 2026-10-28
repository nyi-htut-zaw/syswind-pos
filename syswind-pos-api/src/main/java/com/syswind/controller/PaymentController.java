package com.syswind.controller;

import com.syswind.config.SecurityHelper;
import com.syswind.entity.PaymentMethod;
import com.syswind.entity.User;
import com.syswind.repository.OrganizationRepository;
import com.syswind.repository.PaymentMethodRepository;
import com.syswind.repository.StoredImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Autowired
    private StoredImageRepository imageRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private SecurityHelper securityHelper;

    @GetMapping("/methods")
    public ResponseEntity<Map<String, Object>> getPaymentMethods() {
        Map<String, Object> resp = new HashMap<>();
        User currentUser = securityHelper.getCurrentUser().orElse(null);

        List<PaymentMethod> list;
        if (currentUser != null && currentUser.getOrganization() != null) {
            list = paymentMethodRepository.findByOrganizationOrGlobal(currentUser.getOrganization().getId());
        } else {
            list = paymentMethodRepository.findAllByOrderBySortOrderAscNameAsc();
        }

        resp.put("success", true);
        resp.put("payment_methods", list);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/methods")
    public ResponseEntity<Map<String, Object>> createPaymentMethod(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            String name = (String) body.get("name");
            String type = (String) body.get("type");

            if (name == null || type == null || name.isBlank() || type.isBlank()) {
                resp.put("success", false);
                resp.put("message", "Payment method name and type are required.");
                return ResponseEntity.badRequest().body(resp);
            }

            PaymentMethod pm = new PaymentMethod();
            pm.setName(name.trim());
            pm.setNameMm((String) body.get("name_mm"));
            pm.setType(type);
            pm.setAccountName((String) body.get("account_name"));
            pm.setAccountNumber((String) body.get("account_number"));
            pm.setInstruction((String) body.get("instruction"));
            pm.setIsActive(body.containsKey("is_active") ? (Boolean) body.get("is_active") : true);
            pm.setSortOrder(body.containsKey("sort_order") ? Integer.parseInt(body.get("sort_order").toString()) : 0);

            // Tenant Scoping
            if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
                pm.setOrganization(currentUser.getOrganization());
            }

            // QR Image
            if (body.containsKey("qr_code_url") && body.get("qr_code_url") != null) {
                String qrUrl = (String) body.get("qr_code_url");
                pm.setQrCodeUrl(qrUrl);
                if (qrUrl.startsWith("/api/images/")) {
                    try {
                        UUID imgId = UUID.fromString(qrUrl.substring("/api/images/".length()));
                        imageRepository.findById(imgId).ifPresent(pm::setQrImage);
                    } catch (Exception ignored) {}
                }
            }

            // Logo Image
            if (body.containsKey("logo_url") && body.get("logo_url") != null) {
                String logoUrl = (String) body.get("logo_url");
                pm.setLogoUrl(logoUrl);
                if (logoUrl.startsWith("/api/images/")) {
                    try {
                        UUID imgId = UUID.fromString(logoUrl.substring("/api/images/".length()));
                        imageRepository.findById(imgId).ifPresent(pm::setLogoImage);
                    } catch (Exception ignored) {}
                }
            }

            PaymentMethod saved = paymentMethodRepository.save(pm);
            resp.put("success", true);
            resp.put("message", "Payment method created successfully");
            resp.put("payment_method", saved);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @PutMapping("/methods/{id}")
    public ResponseEntity<Map<String, Object>> updatePaymentMethod(@PathVariable("id") String idStr, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UUID id = UUID.fromString(idStr);
            PaymentMethod pm = paymentMethodRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Payment method not found"));

            if (body.containsKey("name") && body.get("name") != null) pm.setName(((String) body.get("name")).trim());
            if (body.containsKey("name_mm")) pm.setNameMm((String) body.get("name_mm"));
            if (body.containsKey("type") && body.get("type") != null) pm.setType((String) body.get("type"));
            if (body.containsKey("account_name")) pm.setAccountName((String) body.get("account_name"));
            if (body.containsKey("account_number")) pm.setAccountNumber((String) body.get("account_number"));
            if (body.containsKey("instruction")) pm.setInstruction((String) body.get("instruction"));
            if (body.containsKey("is_active")) pm.setIsActive((Boolean) body.get("is_active"));
            if (body.containsKey("sort_order")) pm.setSortOrder(Integer.parseInt(body.get("sort_order").toString()));

            if (body.containsKey("qr_code_url")) {
                String qrUrl = (String) body.get("qr_code_url");
                pm.setQrCodeUrl(qrUrl);
                if (qrUrl != null && qrUrl.startsWith("/api/images/")) {
                    try {
                        UUID imgId = UUID.fromString(qrUrl.substring("/api/images/".length()));
                        imageRepository.findById(imgId).ifPresent(pm::setQrImage);
                    } catch (Exception ignored) {}
                }
            }

            if (body.containsKey("logo_url")) {
                String logoUrl = (String) body.get("logo_url");
                pm.setLogoUrl(logoUrl);
                if (logoUrl != null && logoUrl.startsWith("/api/images/")) {
                    try {
                        UUID imgId = UUID.fromString(logoUrl.substring("/api/images/".length()));
                        imageRepository.findById(imgId).ifPresent(pm::setLogoImage);
                    } catch (Exception ignored) {}
                }
            }

            PaymentMethod saved = paymentMethodRepository.save(pm);
            resp.put("success", true);
            resp.put("message", "Payment method updated successfully");
            resp.put("payment_method", saved);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @PatchMapping("/methods/{id}/toggle")
    public ResponseEntity<Map<String, Object>> togglePaymentMethod(@PathVariable("id") String idStr) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UUID id = UUID.fromString(idStr);
            PaymentMethod pm = paymentMethodRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Payment method not found"));

            pm.setIsActive(!Boolean.TRUE.equals(pm.getIsActive()));
            PaymentMethod saved = paymentMethodRepository.save(pm);

            resp.put("success", true);
            resp.put("message", "Payment method status updated");
            resp.put("payment_method", saved);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @DeleteMapping("/methods/{id}")
    public ResponseEntity<Map<String, Object>> deletePaymentMethod(@PathVariable("id") String idStr) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UUID id = UUID.fromString(idStr);
            paymentMethodRepository.deleteById(id);
            resp.put("success", true);
            resp.put("message", "Payment method deleted successfully");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }
}
