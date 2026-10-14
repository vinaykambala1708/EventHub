package com.eventmanagement.controller;

import com.eventmanagement.dto.CheckInRequest;
import com.eventmanagement.dto.RegisterTicketsRequest;
import com.eventmanagement.dto.RegistrationDto;
import com.eventmanagement.service.RegistrationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RegistrationController {
    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/registrations/events/{eventId}")
    public ResponseEntity<List<RegistrationDto>> register(
        @PathVariable Long eventId,
        @Valid @RequestBody RegisterTicketsRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(registrationService.registerForEvent(eventId, request.ticketTypeId(), request.quantity()));
    }

    @GetMapping("/registrations/my")
    public ResponseEntity<List<RegistrationDto>> myRegistrations() {
        return ResponseEntity.ok(registrationService.getMyRegistrations());
    }

    @GetMapping("/registrations/event/{eventId}")
    public ResponseEntity<List<RegistrationDto>> eventRegistrations(@PathVariable Long eventId) {
        return ResponseEntity.ok(registrationService.getEventRegistrations(eventId));
    }

    @PostMapping("/registrations/check-in")
    public ResponseEntity<RegistrationDto> checkIn(@Valid @RequestBody CheckInRequest request) {
        return ResponseEntity.ok(registrationService.checkIn(request.ticketCode(), request.eventId()));
    }

    @DeleteMapping("/registrations/{registrationId}")
    public ResponseEntity<Void> cancel(@PathVariable Long registrationId) {
        registrationService.cancelRegistration(registrationId);
        return ResponseEntity.noContent().build();
    }
}
