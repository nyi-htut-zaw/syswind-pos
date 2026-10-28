package com.syswind.repository;

import com.syswind.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID>, JpaSpecificationExecutor<Category> {
    List<Category> findByOrganizationIdAndIsActiveTrueOrderByNameAsc(UUID organizationId);
    List<Category> findByIsActiveTrueOrderByNameAsc();
}
