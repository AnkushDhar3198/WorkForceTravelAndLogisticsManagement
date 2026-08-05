package com.cbg.travel.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.sql.Connection;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dbUrl == null || dbUrl.isEmpty()) {
            dbUrl = System.getenv("DATABASE_URL");
        }

        if (dbUrl != null && !dbUrl.trim().isEmpty()) {
            try {
                String jdbcUrl = dbUrl.trim();
                String username = System.getenv("SPRING_DATASOURCE_USERNAME");
                String password = System.getenv("SPRING_DATASOURCE_PASSWORD");

                if (jdbcUrl.startsWith("postgres://") || jdbcUrl.startsWith("postgresql://")) {
                    String cleanUrl = jdbcUrl.replace("postgresql://", "http://").replace("postgres://", "http://");
                    URI uri = new URI(cleanUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath();
                    String userInfo = uri.getUserInfo();

                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":");
                        if (username == null || username.isEmpty()) username = parts[0];
                        if (password == null || password.isEmpty()) password = parts[1];
                    }

                    jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                }

                System.out.println("Attempting PostgreSQL connection: " + jdbcUrl);
                HikariConfig config = new HikariConfig();
                config.setDriverClassName("org.postgresql.Driver");
                config.setJdbcUrl(jdbcUrl);
                if (username != null && !username.isEmpty()) config.setUsername(username);
                if (password != null && !password.isEmpty()) config.setPassword(password);
                config.setConnectionTimeout(3000); // 3 sec timeout
                config.setInitializationFailTimeout(0); // Do not hang Spring Boot startup
                config.setMaximumPoolSize(5);

                HikariDataSource ds = new HikariDataSource(config);
                try (Connection conn = ds.getConnection()) {
                    System.out.println("Successfully connected to PostgreSQL database!");
                    return ds;
                } catch (Exception ex) {
                    System.err.println("PostgreSQL connection failed (" + ex.getMessage() + "). Falling back to H2.");
                    ds.close();
                }
            } catch (Exception e) {
                System.err.println("Failed to parse DB URL (" + e.getMessage() + "). Falling back to H2.");
            }
        }

        // Fast H2 In-Memory Fallback
        System.out.println("Using H2 In-Memory Database Fallback for instant server boot.");
        HikariConfig h2Config = new HikariConfig();
        h2Config.setDriverClassName("org.h2.Driver");
        h2Config.setJdbcUrl("jdbc:h2:mem:workforce_travel;DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
        h2Config.setUsername("sa");
        h2Config.setPassword("");
        h2Config.setMaximumPoolSize(10);
        return new HikariDataSource(h2Config);
    }
}
