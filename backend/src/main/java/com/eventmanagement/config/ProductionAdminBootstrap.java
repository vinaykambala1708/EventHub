package com.eventmanagement.config;

import com.eventmanagement.entity.User;
import com.eventmanagement.enums.Role;
import com.eventmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@ConditionalOnProperty(name = "app.bootstrap-admin.enabled", havingValue = "true")
public class ProductionAdminBootstrap {
    @Bean
    CommandLineRunner createInitialAdmin(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        @Value("${app.bootstrap-admin.name}") String name,
        @Value("${app.bootstrap-admin.email}") String email,
        @Value("${app.bootstrap-admin.password}") String password,
        @Value("${app.bootstrap-admin.phone}") String phone
    ) {
        return args -> {
            if (name.isBlank() || email.isBlank() || password.isBlank() || phone.isBlank()) {
                throw new IllegalStateException(
                    "Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, and INITIAL_ADMIN_PHONE for the first production startup."
                );
            }
            if (password.length() < 12) {
                throw new IllegalStateException("INITIAL_ADMIN_PASSWORD must be at least 12 characters.");
            }

            User existingUser = userRepository.findByEmailIgnoreCase(email.trim()).orElse(null);
            if (existingUser != null) {
                if (existingUser.getRole() != Role.ADMIN) {
                    throw new IllegalStateException("The configured initial admin email already belongs to a non-admin account.");
                }
                return;
            }
        if (userRepository.existsByRole(Role.ADMIN)) {
            throw new IllegalStateException("An administrator already exists; first-admin bootstrap is only for an empty admin setup.");
        }

            User admin = new User();
            admin.setName(name.trim());
            admin.setEmail(email.trim().toLowerCase(java.util.Locale.ROOT));
            admin.setPassword(passwordEncoder.encode(password));
            admin.setPhone(phone.trim());
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        };
    }
}
