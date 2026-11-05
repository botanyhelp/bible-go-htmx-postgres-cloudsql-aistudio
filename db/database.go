package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // pgx driver for database/sql
	"scriptures-api/config"
)

// NewPostgresPool establishes a sql.DB connection pool for Cloud SQL PostgreSQL
func NewPostgresPool(cfg *config.Config) (*sql.DB, error) {
	dsn := cfg.DSN()
	log.Printf("Connecting to PostgreSQL at %s:%s (Database: %s)...", cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database driver: %w", err)
	}

	// Connection Pool Settings for Cloud SQL / Production
	db.SetMaxOpenConns(25)                  // Maximum number of open connections
	db.SetMaxIdleConns(5)                   // Maximum number of idle connections
	db.SetConnMaxLifetime(5 * time.Minute)  // Maximum amount of time a connection may be reused
	db.SetConnMaxIdleTime(15 * time.Minute) // Maximum amount of time a connection may be idle

	// Verify Database Connection Ping
	if err := db.Ping(); err != nil {
		log.Printf("Warning: Database ping failed (%v). Ensure Cloud SQL Private IP / VPC Egress or Auth Proxy is running.", err)
	} else {
		log.Println("Successfully connected to PostgreSQL database!")
	}

	return db, nil
}
