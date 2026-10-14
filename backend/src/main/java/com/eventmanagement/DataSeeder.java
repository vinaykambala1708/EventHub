package com.eventmanagement;

import com.eventmanagement.entity.Event;
import com.eventmanagement.entity.TicketType;
import com.eventmanagement.entity.User;
import com.eventmanagement.enums.EventStatus;
import com.eventmanagement.repository.EventRepository;
import com.eventmanagement.repository.TicketTypeRepository;
import com.eventmanagement.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/** Local sample catalog for testing backend event discovery and free ticket bookings. */
@Configuration
@Profile("sample-events")
public class DataSeeder {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private record Sample(String title, String description, String category, int capacity, LocalDate date, LocalTime time, String venue, String imageUrl) {}

    @Bean
    CommandLineRunner seedSampleEvents(
        UserRepository users,
        EventRepository events,
        TicketTypeRepository ticketTypes,
        @Value("${SAMPLE_EVENT_OWNER_EMAIL:}") String ownerEmail
    ) {
        return args -> {
            if (ownerEmail.isBlank()) {
                log.warn("Skipping sample events because SAMPLE_EVENT_OWNER_EMAIL is not configured.");
                return;
            }
            User owner = users.findByEmailIgnoreCase(ownerEmail.trim()).orElse(null);
            if (owner == null) {
                log.warn("SAMPLE_EVENT_OWNER_EMAIL does not match an existing account; skipping sample events.");
                return;
            }
            List<Sample> samples = List.of(
                new Sample(
                    "Hyderabad Dandiya Raas Night",
                    "Join a festive evening of dandiya raas, garba circles, live folk rhythms, and family-friendly dancing. Complimentary dandiya sticks are provided.",
                    "Cultural", 1800, LocalDate.of(2027, 10, 2), LocalTime.of(18, 30),
                    "Gachibowli Indoor Stadium, Gachibowli, Hyderabad, Telangana, India", "/images/events/photos/sunset-music-festival.jpg"
                ),
                new Sample(
                    "Deccan Beats: Live Music Evening",
                    "Enjoy an energetic live set blending Telugu favorites, indie pop, and acoustic fusion, performed by local Hyderabad artists.",
                    "Music", 1200, LocalDate.of(2027, 1, 16), LocalTime.of(19, 0),
                    "Shilpakala Vedika, Madhapur, Hyderabad, Telangana, India", "/images/events/photos/east-africa-indie-music-night.jpg"
                ),
                new Sample(
                    "Hyderabad AI, Cloud and Cybersecurity Summit",
                    "A full-day technology program with practical talks, product demonstrations, and networking for students, developers, and IT professionals.",
                    "Technology", 700, LocalDate.of(2027, 1, 30), LocalTime.of(9, 0),
                    "HITEX Exhibition Centre, Hall 3, Madhapur, Hyderabad, Telangana, India", "/images/events/photos/tech-career-summit.jpg"
                ),
                new Sample(
                    "CodeSprint Hyderabad: 24-Hour Hackathon",
                    "Build a working prototype in a team, get feedback from mentors, and present your solution at the closing showcase. Suitable for beginner and experienced coders.",
                    "Hackathon", 250, LocalDate.of(2027, 2, 20), LocalTime.of(9, 0),
                    "T-Hub, Raidurg, Hyderabad, Telangana, India", "/images/events/photos/build-your-first-mobile-app.jpg"
                ),
                new Sample(
                    "Telangana Food and Culture Festival",
                    "Explore regional street food, artisan stalls, folk performances, and family activities celebrating Telangana's local culture.",
                    "Food and Culture", 1500, LocalDate.of(2027, 2, 27), LocalTime.of(11, 0),
                    "People's Plaza, Necklace Road, Hyderabad, Telangana, India", "/images/events/photos/community-food-fair.jpg"
                ),
                new Sample(
                    "Robotics, Drones and IoT Innovation Expo",
                    "See student and startup demonstrations of robots, drones, and connected devices, with short talks on building real-world hardware projects.",
                    "Technology", 600, LocalDate.of(2027, 3, 13), LocalTime.of(10, 0),
                    "HITEX Exhibition Centre, Hall 2, Madhapur, Hyderabad, Telangana, India", "/images/events/photos/ai-automation-expo.jpg"
                ),
                new Sample(
                    "Hyderabad Startup Pitch and Networking Night",
                    "Early-stage founders pitch their ideas, meet mentors and investors, and connect with Hyderabad's startup community.",
                    "Business", 300, LocalDate.of(2027, 3, 27), LocalTime.of(17, 0),
                    "T-Hub, Raidurg, Hyderabad, Telangana, India", "/images/events/photos/startup-pitch-night.jpg"
                ),
                new Sample(
                    "Tollywood Melodies: Orchestra Night",
                    "A live orchestra performs memorable Telugu film melodies and popular South Indian songs in a concert-style evening.",
                    "Music", 1000, LocalDate.of(2027, 4, 10), LocalTime.of(18, 30),
                    "Ravindra Bharathi, Saifabad, Hyderabad, Telangana, India", "/images/events/photos/sunset-music-festival.jpg"
                ),
                new Sample(
                    "Charminar Heritage Photography Walk",
                    "Take a guided early-morning photo walk through the lanes around Charminar and Laad Bazaar, with tips on street, architecture, and portrait photography.",
                    "Photography", 35, LocalDate.of(2027, 4, 24), LocalTime.of(6, 30),
                    "Meeting point: East entrance of Charminar, Old City, Hyderabad, Telangana, India", "/images/events/photos/city-marathon-2026.jpg"
                ),
                new Sample(
                    "Hyderabad Women in Technology Meetup",
                    "A welcoming day of short tech talks, career stories, mentoring circles, and networking for women studying or working in technology.",
                    "Technology", 400, LocalDate.of(2027, 5, 15), LocalTime.of(10, 0),
                    "HICC, HITEC City, Hyderabad, Telangana, India", "/images/events/photos/women-in-business-breakfast.jpg"
                )
            );

            int seededCount = 0;
            int updatedCount = 0;
            for (Sample sample : samples) {
                Event event = events.findByTitle(sample.title()).orElse(null);
                boolean isNewEvent = event == null;
                if (isNewEvent) {
                    event = new Event();
                    seededCount++;
                } else {
                    updatedCount++;
                }
                event.setOrganizer(owner);
                event.setTitle(sample.title());
                event.setDescription(sample.description());
                event.setImageUrl(sample.imageUrl());
                event.setCategory(sample.category());
                event.setDate(sample.date());
                event.setTime(sample.time());
                event.setVenue(sample.venue());
                event.setSeats(sample.capacity());
                event.setStatus(EventStatus.APPROVED);
                event = events.save(event);

                if (ticketTypes.findByEventId(event.getId()).isEmpty()) {
                    TicketType general = new TicketType();
                    general.setEvent(event);
                    general.setName("General Admission");
                    general.setPricePaise(0L);
                    general.setCapacity(sample.capacity());
                    ticketTypes.save(general);
                }
            }
            log.info("Seeded {} and refreshed {} Hyderabad sample events with free bookable tickets under the configured account.", seededCount, updatedCount);
        };
    }
}
