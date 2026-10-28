package com.syswind.specification;

import com.syswind.entity.AuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AuditSpecification {

    public static Specification<AuditLog> filter(String search, String action, String entityName, UUID organizationId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Multi-tenant organization isolation
            if (organizationId != null) {
                predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
            }

            // Action filter
            if (action != null && !action.trim().isEmpty() && !"ALL".equalsIgnoreCase(action.trim())) {
                predicates.add(cb.equal(cb.upper(root.get("action")), action.trim().toUpperCase()));
            }

            // Entity Name filter
            if (entityName != null && !entityName.trim().isEmpty() && !"ALL".equalsIgnoreCase(entityName.trim())) {
                predicates.add(cb.equal(cb.upper(root.get("entityName")), entityName.trim().toUpperCase()));
            }

            // Free text search
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate actionMatch = cb.like(cb.lower(root.get("action")), pattern);
                Predicate entityMatch = cb.like(cb.lower(root.get("entityName")), pattern);
                Predicate detailsMatch = cb.like(cb.lower(root.get("details")), pattern);
                predicates.add(cb.or(actionMatch, entityMatch, detailsMatch));
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
