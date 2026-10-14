package com.eventmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;

public record EventRequest(
    @NotBlank String title,
    @NotBlank String description,
    @Size(max = 500)
    @Pattern(regexp = "^(https://[^\\s]+|/images/events/[A-Za-z0-9._/-]+)?$", message = "Use an HTTPS image URL or a local /images/events/ path.")
    String imageUrl,
    @NotBlank
    @Pattern(regexp = "Technical|Cultural|Sports|Workshop|Seminar|Conference|Hackathon|Fest|Other",
        message = "Choose a supported event category.")
    String category,
    @NotNull LocalDate date,
    @NotNull LocalTime time,
    @NotBlank String venue,
    @NotNull @Min(1) Integer seats,
    @NotEmpty @Valid List<TicketTypeRequest> ticketTypes
) {
}
