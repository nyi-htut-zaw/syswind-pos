package com.syswind.specification;

import com.syswind.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ProductSpecification {

    public static Specification<Product> filter(String search, UUID categoryId, UUID organizationId, Boolean lowStockOnly) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always only active products
            predicates.add(cb.isTrue(root.get("isActive")));

            // Multi-tenant isolation: filter by organization if specified
            if (organizationId != null) {
                predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
            }

            // Category filter
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // Search term (name, Burmese name, SKU, barcode)
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate nameMmMatch = cb.like(cb.lower(root.get("nameMm")), pattern);
                Predicate skuMatch = cb.like(cb.lower(root.get("sku")), pattern);
                Predicate barcodeMatch = cb.like(cb.lower(root.get("barcode")), pattern);
                predicates.add(cb.or(nameMatch, nameMmMatch, skuMatch, barcodeMatch));
            }

            // Low stock filter (stockQuantity <= lowStockThreshold)
            if (Boolean.TRUE.equals(lowStockOnly)) {
                predicates.add(cb.lessThanOrEqualTo(root.get("stockQuantity"), root.get("lowStockThreshold")));
            }

            query.orderBy(cb.asc(root.get("name")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
