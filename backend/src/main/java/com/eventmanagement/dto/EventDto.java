package com.eventmanagement.dto;

import com.eventmanagement.enums.EventStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record EventDto(Long id, String title, String description, String imageUrl, String category, LocalDate date, LocalTime time, String venue, Integer seats, EventStatus status, Long organizerId, String organizerName, List<TicketTypeDto> ticketTypes) {
}
