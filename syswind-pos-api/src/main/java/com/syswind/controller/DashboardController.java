package com.syswind.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> resp = new HashMap<>();
        try {
            Double totalRevenue = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'PAID'",
                    Double.class
            );

            Integer totalOrders = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM orders",
                    Integer.class
            );

            Integer pendingDeliveries = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM deliveries WHERE delivery_status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')",
                    Integer.class
            );

            Integer lowStockItems = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM products p
                    JOIN product_variants v ON v.product_id = p.id
                    WHERE p.is_active = true AND v.stock_quantity <= p.low_stock_threshold
                    """,
                    Integer.class
            );

            List<Map<String, Object>> recentOrders = jdbcTemplate.queryForList(
                    """
                    SELECT o.id, o.order_number, o.total_amount, o.order_status, o.payment_status,
                           o.created_at, c.full_name as customer_name
                    FROM orders o
                    LEFT JOIN customers c ON c.id = o.customer_id
                    ORDER BY o.created_at DESC
                    LIMIT 5
                    """
            );

            resp.put("success", true);
            resp.put("total_revenue", totalRevenue);
            resp.put("total_orders", totalOrders);
            resp.put("pending_deliveries", pendingDeliveries);
            resp.put("low_stock_items", lowStockItems);
            resp.put("recent_orders", recentOrders);

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }
}
