package com.eventmanagement.service;

import com.eventmanagement.dto.EventDto;
import com.eventmanagement.dto.EventRequest;
import com.eventmanagement.dto.TicketTypeDto;
import com.eventmanagement.entity.Event;
import com.eventmanagement.entity.TicketType;
import com.eventmanagement.entity.User;
import com.eventmanagement.enums.EventStatus;
import com.eventmanagement.exception.ApiException;
import com.eventmanagement.repository.EventRepository;
import com.eventmanagement.repository.RegistrationRepository;
import com.eventmanagement.repository.TicketTypeRepository;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserService userService;
    private final TicketTypeRepository ticketTypeRepository;

    public EventService(
        EventRepository eventRepository,
        RegistrationRepository registrationRepository,
        UserService userService,
        TicketTypeRepository ticketTypeRepository
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userService = userService;
        this.ticketTypeRepository = ticketTypeRepository;
    }

    public List<EventDto> getAllApprovedEvents() {
        return eventRepository.findByStatus(EventStatus.APPROVED).stream().map(this::toDto).collect(Collectors.toList());
    }

    public EventDto getEventById(Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Event not found."));
        if (event.getStatus() != EventStatus.APPROVED) {
            User current = userService.getAuthenticatedUser();
            boolean owner = event.getOrganizer().getId().equals(current.getId());
            if (!owner && current.getRole() != com.eventmanagement.enums.Role.ADMIN) {
                throw ApiException.notFound("Event not found.");
            }
        }
        return toDto(event);
    }

    @Transactional
    public EventDto createEvent(EventRequest request) {
        validateTicketTypes(request);
        User organizer = userService.getAuthenticatedUser();
        Event event = new Event();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setImageUrl(resolveImageUrl(request.imageUrl(), request.category()));
        event.setCategory(request.category());
        event.setDate(request.date());
        event.setTime(request.time());
        event.setVenue(request.venue());
        event.setSeats(request.seats());
        event.setOrganizer(organizer);
        event.setStatus(EventStatus.PENDING);
        event = eventRepository.save(event);
        saveTicketTypes(event, request);
        return toDto(event);
    }

    @Transactional
    public EventDto updateEvent(Long id, EventRequest request) {
        validateTicketTypes(request);
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Event not found."));
        User currentUser = userService.getAuthenticatedUser();

        if (!currentUser.getId().equals(event.getOrganizer().getId()) && !currentUser.getRole().name().equals("ADMIN")) {
            throw ApiException.forbidden("You are not allowed to update this event.");
        }

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setImageUrl(resolveImageUrl(request.imageUrl(), request.category()));
        event.setCategory(request.category());
        event.setDate(request.date());
        event.setTime(request.time());
        event.setVenue(request.venue());
        if (registrationRepository.countByEventId(id) > request.seats()) {
            throw new ApiException("Event capacity cannot be lower than its existing registrations.");
        }
        event.setSeats(request.seats());
        event.setStatus(EventStatus.PENDING);
        updateTicketTypes(event, request);
        return toDto(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Event not found."));
        User currentUser = userService.getAuthenticatedUser();

        if (!currentUser.getId().equals(event.getOrganizer().getId()) && !currentUser.getRole().name().equals("ADMIN")) {
            throw ApiException.forbidden("You are not allowed to delete this event.");
        }

        registrationRepository.deleteByEventId(id);
        eventRepository.delete(event);
    }

    public List<EventDto> getEventsByOrganizer() {
        User organizer = userService.getAuthenticatedUser();
        return eventRepository.findByOrganizerId(organizer.getId()).stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<EventDto> getAllEventsForAdmin() {
        return eventRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public EventDto approveEvent(Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Event not found."));
        event.setStatus(EventStatus.APPROVED);
        return toDto(eventRepository.save(event));
    }

    public EventDto rejectEvent(Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Event not found."));
        event.setStatus(EventStatus.REJECTED);
        return toDto(eventRepository.save(event));
    }

    private EventDto toDto(Event event) {
        User organizer = event.getOrganizer();
        return new EventDto(
            event.getId(),
            event.getTitle(),
            event.getDescription(),
            resolveImageUrl(event.getImageUrl(), event.getCategory()),
            event.getCategory(),
            event.getDate(),
            event.getTime(),
            event.getVenue(),
            event.getSeats(),
            event.getStatus(),
            organizer != null ? organizer.getId() : null,
            organizer != null ? organizer.getName() : "Organizer",
            ticketTypeRepository.findByEventId(event.getId()).stream()
                .map(ticketType -> {
                    long sold = registrationRepository.countByTicketTypeIdAndStatusIn(
                        ticketType.getId(), List.of("CONFIRMED", "CHECKED_IN")
                    );
                    int available = (int) Math.max(0, ticketType.getCapacity() - sold);
                    return new TicketTypeDto(
                        ticketType.getId(), ticketType.getName(), ticketType.getPricePaise(),
                        ticketType.getCapacity(), available
                    );
                })
                .toList()
        );
    }

    private void validateTicketTypes(EventRequest request) {
        long totalCapacity = request.ticketTypes().stream()
            .mapToLong(type -> type.capacity() == null ? 0 : type.capacity())
            .sum();
        if (totalCapacity > request.seats()) {
            throw new ApiException("Ticket tier capacities cannot exceed total event seats.");
        }
        long distinctNames = request.ticketTypes().stream()
            .map(type -> type.name().trim().toLowerCase(Locale.ROOT))
            .distinct()
            .count();
        if (distinctNames != request.ticketTypes().size()) {
            throw new ApiException("Ticket tier names must be unique within an event.");
        }
    }

    private void saveTicketTypes(Event event, EventRequest request) {
        List<TicketType> ticketTypes = request.ticketTypes().stream().map(type -> {
            TicketType ticketType = new TicketType();
            ticketType.setEvent(event);
            ticketType.setName(type.name().trim());
            ticketType.setPricePaise(type.pricePaise());
            ticketType.setCapacity(type.capacity());
            return ticketType;
        }).toList();
        ticketTypeRepository.saveAll(ticketTypes);
    }

    private void updateTicketTypes(Event event, EventRequest request) {
        List<TicketType> existing = ticketTypeRepository.findByEventId(event.getId());
        List<com.eventmanagement.dto.TicketTypeRequest> requested = request.ticketTypes();
        int shared = Math.min(existing.size(), requested.size());
        List<String> soldStatuses = List.of("CONFIRMED", "CHECKED_IN");

        for (int index = 0; index < shared; index++) {
            TicketType type = existing.get(index);
            var changes = requested.get(index);
            long sold = registrationRepository.countByTicketTypeIdAndStatusIn(type.getId(), soldStatuses);
            if (sold > changes.capacity()) {
                throw new ApiException("A ticket tier capacity cannot be lower than tickets already reserved.");
            }
            type.setName(changes.name().trim());
            type.setPricePaise(changes.pricePaise());
            type.setCapacity(changes.capacity());
            ticketTypeRepository.save(type);
        }

        for (int index = shared; index < requested.size(); index++) {
            var changes = requested.get(index);
            TicketType type = new TicketType();
            type.setEvent(event);
            type.setName(changes.name().trim());
            type.setPricePaise(changes.pricePaise());
            type.setCapacity(changes.capacity());
            ticketTypeRepository.save(type);
        }

        for (int index = shared; index < existing.size(); index++) {
            TicketType type = existing.get(index);
            if (registrationRepository.countByTicketTypeIdAndStatusIn(type.getId(), soldStatuses) > 0) {
                throw new ApiException("A ticket tier with existing reservations cannot be removed.");
            }
            ticketTypeRepository.delete(type);
        }
    }

    private String resolveImageUrl(String imageUrl, String category) {
        if (imageUrl != null && !imageUrl.isBlank()) {
            return imageUrl;
        }

        return switch (category.toLowerCase(Locale.ROOT)) {
            case "business" -> "/images/events/photos/creative-business-expo.jpg";
            case "health" -> "/images/events/photos/city-marathon-2026.jpg";
            case "finance" -> "/images/events/photos/startup-pitch-night.jpg";
            case "entertainment" -> "/images/events/photos/sunset-music-festival.jpg";
            case "food" -> "/images/events/photos/community-food-fair.jpg";
            case "culture" -> "/images/events/photos/cultural-heritage-night.jpg";
            case "education" -> "/images/events/photos/digital-skills-for-everyone.jpg";
            default -> "/images/events/photos/tech-career-summit.jpg";
        };
    }
}
