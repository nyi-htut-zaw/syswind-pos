package com.syswind.repository;

import com.syswind.entity.DeliveryProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryProviderRepository extends JpaRepository<DeliveryProvider, UUID> {
    @Query("SELECT dp FROM DeliveryProvider dp WHERE dp.organization.id = :orgId OR dp.organization IS NULL ORDER BY dp.name ASC")
    List<DeliveryProvider> findByOrganizationOrGlobal(@Param("orgId") UUID orgId);

    List<DeliveryProvider> findAllByOrderByNameAsc();
}
