package com.eventmanagement.controller;

import com.eventmanagement.dto.EventDto;
import com.eventmanagement.dto.EventRequest;
import com.eventmanagement.service.EventService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventDto>> getApprovedEvents() {
        return ResponseEntity.ok(eventService.getAllApprovedEvents());
    }

    @GetMapping("/events/search")
    public ResponseEntity<List<EventDto>> search(@RequestParam(defaultValue = "") String keyword) {
        String normalized = keyword.trim().toLowerCase(java.util.Locale.ROOT);
        return ResponseEntity.ok(eventService.getAllApprovedEvents().stream()
            .filter(event -> normalized.isBlank() || event.title().toLowerCase(java.util.Locale.ROOT).contains(normalized)
                || event.description().toLowerCase(java.util.Locale.ROOT).contains(normalized)
                || event.venue().toLowerCase(java.util.Locale.ROOT).contains(normalized))
            .toList());
    }

    @GetMapping("/events/category/{category}")
    public ResponseEntity<List<EventDto>> byCategory(@PathVariable String category) {
        return ResponseEntity.ok(eventService.getAllApprovedEvents().stream()
            .filter(event -> event.category().equalsIgnoreCase(category)).toList());
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<EventDto> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @PostMapping("/events")
    public ResponseEntity<EventDto> createEvent(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(request));
    }

    @GetMapping("/events/my")
    public ResponseEntity<List<EventDto>> getMyEvents() {
        return ResponseEntity.ok(eventService.getEventsByOrganizer());
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<EventDto> updateEvent(@PathVariable Long id, @Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
