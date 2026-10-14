ALTER TABLE registrations
    ADD COLUMN ticket_code VARCHAR(36) NULL;

UPDATE registrations
SET ticket_code = UUID()
WHERE ticket_code IS NULL;

ALTER TABLE registrations
    MODIFY COLUMN ticket_code VARCHAR(36) NOT NULL;

CREATE UNIQUE INDEX uk_registrations_ticket_code
    ON registrations (ticket_code);
