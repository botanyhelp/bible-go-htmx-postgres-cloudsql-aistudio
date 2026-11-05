package config

import (
	"fmt"
	"os"
)

type Config struct {
	DBHost                 string
	DBPort                 string
	DBUser                 string
	DBPassword             string
	DBName                 string
	DBSSLMode              string
	InstanceConnectionName string
	ServerPort             string
}

func Load() (*Config, error) {
	cfg := &Config{
		DBHost:                 getEnv("DB_HOST", "127.0.0.1"),
		DBPort:                 getEnv("DB_PORT", "5432"),
		DBUser:                 getEnv("DB_USER", "postgres"),
		DBPassword:             getEnv("DB_PASSWORD", ""),
		DBName:                 getEnv("DB_NAME", "scriptures"),
		DBSSLMode:              getEnv("DB_SSLMODE", "disable"),
		InstanceConnectionName: getEnv("INSTANCE_CONNECTION_NAME", ""),
		ServerPort:             getEnv("PORT", "3000"),
	}

	return cfg, nil
}

func (c *Config) DSN() string {
	// Standard PostgreSQL Connection String for pgx driver
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
}

func getEnv(key, defaultValue string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return defaultValue
}
