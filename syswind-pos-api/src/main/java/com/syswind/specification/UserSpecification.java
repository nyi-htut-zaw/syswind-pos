package com.syswind.specification;

import com.syswind.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserSpecification {

    public static Specification<User> filter(String search, String role, UUID organizationId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Multi-tenant isolation: filter by organization if specified
            if (organizationId != null) {
                predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
            }

            // Role filter
            if (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role.trim())) {
                predicates.add(cb.equal(cb.upper(root.get("role")), role.trim().toUpperCase()));
            }

            // Search (username, email, full name, phone)
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate uName = cb.like(cb.lower(root.get("username")), pattern);
                Predicate mail = cb.like(cb.lower(root.get("email")), pattern);
                Predicate fName = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate ph = cb.like(cb.lower(root.get("phone")), pattern);
                predicates.add(cb.or(uName, mail, fName, ph));
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
