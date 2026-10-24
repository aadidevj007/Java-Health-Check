# Upgrade Plan: java-health-monitor-backend (java25-20261024-2111)

- **Generated**: 2026-10-24 21:14 +05:30
- **HEAD Branch**: N/A
- **HEAD Commit ID**: N/A

## Available Tools

**JDKs**
- JDK 21: `C:\Program Files\Java\jdk-21` (base runtime; baseline was attempted before the upgrade)
- JDK 25: `C:\Users\HP\.jdk\jdk-25` (target runtime)

**Build Tools**
- Maven 3.9.11: `C:\Users\HP\AppData\Local\apache-maven-3.9.11`

> Version control is unavailable because `E:\aws\Project 2` is not a Git repository. Changes remain in the working directory.

## Guidelines

> Note: You can add any specific guidelines or constraints for the upgrade process here if needed, bullet points are preferred.

## Options

- Working branch: N/A (workspace is not version-controlled)
- Run tests before and after the upgrade: true

## Upgrade Goals

- Java runtime 25, the latest LTS release

## Technology Stack

| Technology/Dependency | Current | Min Compatible Version | Why Incompatible |
| --- | --- | --- | --- |
| Java | 21 | 25 | User requested latest LTS runtime |
| Spring Boot | 3.5.6 | 3.5.6 | Already compatible with Java 25 |
| Maven | 3.9.11 | 3.9.0 | Already compatible with Java 25 |
| maven-compiler-plugin | 3.14.0 (Spring Boot managed) | 3.13.0 | Supports Java 25 release compilation |
| PostgreSQL JDBC driver | Spring Boot managed | Spring Boot managed | No direct upgrade required |

## Derived Upgrades

- Set the Maven `java.version` property to `25`, which configures compiler release and Spring Boot runtime metadata.
- Update Docker build and runtime images to Eclipse Temurin Java 25 so container execution matches local development.
- Update Java version references in developer documentation.
- No Spring Boot, Jakarta namespace, Kotlin, or source-code API migration is required.

## Impact Analysis

### Dependency Changes

| File | Dependency | Current | Action | Target | Reason |
| --- | --- | --- | --- | --- | --- |
| `backend/pom.xml` | `java.version` | 21 | upgrade | 25 | Compile and package for the target LTS runtime |

### Source Code Changes

No Java source changes are required. The code uses standard Spring Boot APIs and contains no JDK-internal packages, reflective access to JDK internals, or removed Java APIs.

### Configuration Changes

No application configuration changes are required.

### CI/CD Changes

| File | Location | Current | Required Change |
| --- | --- | --- | --- |
| `backend/Dockerfile` | build image | `maven:3.9.11-eclipse-temurin-21` | Change to `maven:3.9.11-eclipse-temurin-25` |
| `backend/Dockerfile` | runtime image | `eclipse-temurin:21-jre-jammy` | Change to `eclipse-temurin:25-jre-jammy` |
| `README.md` | overview and prerequisites | Java 21 | Change references to Java 25 |

### Risks & Warnings

- **Container image availability**: The Java 25 Temurin tags must remain available when Docker builds. **Mitigation**: Build the image after the change and retain the explicit Maven/runtime image tags.
- **Runtime-only compatibility**: Compilation and unit tests do not exercise every container/database path. **Mitigation**: Run Maven tests and, when Docker is available, build the backend image separately.
- **Baseline limitation**: The original baseline command was initially invoked from the workspace root, which has no POM; the backend baseline must be rerun from `backend` if the pre-upgrade files are restored. The post-upgrade target validation is authoritative for this working tree.

## Upgrade Steps

- Step 1: Setup Environment
  - **Rationale**: Make Java 25 and Maven 3.9.11 available.
  - **Changes to Make**: Install Temurin JDK 25 under `C:\Users\HP\.jdk\jdk-25`.
  - **Verification**: `C:\Users\HP\.jdk\jdk-25\bin\java.exe -version`; expected Java 25 LTS.

- Step 2: Setup Baseline
  - **Rationale**: Establish pre-upgrade behavior where possible.
  - **Changes to Make**: Run Maven from `backend` with JDK 21.
  - **Verification**: `mvn clean test`; expected baseline compilation and tests to pass.

- Step 3: Apply Java 25 Runtime Upgrade
  - **Rationale**: Align build, local runtime documentation, and Docker runtime with Java 25.
  - **Changes to Make**: Apply all Dependency Changes and CI/CD Changes above.
  - **Verification**: `mvn clean test-compile` with JDK 25; expected successful main and test compilation.

- Step 4: Final Validation
  - **Rationale**: Confirm all target-runtime tests pass.
  - **Changes to Make**: Resolve any compilation or test failures caused by Java 25.
  - **Verification**: `mvn clean test` with JDK 25; expected 100% pass rate.

- Step 5: CVE Validation
  - **Rationale**: Check resolved direct dependency versions for known vulnerabilities after the upgrade.
  - **Changes to Make**: Scan dependency coordinates and apply only necessary patched upgrades.
  - **Verification**: Dependency scan reports no unresolved actionable CVEs; rerun Maven tests after any fixes.

- Step 6: Final Consistency and Documentation Review
  - **Rationale**: Ensure no stale Java 21 runtime references remain in relevant project files.
  - **Changes to Make**: Search runtime/build/documentation files and verify Docker configuration.
  - **Verification**: Targeted search plus Maven test result; expected no stale runtime references and passing tests.
