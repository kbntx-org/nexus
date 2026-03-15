FROM golang:1.26-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o cloudflare-ingress-controller ./cmd/

FROM golang:1.26-alpine
COPY --from=builder /app/cloudflare-ingress-controller /cloudflare-ingress-controller
ENTRYPOINT ["/cloudflare-ingress-controller"]
