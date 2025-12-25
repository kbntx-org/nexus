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

# Configure Docker to use Amazon ECR credential helper
RUN mkdir -p ~/.docker && \
    echo '{"credHelpers": {"717279713235.dkr.ecr.eu-central-1.amazonaws.com":"ecr-login"}}' > ~/.docker/config.json
