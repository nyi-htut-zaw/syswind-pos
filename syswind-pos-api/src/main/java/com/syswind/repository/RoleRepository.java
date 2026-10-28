package com.syswind.repository;

import com.syswind.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByNameIgnoreCase(String name);
    Optional<Role> findByName(String name);

    Optional<Role> findByNameIgnoreCaseAndOrganizationId(String name, UUID organizationId);
    Optional<Role> findByNameIgnoreCaseAndOrganizationIsNull(String name);

    List<Role> findByOrganizationIdOrderByIsSystemDescCreatedAtAsc(UUID organizationId);

    @Query("SELECT r FROM Role r WHERE r.organization.id = :orgId OR r.organization IS NULL ORDER BY r.isSystem DESC, r.name ASC")
    List<Role> findByOrganizationOrGlobal(@Param("orgId") UUID orgId);

    List<Role> findAllByOrderByIsSystemDescCreatedAtAsc();
}
