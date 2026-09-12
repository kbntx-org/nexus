FROM ghcr.io/actions/actions-runner:2.337.0 AS build

RUN rm -rf /home/runner/externals/node20

FROM mcr.microsoft.com/dotnet/runtime-deps:8.0-noble

ENV DEBIAN_FRONTEND=noninteractive
ENV RUNNER_MANUALLY_TRAP_SIG=1
ENV ACTIONS_RUNNER_PRINT_LOG_TO_STDOUT=1
ENV ImageOS=ubuntu24

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

ARG MISE_VERSION=v2026.9.1
RUN curl -fsSL https://mise.run | MISE_VERSION="${MISE_VERSION}" MISE_INSTALL_PATH=/usr/local/bin/mise sh

# Cleanup docs and man
RUN rm -rf \
    /usr/share/doc/* \
    /usr/share/man/*

USER runner
