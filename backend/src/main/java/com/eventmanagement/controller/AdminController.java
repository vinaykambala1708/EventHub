package com.eventmanagement.controller;

import com.eventmanagement.dto.EventDto;
import com.eventmanagement.dto.UserDto;
import com.eventmanagement.dto.RegistrationDto;
import com.eventmanagement.repository.RegistrationRepository;
import com.eventmanagement.service.EventService;
import com.eventmanagement.service.UserService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final EventService eventService;
    private final UserService userService;
    private final RegistrationRepository registrationRepository;

    public AdminController(EventService eventService, UserService userService, RegistrationRepository registrationRepository) {
        this.eventService = eventService;
        this.userService = userService;
        this.registrationRepository = registrationRepository;
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventDto>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEventsForAdmin());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers().stream().map(userService::toDto).toList());
    }

    @GetMapping("/registrations")
    @Transactional(readOnly = true)
    public ResponseEntity<List<RegistrationDto>> getAllRegistrations() {
        return ResponseEntity.ok(registrationRepository.findAll().stream().map(registration -> new RegistrationDto(
            registration.getId(),
            registration.getUser().getId(),
            registration.getEvent().getId(),
            registration.getStatus(),
            registration.getUser().getName(),
            registration.getTicketCode()
        )).toList());
    }

    @PutMapping("/events/{id}/approve")
    public ResponseEntity<EventDto> approveEvent(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.approveEvent(id));
    }

    @PutMapping("/events/{id}/reject")
    public ResponseEntity<EventDto> rejectEvent(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.rejectEvent(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}/organizer")
    public ResponseEntity<UserDto> promoteToOrganizer(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toDto(userService.promoteToOrganizer(id)));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
