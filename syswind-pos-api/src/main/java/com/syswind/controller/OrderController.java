package com.syswind.controller;

import com.syswind.config.SecurityHelper;
import com.syswind.entity.*;
import com.syswind.repository.*;
import com.syswind.specification.OrderSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private SecurityHelper securityHelper;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getOrders(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "payment_status", required = false) String paymentStatus,
            @RequestParam(value = "search", required = false) String search
    ) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            UUID orgId = (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole()) && currentUser.getOrganization() != null)
                    ? currentUser.getOrganization().getId() : null;

            // JPA Criteria Query using OrderSpecification
            List<Order> orders = orderRepository.findAll(
                    OrderSpecification.filter(search, status, paymentStatus, orgId)
            );

            List<Map<String, Object>> dtoList = new ArrayList<>();
            for (Order o : orders) {
                dtoList.add(buildOrderDto(o));
            }

            resp.put("success", true);
            resp.put("orders", dtoList);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOrderById(@PathVariable("id") String idStr) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UUID id = UUID.fromString(idStr);
            Order o = orderRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found"));

            resp.put("success", true);
            resp.put("order", buildOrderDto(o));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(resp);
        }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            Organization org = currentUser != null ? currentUser.getOrganization() : null;

            // Recipient info
            String recipientName = (String) body.get("recipient_name");
            String recipientPhone = (String) body.get("recipient_phone");
            String deliveryAddress = (String) body.get("delivery_address");
            String township = (String) body.get("township");
            String paymentMethod = (String) body.getOrDefault("payment_method", "CASH_ON_DELIVERY");
            String paymentRef = (String) body.get("payment_reference");
            String notes = (String) body.get("notes");

            Object subtotalObj = body.get("subtotal");
            Object deliveryFeeObj = body.get("delivery_fee");
            Object discountObj = body.get("discount_amount");
            Object totalObj = body.get("total_amount");

            BigDecimal subtotal = subtotalObj != null ? new BigDecimal(subtotalObj.toString()) : BigDecimal.ZERO;
            BigDecimal deliveryFee = deliveryFeeObj != null ? new BigDecimal(deliveryFeeObj.toString()) : BigDecimal.ZERO;
            BigDecimal discount = discountObj != null ? new BigDecimal(discountObj.toString()) : BigDecimal.ZERO;
            BigDecimal totalAmount = totalObj != null ? new BigDecimal(totalObj.toString()) : subtotal.add(deliveryFee).subtract(discount);

            // Find or create customer
            Customer customer = null;
            if (recipientPhone != null && !recipientPhone.isBlank()) {
                Optional<Customer> optC = customerRepository.findByPhone(recipientPhone.trim());
                if (optC.isPresent()) {
                    customer = optC.get();
                } else {
                    customer = new Customer();
                    customer.setName(recipientName != null ? recipientName.trim() : "Walk-in Customer");
                    customer.setPhone(recipientPhone.trim());
                    customer.setAddress(deliveryAddress);
                    customer.setTownship(township);
                    customer.setOrganization(org);
                    customer = customerRepository.save(customer);
                }
            }

            Order order = new Order();
            order.setOrderNumber("ORD-" + System.currentTimeMillis() % 10000000);
            order.setOrganization(org);
            order.setCustomer(customer);
            order.setOrderStatus("PENDING");
            order.setPaymentStatus("COD".equalsIgnoreCase(paymentMethod) || "CASH_ON_DELIVERY".equalsIgnoreCase(paymentMethod) ? "UNPAID" : "PAID");
            order.setPaymentMethod(paymentMethod);
            order.setPaymentReference(paymentRef);
            order.setSubtotal(subtotal);
            order.setDeliveryFee(deliveryFee);
            order.setDiscountAmount(discount);
            order.setTotalAmount(totalAmount);
            order.setNotes(notes);
            order.setCreatedBy(currentUser);

            // Items
            if (body.containsKey("items") && body.get("items") instanceof List<?> itemList) {
                for (Object itemObj : itemList) {
                    if (itemObj instanceof Map<?, ?> iMap) {
                        OrderItem item = new OrderItem();
                        item.setOrder(order);

                        String pName = (String) iMap.get("product_name");
                        Object pPriceObj = iMap.get("unit_price");
                        Object pQtyObj = iMap.get("quantity");
                        int qty = pQtyObj != null ? Integer.parseInt(pQtyObj.toString()) : 1;
                        BigDecimal unitPrice = pPriceObj != null ? new BigDecimal(pPriceObj.toString()) : BigDecimal.ZERO;

                        item.setProductName(pName != null ? pName : "Item");
                        item.setQuantity(qty);
                        item.setUnitPrice(unitPrice);
                        item.setTotalPrice(unitPrice.multiply(BigDecimal.valueOf(qty)));

                        if (iMap.containsKey("product_id") && iMap.get("product_id") != null) {
                            try {
                                UUID pId = UUID.fromString(iMap.get("product_id").toString());
                                productRepository.findById(pId).ifPresent(p -> {
                                    item.setProduct(p);
                                    // Stock deduction
                                    p.setStockQuantity(Math.max(0, p.getStockQuantity() - qty));
                                    productRepository.save(p);
                                });
                            } catch (Exception ignored) {}
                        }

                        if (iMap.containsKey("variant_id") && iMap.get("variant_id") != null) {
                            try {
                                UUID vId = UUID.fromString(iMap.get("variant_id").toString());
                                productVariantRepository.findById(vId).ifPresent(v -> {
                                    item.setVariant(v);
                                    v.setStockQuantity(Math.max(0, v.getStockQuantity() - qty));
                                    productVariantRepository.save(v);
                                });
                            } catch (Exception ignored) {}
                        }

                        order.getItems().add(item);
                    }
                }
            }

            Order saved = orderRepository.save(order);
            resp.put("success", true);
            resp.put("message", "Order placed successfully");
            resp.put("order", buildOrderDto(saved));
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable("id") String idStr, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UUID id = UUID.fromString(idStr);
            String status = (String) body.get("order_status");
            if (status == null || status.isBlank()) {
                resp.put("success", false);
                resp.put("message", "Status is required");
                return ResponseEntity.badRequest().body(resp);
            }

            Order o = orderRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found"));

            o.setOrderStatus(status.trim().toUpperCase());
            o.setUpdatedAt(OffsetDateTime.now());
            Order saved = orderRepository.save(o);

            resp.put("success", true);
            resp.put("message", "Order status updated");
            resp.put("order", buildOrderDto(saved));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    private Map<String, Object> buildOrderDto(Order o) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", o.getId().toString());
        dto.put("order_number", o.getOrderNumber());
        dto.put("order_status", o.getOrderStatus());
        dto.put("payment_status", o.getPaymentStatus());
        dto.put("payment_method", o.getPaymentMethod());
        dto.put("payment_reference", o.getPaymentReference());
        dto.put("channel", o.getChannel());
        dto.put("subtotal", o.getSubtotal());
        dto.put("delivery_fee", o.getDeliveryFee());
        dto.put("discount_amount", o.getDiscountAmount());
        dto.put("tax_amount", o.getTaxAmount());
        dto.put("total_amount", o.getTotalAmount());
        dto.put("notes", o.getNotes());
        dto.put("created_at", o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);

        if (o.getCustomer() != null) {
            dto.put("customer_id", o.getCustomer().getId().toString());
            dto.put("recipient_name", o.getCustomer().getName());
            dto.put("recipient_phone", o.getCustomer().getPhone());
            dto.put("delivery_address", o.getCustomer().getAddress());
            dto.put("township", o.getCustomer().getTownship());
            dto.put("customer_name", o.getCustomer().getName());
            dto.put("customer_phone", o.getCustomer().getPhone());
        }

        List<Map<String, Object>> itemList = new ArrayList<>();
        if (o.getItems() != null) {
            for (OrderItem item : o.getItems()) {
                Map<String, Object> iMap = new HashMap<>();
                iMap.put("id", item.getId().toString());
                iMap.put("product_name", item.getProductName());
                iMap.put("quantity", item.getQuantity());
                iMap.put("unit_price", item.getUnitPrice());
                iMap.put("total_price", item.getTotalPrice());
                if (item.getProduct() != null) {
                    iMap.put("product_id", item.getProduct().getId().toString());
                }
                itemList.add(iMap);
            }
        }
        dto.put("items", itemList);
        return dto;
    }
}
