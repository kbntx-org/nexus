FROM ghcr.io/actions/actions-runner:2.336.0

ENV NODE_VERSION=24.15.0
ENV PNPM_VERSION=11.9.0
ENV GO_VERSION=1.26.1
ENV KUBECTL_VERSION=1.32.0
ENV ARGOCD_VERSION=2.14.11

USER root

RUN apt-get update && \
    apt-get install --no-install-recommends -y \
      curl unzip netcat-traditional jq gnupg git \
      gettext-base wget openssh-client \
      xz-utils ca-certificates && \
    rm -rf /var/cache/apt/archives /var/lib/apt/lists/*

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
RUN ARCH="$(dpkg --print-architecture)" && \
    case "$ARCH" in \
      amd64) NODE_ARCH=x64 ;; \
      arm64) NODE_ARCH=arm64 ;; \
      *) echo "unsupported architecture: $ARCH" && exit 1 ;; \
    esac && \
    curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" && \
    tar -xJf "node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" -C /usr/local --strip-components=1 --no-same-owner && \
    rm "node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" && \
    node --version && npm --version

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

# Install mongodb-tools
RUN curl "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-100.12.0.deb" -o "mongo.deb" && \
    apt-get update && apt-get install --no-install-recommends -y ./mongo.deb && rm mongo.deb && \
    rm -rf /var/cache/apt/archives /var/lib/apt/lists/*

# Install s5cmd
COPY --from=peakcom/s5cmd:v2.3.0 /s5cmd /usr/local/bin/s5cmd

# Install yq
COPY --from=mikefarah/yq:4 /usr/bin/yq /usr/local/bin/yq

# Install ArgoCD CLI (latest stable version)
RUN curl -sSL -o argocd-linux-amd64 "https://github.com/argoproj/argo-cd/releases/download/v${ARGOCD_VERSION}/argocd-linux-amd64" && \
    install -m 555 argocd-linux-amd64 /usr/local/bin/argocd && \
    rm argocd-linux-amd64

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    curl -LO "https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl.sha256" && \
    echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl kubectl.sha256

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
