package com.eventmanagement.service;

import com.eventmanagement.dto.AuthRequest;
import com.eventmanagement.dto.AuthResponse;
import com.eventmanagement.dto.UserDto;
import com.eventmanagement.entity.User;
import com.eventmanagement.security.JwtService;
import java.util.Locale;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    public AuthResponse register(AuthRequest request) {
        User savedUser = userService.registerUser(
            request.name(),
            request.email(),
            request.password(),
            request.phone(),
            "USER"
        );

        UserDetails principal = org.springframework.security.core.userdetails.User.withUsername(savedUser.getEmail())
            .password(savedUser.getPassword())
            .authorities("ROLE_" + savedUser.getRole().name())
            .build();

        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, userService.toDto(savedUser));
    }

    public AuthResponse login(String email, String password) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(normalizedEmail, password)
        );

        User user = userService.getAllUsers().stream()
            .filter(u -> u.getEmail().equalsIgnoreCase(normalizedEmail))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("User not found."));

        String token = jwtService.generateToken((UserDetails) authentication.getPrincipal());
        return new AuthResponse(token, userService.toDto(user));
    }

    public UserDto getCurrentUser() {
        return userService.toDto(userService.getAuthenticatedUser());
    }
}
