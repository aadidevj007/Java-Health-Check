# Presentation Script

1. “This is a real monitoring website for Question 54. It separates a
   container process from the availability of the Java application.”
2. “The dashboard sends live HTTP requests to Spring Boot status and Actuator
   endpoints, and the database card performs a real PostgreSQL query.”
3. “Probe history is stored in PostgreSQL, so it is not fabricated browser
   data and survives a PostgreSQL restart through the named volume.”
4. “Docker's health command runs curl inside the application container. It
   calls `/actuator/health` and fails for connection errors or HTTP errors.”
5. “The failure override changes only the health path. The JVM keeps running,
   but Docker reports unhealthy while `/api/status` still works.”
6. “I diagnose with `docker logs`, `docker port`, `docker inspect`, and
   `docker network inspect`, then restore the configuration and verify healthy.”
