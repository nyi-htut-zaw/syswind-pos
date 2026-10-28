package com.syswind.service;

import com.syswind.entity.Organization;
import com.syswind.entity.Permission;
import com.syswind.entity.Role;
import com.syswind.entity.User;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface RoleService {
    List<Map<String, Object>> listRoles(User currentUser);
    Map<String, Object> listAllPermissions();
    Role createRole(Map<String, Object> request, User currentUser);
    Role updateRole(UUID id, Map<String, Object> request, User currentUser);
    void deleteRole(UUID id, User currentUser);
    void seedRolesForOrganization(Organization org);
}
