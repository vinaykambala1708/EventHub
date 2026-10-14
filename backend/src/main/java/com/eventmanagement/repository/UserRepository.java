package com.eventmanagement.repository;

import com.eventmanagement.entity.User;
import com.eventmanagement.enums.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByRole(Role role);
    Optional<User> findFirstByRoleOrderByIdAsc(Role role);
}
