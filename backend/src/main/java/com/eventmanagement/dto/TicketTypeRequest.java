package com.eventmanagement.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TicketTypeRequest(
    @NotBlank @Size(max = 100) String name,
    @NotNull @Min(0) Long pricePaise,
    @NotNull @Min(1) Integer capacity
) {
}
