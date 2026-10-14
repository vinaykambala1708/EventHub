package com.eventmanagement.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RegisterTicketsRequest(
    @NotNull Long ticketTypeId,
    @NotNull @Min(1) @Max(10) Integer quantity
) {
}
