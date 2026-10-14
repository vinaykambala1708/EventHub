# EventHub

EventHub is a full stack event booking project with a React/Vite client and a Spring Boot REST API. It supports public event discovery, JWT sign in, organizer event submissions and attendee management, administrator moderation, ticket tiers, booking cancellation, and QR ticket check-in.

## Stack and structure

- Java 17, Spring Boot 3.3, Spring Security, JPA, Bean Validation, Flyway, MySQL Connector/J, Maven
- React 19, Vite, JavaScript, React Router, Axios, CSS
- Aiven Cloud MySQL is the only runtime database. There is no local MySQL or H2 fallback.

```text
backend/   Spring Boot API, JPA entities, Flyway migrations, tests
frontend/  React application and Vite development server
.env.example  placeholders for local PowerShell setup
```

React Router provides client URLs for public event pages, role dashboards, organizer event tools, and admin sections. Axios requests are centralized in `frontend/src/services/api.js` with bearer-token and expired-session handling.

## Prerequisites

Use Java 17+, Maven 3.9+, Node.js 20.19+ or 22.12+, and npm. Check versions in PowerShell:

```powershell
java -version
mvn -version
node -v
npm -v
```

If `mvn` is not on PATH, the workspace includes a helper that uses the local Maven cache: `cd backend; .\mvnw.ps1 -version`. It does not download Maven. Set `JAVA_HOME` to the installed JDK if the `java` shim is broken.

## Aiven MySQL setup

1. In the Aiven Console, open the MySQL service and its **Overview** page. Copy the host and port from **Connection information**. Use the displayed database name and service username, and obtain or reset the user's password in the service's user controls.
2. Create a database for EventHub or use the service's displayed default database. The user needs permission to create and alter tables for the Flyway migrations and Hibernate schema update.
3. Copy `.env.example` to an ignored local file if desired, but remember Spring Boot does not load `.env` automatically. Set variables in the same PowerShell window used to start Spring. Do not paste secrets into Vite variables.

