package com.syswind.config;

import com.syswind.entity.User;
import com.syswind.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class SecurityHelper {

    @Autowired
    private UserRepository userRepository;

    public Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Claims claims) {
            String userIdStr = claims.getSubject();
            try {
                return userRepository.findById(UUID.fromString(userIdStr));
            } catch (Exception ignored) {}
        }
        return Optional.empty();
    }

    public boolean isSysadmin(User user) {
        return user != null && "SYSADMIN".equalsIgnoreCase(user.getRole());
    }

    public UUID getTenantOrganizationId(User user) {
        if (user != null && user.getOrganization() != null) {
            return user.getOrganization().getId();
        }
        return null;
    }
}
