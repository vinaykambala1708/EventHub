package com.eventmanagement.service;

import com.eventmanagement.dto.RegistrationDto;
import com.eventmanagement.entity.Event;
import com.eventmanagement.entity.Registration;
import com.eventmanagement.entity.TicketType;
import com.eventmanagement.entity.User;
import com.eventmanagement.enums.Role;
import com.eventmanagement.exception.ApiException;
import com.eventmanagement.repository.EventRepository;
import com.eventmanagement.repository.RegistrationRepository;
import com.eventmanagement.repository.TicketTypeRepository;
import java.util.List;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class RegistrationService {
    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserService userService;
    private final TicketTypeRepository ticketTypeRepository;

    public RegistrationService(
        RegistrationRepository registrationRepository,
        EventRepository eventRepository,
        UserService userService,
        TicketTypeRepository ticketTypeRepository
    ) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userService = userService;
        this.ticketTypeRepository = ticketTypeRepository;
    }

    @Transactional
    public List<RegistrationDto> registerForEvent(Long eventId, Long ticketTypeId, int quantity) {
        User currentUser = userService.getAuthenticatedUser();
        if (currentUser.getRole() != Role.USER) {
            throw new ApiException("Only regular users can register for events.");
        }
        Event event = eventRepository.findByIdForUpdate(eventId)
            .orElseThrow(() -> ApiException.notFound("Event not found."));

        if (!"APPROVED".equalsIgnoreCase(event.getStatus().name())) {
            throw new ApiException("This event is not approved for registration yet.");
        }

        if (registrationRepository.existsByUserIdAndEventId(currentUser.getId(), eventId)) {
            throw ApiException.conflict("You already have a registration for this event.");
        }

        if (quantity < 1 || quantity > 10) {
            throw new ApiException("You can reserve between 1 and 10 tickets at a time.");
        }
        if (registrationRepository.countByEventId(eventId) + quantity > event.getSeats()) {
            throw new ApiException("There are not enough seats remaining for this event.");
        }

        TicketType ticketType = ticketTypeRepository.findByIdForUpdate(ticketTypeId)
            .orElseThrow(() -> ApiException.notFound("Ticket type not found."));
        if (!eventId.equals(ticketType.getEvent().getId())) {
            throw new ApiException("The selected ticket type does not belong to this event.");
        }
        long sold = registrationRepository.countByTicketTypeIdAndStatusIn(
            ticketType.getId(), List.of("CONFIRMED", "CHECKED_IN")
        );
        if (sold + quantity > ticketType.getCapacity()) {
            throw new ApiException("There are not enough tickets remaining in this tier.");
        }

        List<Registration> tickets = new ArrayList<>();
        for (int i = 0; i < quantity; i++) {
            Registration registration = new Registration();
            registration.setUser(currentUser);
            registration.setEvent(event);
            registration.setTicketType(ticketType);
            registration.setStatus("CONFIRMED");
            tickets.add(registration);
        }
        return registrationRepository.saveAll(tickets).stream().map(this::toDto).toList();
    }

    @Transactional
    public List<RegistrationDto> getMyRegistrations() {
        User currentUser = userService.getAuthenticatedUser();
        return registrationRepository.findByUserId(currentUser.getId()).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public List<RegistrationDto> getEventRegistrations(Long eventId) {
        User currentUser = userService.getAuthenticatedUser();
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> ApiException.notFound("Event not found."));

        if (!currentUser.getId().equals(event.getOrganizer().getId()) && !currentUser.getRole().name().equals("ADMIN")) {
            throw ApiException.forbidden("You are not allowed to view registrations for this event.");
        }

        return registrationRepository.findByEventId(eventId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public RegistrationDto checkIn(String ticketCode, Long expectedEventId) {
        String normalizedCode = ticketCode.trim().toLowerCase(Locale.ROOT);
        try {
            if (!UUID.fromString(normalizedCode).toString().equals(normalizedCode)) {
                throw new ApiException("This ticket reference is invalid.");
            }
        } catch (IllegalArgumentException ex) {
            throw new ApiException("This ticket reference is invalid.");
        }

        Registration registration = registrationRepository.findByTicketCodeForUpdate(normalizedCode)
            .orElseThrow(() -> new ApiException("This ticket could not be found."));
        Event event = registration.getEvent();
        if (event == null || expectedEventId == null ||
            !expectedEventId.equals(event.getId())) {
            throw new ApiException("This ticket is for a different event.");
        }

        User currentUser = userService.getAuthenticatedUser();
        if (currentUser.getRole() != Role.ADMIN &&
            (currentUser.getRole() != Role.ORGANIZER ||
                !currentUser.getId().equals(event.getOrganizer().getId()))) {
            throw ApiException.forbidden("You are not allowed to check in attendees for this event.");
        }

        if ("CHECKED_IN".equals(registration.getStatus())) {
            throw ApiException.conflict("This ticket has already been checked in.");
        }
        if (!"CONFIRMED".equals(registration.getStatus())) {
            throw new ApiException("This ticket is not valid for entry.");
        }

        registration.setStatus("CHECKED_IN");
        return toDto(registrationRepository.save(registration));
    }

    @Transactional
    public void cancelRegistration(Long registrationId) {
        Registration registration = registrationRepository.findById(registrationId)
            .orElseThrow(() -> ApiException.notFound("Registration not found."));
        User currentUser = userService.getAuthenticatedUser();

        if (!currentUser.getId().equals(registration.getUser().getId()) && !currentUser.getRole().name().equals("ADMIN")) {
            throw ApiException.forbidden("You cannot cancel this registration.");
        }

        registrationRepository.delete(registration);
    }

    private RegistrationDto toDto(Registration registration) {
        if (registration.getTicketCode() == null) {
            registration.setTicketCode(UUID.randomUUID().toString());
            registrationRepository.save(registration);
        }
        User attendee = registration.getUser();
        Event event = registration.getEvent();
        return new RegistrationDto(
            registration.getId(),
            attendee != null ? attendee.getId() : null,
            event != null ? event.getId() : null,
            registration.getStatus(),
            attendee != null ? attendee.getName() : null,
            registration.getTicketCode()
        );
    }

}
