package com.syswind.service;

import com.syswind.entity.Organization;
import com.syswind.entity.User;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationService {
    Map<String, Object> createOrganization(Map<String, Object> request, User currentUser);
    Organization updateOrganization(UUID id, Map<String, Object> request, User currentUser);
    List<Map<String, Object>> listOrganizations(User currentUser);
    Optional<Organization> getOrganizationById(UUID id);
    Optional<Organization> getCurrentOrganization(User currentUser);
}
