CREATE TABLE ticket_types (
    id BIGINT NOT NULL AUTO_INCREMENT,
    event_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price_paise BIGINT NOT NULL,
    capacity INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_ticket_types_event_name UNIQUE (event_id, name),
    CONSTRAINT fk_ticket_types_event FOREIGN KEY (event_id) REFERENCES events (id)
);

INSERT INTO ticket_types (event_id, name, price_paise, capacity)
SELECT id, 'General Admission', 0, seats
FROM events;

ALTER TABLE registrations
    DROP INDEX uk_registrations_user_event,
    ADD COLUMN ticket_type_id BIGINT NULL,
    ADD CONSTRAINT fk_registrations_ticket_type FOREIGN KEY (ticket_type_id) REFERENCES ticket_types (id);

UPDATE registrations registration
JOIN ticket_types ticket_type ON ticket_type.event_id = registration.event_id
SET registration.ticket_type_id = ticket_type.id
WHERE ticket_type.name = 'General Admission';

CREATE INDEX idx_ticket_types_event ON ticket_types (event_id);
