FROM golang:1.26.5-alpine AS builder

WORKDIR /workspace

COPY go.mod go.sum ./
RUN go mod download

COPY api api
COPY cmd cmd
COPY internal internal

RUN CGO_ENABLED=0 go build -o /workspace/bin/cloudflare-controller ./cmd

FROM gcr.io/distroless/static:nonroot AS prod

COPY --from=builder /workspace/bin/cloudflare-controller /cloudflare-controller

USER 65532:65532

ENTRYPOINT ["/cloudflare-controller"]
