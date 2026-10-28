package com.syswind.repository;

import com.syswind.entity.StoredImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StoredImageRepository extends JpaRepository<StoredImage, UUID> {
}
