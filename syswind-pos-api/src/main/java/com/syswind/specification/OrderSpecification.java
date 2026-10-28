package com.syswind.specification;

import com.syswind.entity.Order;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class OrderSpecification {

    public static Specification<Order> filter(String search, String status, String paymentStatus, UUID organizationId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Multi-tenant isolation: filter by organization if specified
            if (organizationId != null) {
                predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
            }

            // Order status filter
            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
                predicates.add(cb.equal(cb.upper(root.get("orderStatus")), status.trim().toUpperCase()));
            }

            // Payment status filter
            if (paymentStatus != null && !paymentStatus.trim().isEmpty() && !"ALL".equalsIgnoreCase(paymentStatus.trim())) {
                predicates.add(cb.equal(cb.upper(root.get("paymentStatus")), paymentStatus.trim().toUpperCase()));
            }

            // Search by order number, customer name, phone
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate orderNum = cb.like(cb.lower(root.get("orderNumber")), pattern);
                Predicate custName = cb.like(cb.lower(root.get("customer").get("name")), pattern);
                Predicate custPhone = cb.like(cb.lower(root.get("customer").get("phone")), pattern);
                predicates.add(cb.or(orderNum, custName, custPhone));
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
