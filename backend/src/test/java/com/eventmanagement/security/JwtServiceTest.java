package com.eventmanagement.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {
    @Test
    void rejectsSigningSecretsShorterThan256Bits() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "too-short");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 60_000L);

        assertThrows(IllegalStateException.class, jwtService::init);
    }

    @Test
    void rejectsNonPositiveTokenLifetime() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "a".repeat(32));
        ReflectionTestUtils.setField(jwtService, "expirationMs", 0L);

        assertThrows(IllegalStateException.class, jwtService::init);
    }

    @Test
    void issuesAndValidatesTokensWithStrongSecret() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "a".repeat(32));
        ReflectionTestUtils.setField(jwtService, "expirationMs", 60_000L);
        jwtService.init();
        var principal = User.withUsername("person@example.test")
            .password("encoded")
            .authorities("ROLE_USER")
            .build();

        String token = jwtService.generateToken(principal);

        assertTrue(jwtService.isTokenValid(token, principal));
    }

    @Test
    void rejectsExpiredTokens() throws InterruptedException {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", "a".repeat(32));
        ReflectionTestUtils.setField(jwtService, "expirationMs", 1L);
        jwtService.init();
        var principal = User.withUsername("person@example.test")
            .password("encoded")
            .authorities("ROLE_USER")
            .build();
        String token = jwtService.generateToken(principal);
        Thread.sleep(20);

        assertThrows(ExpiredJwtException.class, () -> jwtService.isTokenValid(token, principal));
    }
}
