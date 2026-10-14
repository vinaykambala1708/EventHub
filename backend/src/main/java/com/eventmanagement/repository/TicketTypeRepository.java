package com.eventmanagement.repository;

import com.eventmanagement.entity.TicketType;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketTypeRepository extends JpaRepository<TicketType, Long> {
    List<TicketType> findByEventId(Long eventId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ticketType from TicketType ticketType where ticketType.id = :ticketTypeId")
    Optional<TicketType> findByIdForUpdate(@Param("ticketTypeId") Long ticketTypeId);
}
