package config

import "os"

const (
	defaultPort          = "8080"
	defaultClientDistDir = "client/dist"
)

type Config struct {
	Port          string
	ClientDistDir string
	DevClientURL  string
}

func Load() Config {
	return Config{
		Port:          getEnvOrDefault("PORT", defaultPort),
		ClientDistDir: getEnvOrDefault("CLIENT_DIST_DIR", defaultClientDistDir),
		DevClientURL:  os.Getenv("DEV_CLIENT_URL"),
	}
}

func getEnvOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
