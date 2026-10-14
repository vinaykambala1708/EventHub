package com.eventmanagement.service;

import com.eventmanagement.dto.UserDto;
import com.eventmanagement.entity.User;
import com.eventmanagement.enums.Role;
import com.eventmanagement.exception.ApiException;
import com.eventmanagement.repository.RegistrationRepository;
import com.eventmanagement.repository.EventRepository;
import com.eventmanagement.repository.UserRepository;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
        UserRepository userRepository,
        RegistrationRepository registrationRepository,
        EventRepository eventRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(String name, String email, String password, String phone, String role) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw ApiException.conflict("User already exists with this email.");
        }

        User user = new User();
        user.setName(name.trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(password));
        user.setPhone(phone.trim());
        // Public registration must never grant a role supplied by a caller.
        user.setRole(Role.USER);
        return userRepository.save(user);
    }

    public User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> ApiException.notFound("Authenticated user not found."));
    }

    public Optional<User> getById(Long id) {
        return userRepository.findById(id);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User promoteToOrganizer(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("User not found."));
        if (user.getRole() == Role.ADMIN) {
            throw new ApiException("Administrator accounts cannot be changed to organizer accounts.");
        }
        user.setRole(Role.ORGANIZER);
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User current = getAuthenticatedUser();
        if (current.getId().equals(id)) {
            throw new ApiException("You cannot delete your own administrator account.");
        }
        User user = userRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("User not found."));
        registrationRepository.deleteByUserId(id);
        var ownedEvents = eventRepository.findByOrganizerId(id);
        ownedEvents.forEach(event -> registrationRepository.deleteByEventId(event.getId()));
        eventRepository.deleteAll(ownedEvents);
        userRepository.delete(user);
    }

    public User getVisibleUser(Long id) {
        User current = getAuthenticatedUser();
        if (!current.getId().equals(id) && current.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You are not allowed to view this user.");
        }
        return userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User not found."));
    }

    public UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole().name());
    }
}
