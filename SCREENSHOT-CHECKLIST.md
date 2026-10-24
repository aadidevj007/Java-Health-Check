# Screenshot Checklist

- [ ] Dashboard at `http://localhost:3000` showing live Java API, Actuator, and PostgreSQL cards.
- [ ] Health checks page showing HTTP status, response time, and response JSON.
- [ ] Diagnostics page showing copyable Docker commands.
- [ ] Failure lab page showing the documented scenarios.
- [ ] `docker compose ps` with healthy `postgres`, `app`, and `frontend`.
- [ ] `docker inspect --format "{{json .State.Health}}" java-health-monitor-app`.
- [ ] `docker logs --tail=100 java-health-monitor-app`.
- [ ] `docker port java-health-monitor-app`.
- [ ] `docker network inspect java-health-monitor`.
- [ ] Failure override showing `(unhealthy)` and HTTP 404 history.
- [ ] `/api/status` still responding during the unhealthy state.
- [ ] Recovered Compose state showing `(healthy)`.
- [ ] Database record count/history before and after restarting PostgreSQL.
