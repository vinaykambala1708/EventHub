package com.eventmanagement.dto;

public record AuthResponse(String token, UserDto user) {
}
