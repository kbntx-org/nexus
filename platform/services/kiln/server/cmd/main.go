package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/kbntx-org/nexus/platform/services/kiln/pkg/config"
)

const (
	healthCheckPath = "/healthz"
	apiPathPrefix   = "/api/"
)

func main() {
	appConfig := config.Load()

	requestMultiplexer := http.NewServeMux()
	requestMultiplexer.HandleFunc(healthCheckPath, handleHealthCheck)
	requestMultiplexer.HandleFunc(apiPathPrefix, handleAPI)
	requestMultiplexer.Handle("/", newClientHandler(appConfig))

	log.Printf("kiln listening on :%s", appConfig.Port)
	if err := http.ListenAndServe(":"+appConfig.Port, requestMultiplexer); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func handleHealthCheck(responseWriter http.ResponseWriter, _ *http.Request) {
	responseWriter.WriteHeader(http.StatusOK)
	_, _ = responseWriter.Write([]byte("ok"))
}

func handleAPI(responseWriter http.ResponseWriter, _ *http.Request) {
	responseWriter.WriteHeader(http.StatusNotImplemented)
}

func newClientHandler(appConfig config.Config) http.Handler {
	if appConfig.DevClientURL == "" {
		return http.FileServer(http.Dir(appConfig.ClientDistDir))
	}

	targetURL, err := url.Parse(appConfig.DevClientURL)
	if err != nil {
		log.Fatalf("invalid DEV_CLIENT_URL: %v", err)
	}
	return httputil.NewSingleHostReverseProxy(targetURL)
}
