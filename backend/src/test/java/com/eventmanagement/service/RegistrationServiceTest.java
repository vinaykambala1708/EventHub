package com.eventmanagement.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.eventmanagement.dto.RegistrationDto;
import com.eventmanagement.entity.Event;
import com.eventmanagement.entity.Registration;
import com.eventmanagement.entity.User;
import com.eventmanagement.enums.Role;
import com.eventmanagement.enums.EventStatus;
import com.eventmanagement.exception.ApiException;
import com.eventmanagement.repository.EventRepository;
import com.eventmanagement.repository.RegistrationRepository;
import com.eventmanagement.repository.TicketTypeRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {
    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserService userService;

    @Mock
    private TicketTypeRepository ticketTypeRepository;

    @InjectMocks
    private RegistrationService registrationService;

    private User organizer;
    private User attendee;
    private Event event;
    private Registration registration;
    private final String ticketCode = "a5d441a6-6f10-4e23-8cf3-49ae82a01234";

    @BeforeEach
    void setUp() {
        organizer = new User();
        organizer.setId(4L);
        organizer.setRole(Role.ORGANIZER);

        attendee = new User();
        attendee.setId(22L);
        attendee.setName("Jordan Kim");

        event = new Event();
        event.setId(14L);
        event.setOrganizer(organizer);

        registration = new Registration();
        registration.setId(7L);
        registration.setUser(attendee);
        registration.setEvent(event);
        registration.setStatus("CONFIRMED");
        registration.setTicketCode(ticketCode);
    }

    @Test
    void checkInMarksMatchingBookingAndReturnsUpdatedStatus() {
        when(userService.getAuthenticatedUser()).thenReturn(organizer);
        when(registrationRepository.findByTicketCodeForUpdate(ticketCode)).thenReturn(Optional.of(registration));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegistrationDto result = registrationService.checkIn(ticketCode.toUpperCase(), 14L);

        assertEquals("CHECKED_IN", result.status());
        assertEquals("Jordan Kim", result.userName());
        assertEquals(ticketCode, result.ticketCode());
        assertEquals("CHECKED_IN", registration.getStatus());
    }

    @Test
    void checkInRejectsAlreadyUsedTicket() {
        registration.setStatus("CHECKED_IN");
        when(registrationRepository.findByTicketCodeForUpdate(ticketCode)).thenReturn(Optional.of(registration));
        when(userService.getAuthenticatedUser()).thenReturn(organizer);

        ApiException exception = assertThrows(
            ApiException.class,
            () -> registrationService.checkIn(ticketCode, 14L)
        );

        assertEquals("This ticket has already been checked in.", exception.getMessage());
    }

    @Test
    void checkInRejectsOrganizerWhoDoesNotOwnTheEvent() {
        User otherOrganizer = new User();
        otherOrganizer.setId(5L);
        otherOrganizer.setRole(Role.ORGANIZER);
        when(registrationRepository.findByTicketCodeForUpdate(ticketCode)).thenReturn(Optional.of(registration));
        when(userService.getAuthenticatedUser()).thenReturn(otherOrganizer);

        ApiException exception = assertThrows(
            ApiException.class,
            () -> registrationService.checkIn(ticketCode, 14L)
        );

        assertEquals("You are not allowed to check in attendees for this event.", exception.getMessage());
        assertEquals("CONFIRMED", registration.getStatus());
    }

    @Test
    void checkInRejectsMalformedTicketCode() {
        ApiException exception = assertThrows(
            ApiException.class,
            () -> registrationService.checkIn("not-a-ticket", 14L)
        );

        assertEquals("This ticket reference is invalid.", exception.getMessage());
    }

    @Test
    void checkInRejectsTicketForAnotherSelectedEvent() {
        when(registrationRepository.findByTicketCodeForUpdate(ticketCode)).thenReturn(Optional.of(registration));
        ApiException exception = assertThrows(
            ApiException.class,
            () -> registrationService.checkIn(ticketCode, 15L)
        );

        assertEquals("This ticket is for a different event.", exception.getMessage());
    }

    @Test
    void registrationRejectsASecondReservationForTheSameUserAndEvent() {
        attendee.setRole(Role.USER);
        event.setStatus(EventStatus.APPROVED);
        when(userService.getAuthenticatedUser()).thenReturn(attendee);
        when(eventRepository.findByIdForUpdate(14L)).thenReturn(Optional.of(event));
        when(registrationRepository.existsByUserIdAndEventId(22L, 14L)).thenReturn(true);

        ApiException exception = assertThrows(
            ApiException.class,
            () -> registrationService.registerForEvent(14L, 3L, 1)
        );

        assertEquals("You already have a registration for this event.", exception.getMessage());
    }
}
