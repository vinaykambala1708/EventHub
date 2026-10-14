package com.eventmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CheckInRequest(
    @NotBlank @Size(max = 36) String ticketCode,
    @NotNull Long eventId
) {
}
