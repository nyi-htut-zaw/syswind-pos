package com.syswind.repository;

import com.syswind.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true AND p.stockQuantity <= p.lowStockThreshold")
    long countLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true AND p.organization.id = :orgId AND p.stockQuantity <= p.lowStockThreshold")
    long countLowStockProductsByOrg(UUID orgId);

    List<Product> findByIsActiveTrueOrderByNameAsc();
    List<Product> findByOrganizationIdAndIsActiveTrueOrderByNameAsc(UUID organizationId);
}
