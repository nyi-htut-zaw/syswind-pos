package com.syswind.controller;

import com.syswind.service.AuditService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDeliveries(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "provider_id", required = false) String providerId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "50") int limit
    ) {
        Map<String, Object> resp = new HashMap<>();
        try {
            StringBuilder sql = new StringBuilder("""
                SELECT d.*, 
                       o.order_number, o.total_amount, o.payment_status, o.payment_method,
                       o.recipient_name, o.recipient_phone, o.delivery_address, o.township_name,
                       p.name as provider_name, p.provider_type
                FROM deliveries d
                JOIN orders o ON o.id = d.order_id
                LEFT JOIN delivery_providers p ON p.id = d.provider_id
                WHERE 1=1
            """);

            List<Object> params = new ArrayList<>();

            if (status != null && !status.isBlank()) {
                sql.append(" AND d.delivery_status = ?");
                params.add(status);
            }

            if (providerId != null && !providerId.isBlank()) {
                sql.append(" AND d.provider_id = ?::uuid");
                params.add(providerId);
            }

            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim() + "%";
                sql.append(" AND (o.order_number ILIKE ? OR o.recipient_name ILIKE ? OR o.recipient_phone ILIKE ? OR d.tracking_number ILIKE ?)");
                params.add(term);
                params.add(term);
                params.add(term);
                params.add(term);
            }

            sql.append(" ORDER BY d.created_at DESC LIMIT ? OFFSET ?");
            params.add(limit);
            params.add((page - 1) * limit);

            List<Map<String, Object>> list = jdbcTemplate.queryForList(sql.toString(), params.toArray());

            resp.put("success", true);
            resp.put("deliveries", list);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    // --- TOWNSHIPS & RATES ---
    @GetMapping("/townships")
    public ResponseEntity<Map<String, Object>> getTownships(@RequestParam(value = "state_division", required = false) String stateDivision) {
        Map<String, Object> resp = new HashMap<>();
        String sql = "SELECT * FROM townships WHERE is_active = true";
        List<Object> params = new ArrayList<>();
        if (stateDivision != null && !stateDivision.isBlank()) {
            sql += " AND state_division = ?";
            params.add(stateDivision);
        }
        sql += " ORDER BY state_division ASC, name_en ASC";

        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, params.toArray());
        resp.put("success", true);
        resp.put("townships", list);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/townships")
    public ResponseEntity<Map<String, Object>> createTownship(@RequestBody Map<String, Object> body, Authentication auth) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String stateDivision = (String) body.get("state_division");
            String city = (String) body.get("city");
            String nameEn = (String) body.get("name_en");
            String nameMm = (String) body.get("name_mm");
            Object feeObj = body.get("standard_delivery_fee");
            Object daysObj = body.get("estimated_days");
            Boolean isCod = (Boolean) body.get("is_cod_available");

            if (nameEn == null || feeObj == null) {
                resp.put("success", false);
                resp.put("message", "Township English name and delivery fee are required.");
                return ResponseEntity.badRequest().body(resp);
            }

            double fee = Double.parseDouble(feeObj.toString());
            int days = daysObj != null ? Integer.parseInt(daysObj.toString()) : 1;

            Map<String, Object> township = jdbcTemplate.queryForMap(
                    """
                    INSERT INTO townships (state_division, city, name_en, name_mm, standard_delivery_fee, estimated_days, is_cod_available)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    RETURNING *
                    """,
                    stateDivision != null ? stateDivision : "Yangon",
                    city != null ? city : "Yangon",
                    nameEn.trim(),
                    (nameMm != null && !nameMm.isBlank()) ? nameMm.trim() : nameEn.trim(),
                    fee, days, isCod != null ? isCod : true
            );

            resp.put("success", true);
            resp.put("message", "New township delivery rate added successfully");
            resp.put("township", township);
            return ResponseEntity.status(201).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    @PutMapping("/townships/{id}")
    public ResponseEntity<Map<String, Object>> updateTownship(@PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String stateDivision = (String) body.get("state_division");
            String city = (String) body.get("city");
            String nameEn = (String) body.get("name_en");
            String nameMm = (String) body.get("name_mm");
            Object feeObj = body.get("standard_delivery_fee");
            Double fee = feeObj != null ? Double.parseDouble(feeObj.toString()) : null;
            Object daysObj = body.get("estimated_days");
            Integer days = daysObj != null ? Integer.parseInt(daysObj.toString()) : null;
            Boolean isCod = (Boolean) body.get("is_cod_available");

            Map<String, Object> updated = jdbcTemplate.queryForMap(
                    """
                    UPDATE townships SET
                        state_division = COALESCE(?, state_division),
                        city = COALESCE(?, city),
                        name_en = COALESCE(?, name_en),
                        name_mm = COALESCE(?, name_mm),
                        standard_delivery_fee = COALESCE(?, standard_delivery_fee),
                        estimated_days = COALESCE(?, estimated_days),
                        is_cod_available = COALESCE(?, is_cod_available)
                    WHERE id = ?::uuid
                    RETURNING *
                    """,
                    stateDivision, city, nameEn, nameMm, fee, days, isCod, id
            );

            resp.put("success", true);
            resp.put("message", "Township delivery fee and details updated successfully");
            resp.put("township", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    @DeleteMapping("/townships/{id}")
    public ResponseEntity<Map<String, Object>> deleteTownship(@PathVariable("id") String id) {
        Map<String, Object> resp = new HashMap<>();
        try {
            jdbcTemplate.update("UPDATE townships SET is_active = false WHERE id = ?::uuid", id);
            resp.put("success", true);
            resp.put("message", "Township removed successfully");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    // --- DELIVERY PROVIDERS ---
    @GetMapping("/providers")
    public ResponseEntity<Map<String, Object>> getProviders() {
        Map<String, Object> resp = new HashMap<>();
        List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM delivery_providers ORDER BY provider_type ASC, name ASC"
        );
        resp.put("success", true);
        resp.put("providers", list);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/providers")
    public ResponseEntity<Map<String, Object>> createProvider(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String name = (String) body.get("name");
            String providerType = (String) body.get("provider_type");
            String contactPerson = (String) body.get("contact_person");
            String phone = (String) body.get("phone");
            String email = (String) body.get("email");
            String address = (String) body.get("address");
            String trackingUrl = (String) body.get("tracking_url_template");
            String logoUrl = (String) body.get("logo_url");
            Boolean isActive = (Boolean) body.get("is_active");

            if (name == null || providerType == null || name.isBlank() || providerType.isBlank()) {
                resp.put("success", false);
                resp.put("message", "Provider name and type (INTERNAL / THIRD_PARTY) are required.");
                return ResponseEntity.badRequest().body(resp);
            }

            Map<String, Object> prov = jdbcTemplate.queryForMap(
                    """
                    INSERT INTO delivery_providers (name, provider_type, contact_person, phone, email, address, tracking_url_template, logo_url, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    RETURNING *
                    """,
                    name.trim(), providerType, contactPerson, phone, email, address, trackingUrl, logoUrl,
                    isActive != null ? isActive : true
            );

            resp.put("success", true);
            resp.put("message", "Delivery provider created successfully");
            resp.put("provider", prov);
            return ResponseEntity.status(201).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    @PutMapping("/providers/{id}")
    public ResponseEntity<Map<String, Object>> updateProvider(@PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String name = (String) body.get("name");
            String providerType = (String) body.get("provider_type");
            String contactPerson = (String) body.get("contact_person");
            String phone = (String) body.get("phone");
            String email = (String) body.get("email");
            String address = (String) body.get("address");
            String trackingUrl = (String) body.get("tracking_url_template");
            String logoUrl = (String) body.get("logo_url");
            Boolean isActive = (Boolean) body.get("is_active");

            Map<String, Object> updated = jdbcTemplate.queryForMap(
                    """
                    UPDATE delivery_providers SET
                        name = COALESCE(?, name),
                        provider_type = COALESCE(?, provider_type),
                        contact_person = COALESCE(?, contact_person),
                        phone = COALESCE(?, phone),
                        email = COALESCE(?, email),
                        address = COALESCE(?, address),
                        tracking_url_template = COALESCE(?, tracking_url_template),
                        logo_url = COALESCE(?, logo_url),
                        is_active = COALESCE(?, is_active),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?::uuid
                    RETURNING *
                    """,
                    name, providerType, contactPerson, phone, email, address, trackingUrl, logoUrl, isActive, id
            );

            resp.put("success", true);
            resp.put("message", "Delivery provider updated successfully");
            resp.put("provider", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    @DeleteMapping("/providers/{id}")
    public ResponseEntity<Map<String, Object>> deleteProvider(@PathVariable("id") String id) {
        Map<String, Object> resp = new HashMap<>();
        try {
            jdbcTemplate.update("UPDATE delivery_providers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?::uuid", id);
            resp.put("success", true);
            resp.put("message", "Delivery provider deactivated successfully");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    // --- DISPATCH & COD RECONCILIATION ---
    @PutMapping("/{id}/dispatch")
    public ResponseEntity<Map<String, Object>> updateDispatch(@PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String providerId = (String) body.get("provider_id");
            String riderName = (String) body.get("rider_name");
            String riderPhone = (String) body.get("rider_phone");
            String trackingNumber = (String) body.get("tracking_number");
            String notes = (String) body.get("delivery_notes");

            UUID pUuid = (providerId != null && !providerId.isBlank()) ? UUID.fromString(providerId) : null;

            jdbcTemplate.update(
                    """
                    UPDATE deliveries SET
                        provider_id = COALESCE(?, provider_id),
                        rider_name = COALESCE(?, rider_name),
                        rider_phone = COALESCE(?, rider_phone),
                        tracking_number = COALESCE(?, tracking_number),
                        delivery_notes = COALESCE(?, delivery_notes),
                        dispatch_date = COALESCE(dispatch_date, CURRENT_TIMESTAMP),
                        delivery_status = 'IN_TRANSIT',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?::uuid
                    """,
                    pUuid, riderName, riderPhone, trackingNumber, notes, id
            );

            resp.put("success", true);
            resp.put("message", "Delivery dispatched successfully");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String status = (String) body.get("delivery_status");
            if (status == null || status.isBlank()) {
                status = (String) body.get("status");
            }
            String notes = (String) body.get("delivery_notes");

            jdbcTemplate.update(
                    """
                    UPDATE deliveries SET
                        delivery_status = ?,
                        delivery_notes = COALESCE(?, delivery_notes),
                        actual_delivery_date = CASE WHEN ? = 'DELIVERED' THEN CURRENT_TIMESTAMP ELSE actual_delivery_date END,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?::uuid
                    """,
                    status, notes, status, id
            );

            resp.put("success", true);
            resp.put("message", "Delivery status updated to " + status);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    @PostMapping("/{id}/reconcile-cod")
    public ResponseEntity<Map<String, Object>> reconcileCod(@PathVariable("id") String id, @RequestBody Map<String, Object> body, Authentication auth) {
        Map<String, Object> resp = new HashMap<>();
        try {
            Object amtObj = body.get("amount_received");
            double amount = amtObj != null ? Double.parseDouble(amtObj.toString()) : 0.0;

            String userId = null;
            if (auth != null && auth.getPrincipal() instanceof Claims claims) {
                userId = claims.getSubject();
            }

            List<Map<String, Object>> delivList = jdbcTemplate.queryForList(
                    "SELECT d.*, o.order_number FROM deliveries d JOIN orders o ON o.id = d.order_id WHERE d.id = ?::uuid", id
            );
            if (delivList.isEmpty()) {
                resp.put("success", false);
                resp.put("message", "Delivery not found");
                return ResponseEntity.status(404).body(resp);
            }

            Map<String, Object> delivery = delivList.get(0);
            String orderId = delivery.get("order_id").toString();

            jdbcTemplate.update(
                    """
                    UPDATE deliveries SET
                        cod_amount_collected = ?,
                        cod_reconciled = true,
                        cod_reconciled_at = CURRENT_TIMESTAMP,
                        cod_reconciled_by = ?::uuid,
                        delivery_status = 'DELIVERED',
                        actual_delivery_date = COALESCE(actual_delivery_date, CURRENT_TIMESTAMP),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?::uuid
                    """,
                    amount, userId != null ? UUID.fromString(userId) : null, id
            );

            jdbcTemplate.update(
                    """
                    UPDATE orders SET
                        payment_status = 'PAID',
                        paid_amount = ?,
                        order_status = 'DELIVERED',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?::uuid
                    """,
                    amount, orderId
            );

            resp.put("success", true);
            resp.put("message", "COD cash reconciled successfully: " + (long)amount + " MMK");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }
}
