package com.eventmanagement.repository;

import com.eventmanagement.entity.Event;
import com.eventmanagement.entity.Registration;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select registration from Registration registration where registration.id = :registrationId")
    Optional<Registration> findByIdForUpdate(@Param("registrationId") Long registrationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select registration from Registration registration where registration.ticketCode = :ticketCode")
    Optional<Registration> findByTicketCodeForUpdate(@Param("ticketCode") String ticketCode);

    List<Registration> findByUserId(Long userId);
    List<Registration> findByEventId(Long eventId);
    boolean existsByUserIdAndEventId(Long userId, Long eventId);
    void deleteByUserId(Long userId);
    void deleteByEventId(Long eventId);
    long countByEventId(Long eventId);
    long countByTicketTypeIdAndStatusIn(Long ticketTypeId, List<String> statuses);
}
