# Multi-stage Dockerfile for MyHomeStock Single JAR (Spring Boot 4 + React PWA)
# Stage 1: Build JAR with bundled frontend static assets
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Install bash & curl for mvnw and node download
RUN apk add --no-cache bash curl

# Copy maven wrapper & build descriptor
COPY .mvn .mvn
COPY mvnw pom.xml package.json ./
RUN chmod +x mvnw

# Copy source code and frontend
COPY src src
COPY frontend frontend

# Build application (frontend-maven-plugin downloads Node/npm and bundles frontend into static/)
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal JRE Runtime for OCI Deployment
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user for container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

# Copy built executable jar from builder stage
COPY --from=builder /workspace/target/*.jar app.jar

ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
