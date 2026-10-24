# Java Runtime Upgrade Summary

- **Project**: java-health-monitor-backend
- **Target**: Java 25 LTS
- **Completed**: 2026-10-24
- **Workspace**: `E:\aws\Project 2`
- **Version control**: Unavailable; workspace is not a Git repository

## Changes

- Set `backend/pom.xml` `java.version` from 21 to 25.
- Updated `backend/Dockerfile` build and runtime images from Java 21 to Java 25.
- Updated `README.md` development prerequisites and project description to Java 25.
- Installed Eclipse Temurin 25.0.4.1 under `C:\Users\HP\.jdk\jdk-25`.

## Validation

| Check | Result |
| --- | --- |
| Java 25 installation | Passed |
| Maven `clean test-compile` | Passed |
| Maven `clean test` | Passed: 2/2 |
| Docker Compose configuration | Passed |
| Backend Docker image build | Passed |
| Direct dependency listing | Completed |

## Security and Risks

- The dedicated Java CVE validation tool was unavailable in this runtime, so no independent CVE verdict is claimed.
- Maven and Docker emitted expected Java 25 warnings about dynamic agent loading and deprecated `sun.misc.Unsafe` usage in build/test tooling; application compilation and tests passed.
- Spring Boot's test `@MockBean` annotation is deprecated for removal, but this is unrelated to the Java runtime upgrade and does not affect current behavior.

## Outcome

The backend now compiles, tests, and packages successfully on Java 25, and its Docker image uses Java 25 consistently for build and runtime execution.
