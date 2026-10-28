package com.syswind.controller;

import com.syswind.config.SecurityHelper;
import com.syswind.entity.Customer;
import com.syswind.entity.User;
import com.syswind.repository.CustomerRepository;
import com.syswind.repository.OrganizationRepository;
import com.syswind.specification.CustomerSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private SecurityHelper securityHelper;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCustomers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "tier", required = false) String tier
    ) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            UUID orgId = (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole()) && currentUser.getOrganization() != null)
                    ? currentUser.getOrganization().getId() : null;

            // JPA Criteria Query using CustomerSpecification
            List<Customer> customers = customerRepository.findAll(
                    CustomerSpecification.filter(search, tier, orgId)
            );

            List<Map<String, Object>> dtos = customers.stream().map(this::buildCustomerDto).collect(Collectors.toList());
            resp.put("success", true);
            resp.put("customers", dtos);
            resp.put("data", dtos);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCustomerById(@PathVariable("id") String idStr) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UUID id = UUID.fromString(idStr);
            Customer c = customerRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

            resp.put("success", true);
            resp.put("customer", buildCustomerDto(c));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(resp);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createCustomer(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);

            String name = (String) (body.containsKey("name") ? body.get("name") : body.get("full_name"));
            String phone = (String) body.get("phone");
            String altPhone = (String) (body.containsKey("alternate_phone") ? body.get("alternate_phone") : body.get("alt_phone"));
            String email = (String) body.get("email");
            String address = (String) body.get("address");
            String township = (String) (body.containsKey("township") ? body.get("township") : body.get("township_name"));
            String city = (String) body.getOrDefault("city", "Yangon");
            String stateDivision = (String) body.getOrDefault("state_division", "Yangon");
            String tier = (String) (body.containsKey("customer_tier") ? body.get("customer_tier") : body.getOrDefault("loyalty_tier", "STANDARD"));
            String notes = (String) body.get("notes");

            if (name == null || phone == null || address == null || name.isBlank() || phone.isBlank()) {
                resp.put("success", false);
                resp.put("message", "Full name, phone, and delivery address are required.");
                return ResponseEntity.badRequest().body(resp);
            }

            Customer c = new Customer();
            c.setName(name.trim());
            c.setPhone(phone.trim());
            c.setAlternatePhone(altPhone != null ? altPhone.trim() : null);
            c.setEmail(email != null ? email.trim() : null);
            c.setAddress(address.trim());
            c.setTownship(township != null ? township.trim() : "Yangon");
            c.setCity(city != null ? city.trim() : "Yangon");
            c.setStateDivision(stateDivision != null ? stateDivision.trim() : "Yangon");
            c.setCustomerTier(tier != null ? tier.trim().toUpperCase() : "STANDARD");
            c.setNotes(notes != null ? notes.trim() : null);

            // Multi-tenant organization scoping
            if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
                c.setOrganization(currentUser.getOrganization());
            } else if (body.containsKey("organization_id") && body.get("organization_id") != null) {
                organizationRepository.findById(UUID.fromString((String) body.get("organization_id")))
                        .ifPresent(c::setOrganization);
            }

            Customer saved = customerRepository.save(c);

            resp.put("success", true);
            resp.put("message", "Customer created successfully");
            resp.put("customer", buildCustomerDto(saved));
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCustomer(@PathVariable("id") String idStr, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UUID id = UUID.fromString(idStr);
            Customer c = customerRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

            if (body.containsKey("name") || body.containsKey("full_name")) {
                String n = (String) (body.containsKey("name") ? body.get("name") : body.get("full_name"));
                if (n != null) c.setName(n.trim());
            }
            if (body.containsKey("phone") && body.get("phone") != null) {
                c.setPhone(((String) body.get("phone")).trim());
            }
            if (body.containsKey("alternate_phone") || body.containsKey("alt_phone")) {
                c.setAlternatePhone((String) (body.containsKey("alternate_phone") ? body.get("alternate_phone") : body.get("alt_phone")));
            }
            if (body.containsKey("email")) c.setEmail((String) body.get("email"));
            if (body.containsKey("address") && body.get("address") != null) {
                c.setAddress(((String) body.get("address")).trim());
            }
            if (body.containsKey("township") || body.containsKey("township_name")) {
                c.setTownship((String) (body.containsKey("township") ? body.get("township") : body.get("township_name")));
            }
            if (body.containsKey("city")) c.setCity((String) body.get("city"));
            if (body.containsKey("state_division")) c.setStateDivision((String) body.get("state_division"));
            if (body.containsKey("customer_tier") || body.containsKey("loyalty_tier")) {
                String t = (String) (body.containsKey("customer_tier") ? body.get("customer_tier") : body.get("loyalty_tier"));
                if (t != null) c.setCustomerTier(t.trim().toUpperCase());
            }
            if (body.containsKey("notes")) c.setNotes((String) body.get("notes"));

            Customer saved = customerRepository.save(c);

            resp.put("success", true);
            resp.put("message", "Customer updated successfully");
            resp.put("customer", buildCustomerDto(saved));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    private Map<String, Object> buildCustomerDto(Customer c) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", c.getId().toString());
        dto.put("name", c.getName());
        dto.put("full_name", c.getName());
        dto.put("phone", c.getPhone());
        dto.put("alt_phone", c.getAlternatePhone());
        dto.put("alternate_phone", c.getAlternatePhone());
        dto.put("email", c.getEmail());
        dto.put("address", c.getAddress());
        dto.put("city", c.getCity());
        dto.put("state_division", c.getStateDivision());
        dto.put("township", c.getTownship());
        dto.put("township_name", c.getTownship());
        dto.put("customer_tier", c.getCustomerTier());
        dto.put("loyalty_tier", c.getCustomerTier());
        dto.put("tier", c.getCustomerTier());
        dto.put("total_orders", c.getTotalOrders());
        dto.put("total_spent", c.getTotalSpent());
        dto.put("notes", c.getNotes());
        dto.put("created_at", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
        return dto;
    }
}
