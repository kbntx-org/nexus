ARG NODE_VERSION
ARG RUNNER_VERSION

FROM node:${NODE_VERSION}-slim AS node-source

FROM ghcr.io/actions/actions-runner:${RUNNER_VERSION} AS build

RUN rm -rf /home/runner/externals/node20

FROM mcr.microsoft.com/dotnet/runtime-deps:8.0-noble

ENV DEBIAN_FRONTEND=noninteractive
ENV RUNNER_MANUALLY_TRAP_SIG=1
ENV ACTIONS_RUNNER_PRINT_LOG_TO_STDOUT=1
ENV ImageOS=ubuntu24

ARG PNPM_VERSION
ARG GO_VERSION

RUN apt-get update -y && \
    apt-get install --no-install-recommends -y \
      sudo lsb-release gpg-agent software-properties-common \
      curl unzip netcat-traditional jq gnupg git \
      gettext-base wget openssh-client xz-utils ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN add-apt-repository ppa:git-core/ppa && \
    apt-get update -y && \
    apt-get install --no-install-recommends -y git && \
    rm -rf /var/lib/apt/lists/*

RUN adduser --disabled-password --gecos "" --uid 1001 runner && \
    groupadd docker --gid 123 && \
    usermod -aG sudo runner && \
    usermod -aG docker runner && \
    echo "%sudo   ALL=(ALL:ALL) NOPASSWD:ALL" > /etc/sudoers && \
    echo "Defaults env_keep += \"DEBIAN_FRONTEND\"" >> /etc/sudoers && \
    chmod 777 /home/runner

WORKDIR /home/runner

COPY --chown=runner:docker --from=build /home/runner .

# Install the Docker CLI, Buildx and Compose plugins.
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL "https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg" -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    printf '%s\n' \
      "Types: deb" \
      "URIs: https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")" \
      "Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")" \
      "Components: stable" \
      "Signed-By: /etc/apt/keyrings/docker.asc" \
    > /etc/apt/sources.list.d/docker.sources && \
    apt-get update && \
    apt-get install --no-install-recommends -y docker-ce-cli docker-buildx-plugin docker-compose-plugin && \
    rm -rf /var/cache/apt/archives /var/lib/apt/lists/*

# Install Node.js
COPY --from=node-source /usr/local /usr/local
RUN node --version && npm --version

# Install PNPM
RUN npm install -g pnpm@${PNPM_VERSION}

# Install Go
RUN ARCH="$(dpkg --print-architecture)" && \
    case "$ARCH" in \
      amd64) GO_ARCH=amd64 ;; \
      arm64) GO_ARCH=arm64 ;; \
      *) echo "unsupported architecture: $ARCH" && exit 1 ;; \
    esac && \
    curl -fsSLO "https://go.dev/dl/go${GO_VERSION}.linux-${GO_ARCH}.tar.gz" && \
    tar -xzf "go${GO_VERSION}.linux-${GO_ARCH}.tar.gz" -C /usr/local && \
    rm "go${GO_VERSION}.linux-${GO_ARCH}.tar.gz" && \
    /usr/local/go/bin/go version
ENV PATH="/usr/local/go/bin:${PATH}"

# Install s5cmd
COPY --from=peakcom/s5cmd:v2.3.0 /s5cmd /usr/local/bin/s5cmd

# Install yq
COPY --from=mikefarah/yq:4 /usr/bin/yq /usr/local/bin/yq

# Install gh-cli
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /usr/share/keyrings/githubcli-archive-keyring.gpg > /dev/null && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install --no-install-recommends -y gh && \
    rm -rf /var/cache/apt/archives /var/lib/apt/lists/*

# Cleanup docs and man
RUN rm -rf \
    /usr/share/doc/* \
    /usr/share/man/*

USER runner
