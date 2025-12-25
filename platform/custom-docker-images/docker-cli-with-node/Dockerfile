FROM node:22.16.0-alpine

WORKDIR /tmp
RUN apk update && \
    apk add --update \
    docker \
    docker-cli-compose \
    docker-credential-ecr-login \
    bash \
    openssh \
    curl \
    aws-cli \
    git \
    jq \
    bind-tools \
    gettext \
    envsubst \
    mongodb-tools \
    coreutils