Aiven's Java connection example uses TLS with `sslmode=require`. Connector/J's corresponding URL option is `sslMode=REQUIRED`; it encrypts traffic without verifying the server certificate. For certificate verification, Aiven for MySQL requires the project CA with `VERIFY_CA` or `VERIFY_IDENTITY`. Download **CA Certificate** from the service Overview page and import it to a local Java truststore using `keytool`; keep the certificate and truststore out of Git. Then append Connector/J's `trustCertificateKeyStoreUrl` and `trustCertificateKeyStorePassword` properties to `DB_URL` and set `sslMode=VERIFY_CA` (or `VERIFY_IDENTITY` to validate the hostname too). The exact requirement depends on the service and chosen SSL mode. See [Aiven's Java connection guide](https://aiven.io/docs/products/mysql/howto/connect-with-java) and [Aiven TLS certificate guide](https://aiven.io/docs/platform/concepts/tls-ssl-certificates).

The URL shape in `.env.example` is:

```text
jdbc:mysql://YOUR_AIVEN_HOST:YOUR_AIVEN_PORT/YOUR_DATABASE?sslMode=REQUIRED
```

Set PowerShell variables without printing their values:

```powershell
$env:DB_URL = 'jdbc:mysql://YOUR_AIVEN_HOST:YOUR_AIVEN_PORT/YOUR_DATABASE?sslMode=REQUIRED'
$env:DB_USERNAME = 'YOUR_AIVEN_USERNAME'
$env:DB_PASSWORD = 'YOUR_AIVEN_PASSWORD'
$env:JWT_SECRET = 'REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_BYTES'
```

Generate a JWT secret without echoing it to the terminal:

```powershell
$secretBytes = [byte[]]::new(48)
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($secretBytes)
$env:JWT_SECRET = [Convert]::ToBase64String($secretBytes)
$rng.Dispose()
```

The secret and database variables are required. Keep them out of source control, logs, screenshots, and `VITE_*` values. `.gitignore` excludes `.env` files and common private key/certificate formats.

## First administrator and organizer accounts

Public `POST /api/auth/register` always creates a `USER`, even if the request body includes another role. To initialize the first administrator, set these process variables for the first startup against a database that has no administrator:

```powershell
$env:BOOTSTRAP_ADMIN = 'true'
$env:APP_BOOTSTRAP_ADMIN_NAME = 'Your Admin Name'
$env:APP_BOOTSTRAP_ADMIN_EMAIL = 'admin@example.com'
$env:APP_BOOTSTRAP_ADMIN_PASSWORD = 'Use a unique password of at least 12 characters'
$env:APP_BOOTSTRAP_ADMIN_PHONE = '+1 555 010 0100'
```

The bootstrap fails if an administrator already exists or the email belongs to another account. After the first successful start, set `$env:BOOTSTRAP_ADMIN = 'false'` and remove the temporary admin variables. An administrator can grant organizer access from the user directory. Do not use sample credentials; no demo accounts are created.

## Run the application

In PowerShell terminal 1, set the variables above, then run:

```powershell
cd backend
mvn clean test
mvn spring-boot:run
```

If `mvn` is unavailable but the cached Maven distribution exists:

```powershell
.\mvnw.ps1 clean test
.\mvnw.ps1 spring-boot:run
```

In terminal 2:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` requests to `http://localhost:8080`. To point the browser directly at another API, set `VITE_API_BASE_URL` in `frontend/.env.local` (for example `https://api.example.com/api`) and restart Vite. Never put database credentials or the JWT secret in a Vite variable.

To serve the built frontend from Spring Boot, run `npm run build` in `frontend`; Vite writes the production bundle into `backend/src/main/resources/static`. Then restart the backend. The API health endpoint is `http://localhost:8080/actuator/health`.

## Optional sample events

Set `SAMPLE_EVENT_OWNER_EMAIL` in the root `.env` to the email of an existing account. The seeder leaves its role unchanged and creates ten approved Hyderabad sample events with free General Admission tickets. Restart the backend with `.\start-backend.ps1 -Restart` to seed or refresh the catalog.
## API reference

All endpoints use JSON unless otherwise noted. Send `Authorization: Bearer <JWT>` for authenticated routes.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create a USER and return a JWT |
| POST | `/api/auth/login` | Public | Authenticate and return a JWT/user summary |
| GET | `/api/auth/me` | Signed in | Return the current user |
| GET | `/api/events` | Public | List approved events |
| GET | `/api/events/search?keyword=` | Public | Search approved event title, description, and venue |
| GET | `/api/events/category/{category}` | Public | Filter approved events by category |
| GET | `/api/events/{id}` | Public/owner/admin | Read an approved event; pending events are visible only to their organizer/admin |
| POST | `/api/events` | ORGANIZER | Create a pending event with ticket tiers |
| GET | `/api/events/my` | ORGANIZER | List the current organizer's events |
| PUT | `/api/events/{id}` | Owner/admin | Update an event |
| DELETE | `/api/events/{id}` | Owner/admin | Delete an event and its registrations |
| POST | `/api/registrations/events/{eventId}` | USER | Reserve ticket tier quantity (1–10) |
| GET | `/api/registrations/my` | Signed in | List the current user's registrations |
| DELETE | `/api/registrations/{registrationId}` | Owner/admin | Cancel a registration |
| GET | `/api/registrations/event/{eventId}` | Event owner/admin | List registrations for one event |
| POST | `/api/registrations/check-in` | Event owner/admin | Validate ticket code and mark it checked in |
| GET | `/api/admin/users` | ADMIN | List users |
| GET | `/api/admin/events` | ADMIN | List all events |
| GET | `/api/admin/registrations` | ADMIN | List all registrations |
| PUT | `/api/admin/events/{id}/approve` | ADMIN | Approve an event |
| PUT | `/api/admin/events/{id}/reject` | ADMIN | Reject an event |
| PUT | `/api/admin/users/{id}/organizer` | ADMIN | Grant organizer role |
| DELETE | `/api/admin/users/{id}` | ADMIN | Delete a user; an admin cannot delete their own account |
| DELETE | `/api/admin/events/{id}` | ADMIN | Delete an event |
| GET | `/api/users/me` | Signed in | Read the current profile |

Validation failures return 400; invalid login/session returns 401; insufficient role/ownership returns 403; missing resources return 404; duplicate registrations return 409. Unexpected server errors use a generic response without stack traces or SQL details.

## Security notes

Passwords are BCrypt hashed. JWTs are signed with `JWT_SECRET`, expire after 24 hours by default, and are stored in browser localStorage by this student app. LocalStorage makes bearer tokens accessible to scripts running in the origin, so use a strong unique password and avoid untrusted browser extensions/scripts. The frontend clears the stored token and resets its session after an authenticated request returns 401. Backend authorization and organizer ownership checks remain authoritative.

## Tests and build checks

```powershell
cd backend
mvn clean test
cd ..\frontend
npm run build
npm run lint
```

The current backend tests cover JWT signing/expiry and registration check-in rules. The Aiven connection and live end-to-end flows can only be verified after valid Aiven details are configured.

## Troubleshooting

- **Missing datasource/JWT variables:** set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` in the same PowerShell window that starts Spring Boot.
- **TLS certificate error:** verify the Aiven URL and `sslMode`; for `VERIFY_CA`/`VERIFY_IDENTITY`, download the project's CA and configure Connector/J's truststore properties.
- **Connection refused or timeout:** confirm the Aiven service is running, the host/port are copied exactly, and the service's network access rules permit this machine.
- **Access denied from MySQL:** verify the database name, username, password, and database grants in Aiven.
- **401:** sign in again; JWTs expire after 24 hours by default.
- **403:** check your role and whether you own the event.
- **CORS:** the backend allows the Vite development origin `http://localhost:5173`; change `SecurityConfig` if you use another origin.
- **Port in use:** stop the existing process or set `PORT` before starting the backend.
- **Maven/java launcher issue:** set `JAVA_HOME` to a Java 17 JDK and use `backend/.\mvnw.ps1` when Maven is not on PATH.
