FROM node:22-alpine AS frontend-build
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/index.html frontend/vite.config.js ./
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build

FROM maven:3.9.9-eclipse-temurin-17-alpine AS backend-build
WORKDIR /workspace
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
COPY --from=frontend-build /workspace/backend/src/main/resources/static backend/src/main/resources/static
RUN mvn -f backend/pom.xml -DskipTests package

FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app
ENV SPRING_PROFILES_ACTIVE=prod
RUN addgroup -S eventflow && adduser -S eventflow -G eventflow
COPY --from=backend-build /workspace/backend/target/eventhub-backend-*.jar /app/app.jar
USER eventflow
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
