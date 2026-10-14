CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    `role` VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(2000) NOT NULL,
    image_url VARCHAR(500),
    seats INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    time TIME(6) NOT NULL,
    title VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    organizer_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users (id)
);

CREATE TABLE registrations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    registered_at DATETIME(6) NOT NULL,
    status VARCHAR(255) NOT NULL,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_registrations_user_event UNIQUE (user_id, event_id),
    CONSTRAINT fk_registrations_event FOREIGN KEY (event_id) REFERENCES events (id),
    CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_events_organizer ON events (organizer_id);
CREATE INDEX idx_registrations_event ON registrations (event_id);
CREATE INDEX idx_registrations_user ON registrations (user_id);
