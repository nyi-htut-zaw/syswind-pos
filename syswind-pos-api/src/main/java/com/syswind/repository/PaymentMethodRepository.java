package com.syswind.repository;

import com.syswind.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, UUID> {
    @Query("SELECT pm FROM PaymentMethod pm WHERE pm.organization.id = :orgId OR pm.organization IS NULL ORDER BY pm.sortOrder ASC, pm.name ASC")
    List<PaymentMethod> findByOrganizationOrGlobal(@Param("orgId") UUID orgId);

    List<PaymentMethod> findAllByOrderBySortOrderAscNameAsc();
}
