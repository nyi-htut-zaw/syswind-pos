package com.syswind.specification;

import com.syswind.entity.Customer;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CustomerSpecification {

    public static Specification<Customer> filter(String search, String tier, UUID organizationId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Multi-tenant isolation
            if (organizationId != null) {
                predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
            }

            // Loyalty tier filter
            if (tier != null && !tier.trim().isEmpty() && !"ALL".equalsIgnoreCase(tier.trim())) {
                predicates.add(cb.equal(cb.upper(root.get("customerTier")), tier.trim().toUpperCase()));
            }

            // Search by name, phone, alternate phone, city, township, address
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate phoneMatch = cb.like(cb.lower(root.get("phone")), pattern);
                Predicate cityMatch = cb.like(cb.lower(root.get("city")), pattern);
                Predicate townshipMatch = cb.like(cb.lower(root.get("township")), pattern);
                predicates.add(cb.or(nameMatch, phoneMatch, cityMatch, townshipMatch));
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
