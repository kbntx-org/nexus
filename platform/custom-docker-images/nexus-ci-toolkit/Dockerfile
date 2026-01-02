FROM node:22.16.0-slim

ENV KUBECTL_VERSION=1.32.0
ENV ARGOCD_VERSION=2.14.11
ENV BUILDKIT_VERSION=v0.23.2

RUN apt update && apt install -y curl unzip netcat-traditional jq gnupg git gettext-base wget ca-certificates

# Install PNPM
RUN npm install -g pnpm@10.14.0

# Install Docker CLI
RUN apt remove $(dpkg --get-selections docker.io docker-compose docker-doc podman-docker containerd runc | cut -f1) && \
    apt update && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
RUN apt update && \
    apt install -y docker-ce-cli docker-buildx-plugin docker-compose-plugin

# Install mongodb-tools
RUN curl "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-100.12.0.deb" -o "mongo.deb" && \
    apt install -y ./mongo.deb && rm mongo.deb

# Install AWS-cli v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
	./aws/install && rm awscliv2.zip

# Install ArgoCD CLI (latest stable version)
RUN curl -sSL -o argocd-linux-amd64 "https://github.com/argoproj/argo-cd/releases/download/v${ARGOCD_VERSION}/argocd-linux-amd64"; \
    install -m 555 argocd-linux-amd64 /usr/local/bin/argocd; \
    rm argocd-linux-amd64

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    curl -LO "https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl.sha256" && \
    echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install gh-cli
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /usr/share/keyrings/githubcli-archive-keyring.gpg > /dev/null && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt update && \
    apt install -y gh

# Install buildctl
RUN mkdir -p /tmp/buildkit && \
    cd /tmp/buildkit && \
    curl -LO https://github.com/moby/buildkit/releases/download/${BUILDKIT_VERSION}/buildkit-${BUILDKIT_VERSION}.linux-amd64.tar.gz && \
    tar -xvf buildkit-${BUILDKIT_VERSION}.linux-amd64.tar.gz && \
    mv bin/buildctl /usr/local/bin/ && \
    cd / && \
    rm -rf /tmp/buildkit && \
    buildctl --version

# Fix checkout code for privileged users (when using this image as github runner container)
# https://github.com/actions/runner-images/issues/6775#issuecomment-1410270956
RUN git config --system --add safe.directory '*'
