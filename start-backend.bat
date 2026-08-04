@echo off
echo ==========================================
echo   Starting Spring Boot Backend (port 8080)
echo   Requires PostgreSQL on localhost:5432
echo   Database: workforce_travel
echo ==========================================
echo.

cd /d "%~dp0backend"

set SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/workforce_travel
set SPRING_DATASOURCE_USERNAME=postgres
set SPRING_DATASOURCE_PASSWORD=postgres

mvn spring-boot:run
