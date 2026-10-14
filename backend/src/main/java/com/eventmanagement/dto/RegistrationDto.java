package com.eventmanagement.dto;

public record RegistrationDto(
    Long id,
    Long userId,
    Long eventId,
    String status,
    String userName,
    String ticketCode
) {
}
