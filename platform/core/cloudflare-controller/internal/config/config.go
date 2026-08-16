package config

import "github.com/caarlos0/env/v11"

type Config struct {
	CloudflareAPIToken     string `env:"CLOUDFLARE_API_TOKEN,required"`
	CloudflareAccountID    string `env:"CLOUDFLARE_ACCOUNT_ID,required"`
	MetricsBindAddress     string `env:"METRICS_BIND_ADDRESS" envDefault:":8080"`
	HealthProbeBindAddress string `env:"HEALTH_PROBE_BIND_ADDRESS" envDefault:":8081"`
	ExternalDNSEnabled     bool   `env:"EXTERNAL_DNS_ENABLED" envDefault:"true"`
}

func Load() (Config, error) {
	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return Config{}, err
	}
	return cfg, nil
}
