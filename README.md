# Java Application Availability Monitoring and Docker Health Check

Independent implementation of assignment Q54, “Java Health Check”. This
project is deliberately separate from the parent `Project 2` application.
It combines a real React monitoring interface with a Java 25 Spring Boot API,
PostgreSQL persistence, and Docker Compose diagnostics.

## What it proves

The dashboard makes live HTTP requests; it does not invent Docker metrics.
It reports application status, Actuator readiness, database reachability, and
persisted probe history. Docker's own running/healthy state is inspected with
explicit read-only PowerShell commands on the Diagnostics page.

The distinction is intentional:

- `running` means the container process exists.
- Application probes show whether HTTP requests succeed.
- `healthy` means Docker's configured command recently succeeded.
- `unhealthy` means Docker's retries failed; the process may still be running.

## Architecture

```text
Browser :3000
    -> nginx frontend
    -> app :8080 (Spring Boot + Actuator)
       -> postgres:5432 (Compose DNS, persisted named volume)
```

The frontend proxy keeps browser requests same-origin in the production
Compose setup. The app exposes only `/actuator/health` from management.

## Prerequisites

- Windows 10/11 and PowerShell
- Docker Desktop with the Linux engine
- Java 25 and Maven 3.9+ for backend development
- Node.js 22+ and npm for frontend development

## Run with Docker Compose

```powershell
Set-Location "E:\aws\Project 2\java-health-monitor"
Copy-Item .env.example .env
docker compose build
docker compose up -d
docker compose ps
```

Wait for `app` and `frontend` to show healthy. Open:

- Dashboard: http://localhost:3000
- API status: http://localhost:8080/api/status
- Actuator: http://localhost:8080/actuator/health

The default credentials are local-demo values only. Change `.env` for a
shared machine and never commit it.

## Local development

Start PostgreSQL with Compose, then run the backend and frontend separately:

```powershell
docker compose up -d postgres
Set-Location backend
& "C:\Users\HP\AppData\Local\apache-maven-3.9.11\bin\mvn.cmd" spring-boot:run
```

In another PowerShell window:

```powershell
Set-Location "E:\aws\Project 2\java-health-monitor\frontend"
npm install
npm run dev
```

The Vite server is http://localhost:5173 and proxies `/api` and `/actuator`
to the backend.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/status` | Real application status and records a successful probe |
| `GET /actuator/health` | Spring Boot readiness/liveness health |
| `GET /api/diagnostics/database` | Real database query and connectivity result |
| `GET /api/health-history` | Last 20 persisted checks from PostgreSQL |

The database endpoint returns HTTP 503 on a failed query. Errors do not become
success-shaped responses. Passwords and environment values are never returned.

## Failure simulation

### Incorrect health-check path

This is safe and reproducible; it changes only the Compose health command:

```powershell
docker compose down
docker compose -f compose.yaml -f compose.failure.yaml up -d
Start-Sleep -Seconds 20
docker compose ps
docker inspect --format "{{json .State.Health}}" java-health-monitor-app
Invoke-RestMethod http://localhost:8080/api/status
```

Expected result: the app process is running and `/api/status` works, but the
app is `unhealthy` because Docker receives HTTP 404 from `/actuator/health-typo`.

Recover:

```powershell
docker compose -f compose.yaml -f compose.failure.yaml down
docker compose up -d
```

### PostgreSQL unavailable

```powershell
docker compose stop postgres
Invoke-RestMethod http://localhost:8080/api/diagnostics/database
docker compose logs --tail=100 app
docker compose start postgres
```

The database card becomes unavailable or returns HTTP 503. Existing data is
preserved in the `postgres-data` named volume. Do not use `docker compose down
-v` when testing persistence.

## Diagnostics

Run these from the project directory:

```powershell
docker ps -a
docker inspect java-health-monitor-app
docker inspect --format "{{json .State.Health}}" java-health-monitor-app
docker logs --tail=100 java-health-monitor-app
docker port java-health-monitor-app
docker network inspect java-health-monitor
docker compose ps
docker compose logs --tail=100 app
```

Interpretation:

| Symptom | Likely finding | Correction |
| --- | --- | --- |
| Container exited | Spring/JVM startup error in logs | Fix configuration or dependency, then rebuild |
| Running but unhealthy | Probe path, port, or app response failed | Inspect health history and restore `/actuator/health` |
| Browser connection refused | Host port is not published or wrong | Verify `docker port`, then use `3000` or `8080` |
| App cannot reach PostgreSQL | Wrong hostname or network | Use `postgres`, not `localhost`, and inspect `java-health-monitor` |
| API works but Docker is unhealthy | Docker command is incorrect | Compare the command with the actual endpoint |

`EXPOSE` does not publish a host port. `localhost` inside `app` refers to the
app container, not the `postgres` service. Docker HEALTHCHECK detects a
failure; it does not repair the process. Restart policies react to process
exit, not automatically to an unhealthy status.

## Requirement mapping

| Assignment requirement | Implementation |
| --- | --- |
| Java REST API | `backend/src/main/java/com/example/monitor/MonitorController.java` |
| Actuator | `application.properties`, `/actuator/health` |
| PostgreSQL | `compose.yaml`, JPA repository, named volume |
| Real dashboard | React/Vite frontend live probes |
| Docker health | Backend image and Compose `healthcheck` |
| Running vs healthy explanation | Dashboard, README, failure lab |
| Logs/ports/network | Diagnostics page and PowerShell commands |
| Controlled failure/recovery | `compose.failure.yaml` |
| Persisted history | `HealthHistory` entity and `/api/health-history` |
| Safe execution | No arbitrary command endpoint; commands are copyable instructions |

## Verification commands

```powershell
Set-Location "E:\aws\Project 2\java-health-monitor"
docker compose config
Set-Location backend
& "C:\Users\HP\AppData\Local\apache-maven-3.9.11\bin\mvn.cmd" clean test
Set-Location ..\frontend
npm install
npm run build
Set-Location ..
docker compose build
docker compose up -d
docker compose ps
Invoke-RestMethod http://localhost:8080/api/status
Invoke-RestMethod http://localhost:8080/actuator/health
Invoke-RestMethod http://localhost:8080/api/diagnostics/database
```

## Limitations

Browser JavaScript cannot safely or portably read the Docker daemon. The
dashboard therefore distinguishes live application/database probes from
manual Docker state. The diagnostic commands are intentionally allowlisted
documentation rather than a shell-execution API.
