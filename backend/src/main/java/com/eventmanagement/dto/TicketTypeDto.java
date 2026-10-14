package com.eventmanagement.dto;

public record TicketTypeDto(
    Long id,
    String name,
    Long pricePaise,
    Integer capacity,
    Integer available
) {
}
