package com.cbg.travel.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dbUrl == null || dbUrl.isEmpty()) {
            dbUrl = System.getenv("DATABASE_URL");
        }

        if (dbUrl != null && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
            try {
                String cleanUrl = dbUrl.replace("postgresql://", "http://").replace("postgres://", "http://");
                URI uri = new URI(cleanUrl);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String userInfo = uri.getUserInfo();
                
                String username = System.getenv("SPRING_DATASOURCE_USERNAME");
                String password = System.getenv("SPRING_DATASOURCE_PASSWORD");
                
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":");
                    if (username == null || username.isEmpty()) username = parts[0];
                    if (password == null || password.isEmpty()) password = parts[1];
                }
                
                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                System.out.println("Connecting to Render PostgreSQL at: " + jdbcUrl + " with user: " + username);

                return DataSourceBuilder.create()
                        .driverClassName("org.postgresql.Driver")
                        .url(jdbcUrl)
                        .username(username != null ? username : "postgres")
                        .password(password != null ? password : "root")
                        .build();
            } catch (Exception e) {
                System.err.println("Failed to parse PostgreSQL URI, falling back to H2: " + e.getMessage());
            }
        }

        // Standard JDBC URL
        if (dbUrl != null && dbUrl.startsWith("jdbc:")) {
            String user = System.getenv("SPRING_DATASOURCE_USERNAME");
            String pass = System.getenv("SPRING_DATASOURCE_PASSWORD");
            return DataSourceBuilder.create()
                    .url(dbUrl)
                    .username(user != null ? user : "postgres")
                    .password(pass != null ? pass : "root")
                    .build();
        }

        // H2 In-Memory Fallback if no database URL is supplied
        System.out.println("Using H2 In-Memory Database Fallback for Web Service");
        return DataSourceBuilder.create()
                .driverClassName("org.h2.Driver")
                .url("jdbc:h2:mem:workforce_travel;DB_CLOSE_DELAY=-1;MODE=PostgreSQL")
                .username("sa")
                .password("")
                .build();
    }
}
