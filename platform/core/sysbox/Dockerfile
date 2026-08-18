# Multi-arch build of nestybox's sysbox-deploy-k8s image (upstream only
# publishes amd64), reproducing sysbox-pkgr/k8s/Makefile + Dockerfile.sysbox-ce.
# CRI-O artifacts are omitted; see runtime_precheck() / is_containerd_with_userns()
# in sysbox-deploy-k8s.sh.

ARG SYSBOX_VERSION=0.7.1
ARG SYSBOX_VERSION_FULL=0.7.1-0
# nestybox/sysbox-pkgr master @ 2026-07-31, pinned for reproducible builds
ARG SYSBOX_PKGR_REF=e78ba6aa5364b2d962265c81739b42deca31bd18

ARG SYSBOX_CE_SHA256_AMD64=9d6d5484f980d0a17f86c492c1262015c2afb66280bdb97215b79fde6a0261c5
ARG SYSBOX_CE_SHA256_ARM64=04ca894ae0b53f0fa54eaacc173ce40363c9a95ea5450f773716a84ef650a69b

ARG DASEL_VERSION=3.11.2
ARG DASEL_SHA256_AMD64=5006ee3a4239ab6a3edb1bf5c932874d814f7c276117ca677352697a4f547799
ARG DASEL_SHA256_ARM64=df33920a792cd8ee5573cec3632a710cd2178d7bc4fc3892c6be78f35e7cbcc6

FROM --platform=$BUILDPLATFORM alpine/git:latest AS sysbox-pkgr

ARG SYSBOX_PKGR_REF

WORKDIR /src
RUN git clone https://github.com/nestybox/sysbox-pkgr.git . \
    && git checkout ${SYSBOX_PKGR_REF}

FROM ubuntu:noble AS sysbox-bins

ARG SYSBOX_VERSION
ARG SYSBOX_VERSION_FULL
ARG TARGETARCH
ARG SYSBOX_CE_SHA256_AMD64
ARG SYSBOX_CE_SHA256_ARM64

RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN wget https://storage.googleapis.com/sysbox-releases/v${SYSBOX_VERSION}/sysbox-ce/sysbox-ce_${SYSBOX_VERSION_FULL}.linux_${TARGETARCH}.deb \
    -O /tmp/sysbox-ce.deb \
    && case "${TARGETARCH}" in \
         amd64) echo "${SYSBOX_CE_SHA256_AMD64}  /tmp/sysbox-ce.deb" | sha256sum -c - ;; \
         arm64) echo "${SYSBOX_CE_SHA256_ARM64}  /tmp/sysbox-ce.deb" | sha256sum -c - ;; \
         *) echo "no pinned sysbox-ce checksum for arch ${TARGETARCH}" >&2 && exit 1 ;; \
       esac \
    && mkdir -p /tmp/sysbox-ce-generic \
    && dpkg -x /tmp/sysbox-ce.deb /tmp/sysbox-ce-generic \
    && mkdir -p /out/generic \
    && cp /tmp/sysbox-ce-generic/usr/bin/sysbox-* /out/generic/.

# centos7/systemd base: its systemctl can reach the host's systemd over the
# mounted dbus socket; an ubuntu + systemd image cannot.
FROM ghcr.io/nestybox/centos7/systemd

ARG TARGETARCH
ENV SYS_ARCH=${TARGETARCH}
ARG SYSBOX_VERSION_FULL
ENV SYSBOX_VERSION=v${SYSBOX_VERSION_FULL}
ARG DASEL_VERSION
ARG DASEL_SHA256_AMD64
ARG DASEL_SHA256_ARM64

ARG DEST=/opt/sysbox

RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-* \
    && sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*

RUN yum install -y curl wget git bc which epel-release \
    && yum install -y jq

RUN KUBECTL_RELEASE=$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt) \
    && curl -Lso /bin/kubectl "https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_RELEASE}/bin/linux/${SYS_ARCH}/kubectl" \
    && curl -Lso /tmp/kubectl.sha256 "https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_RELEASE}/bin/linux/${SYS_ARCH}/kubectl.sha256" \
    && echo "$(cat /tmp/kubectl.sha256)  /bin/kubectl" | sha256sum -c - \
    && rm /tmp/kubectl.sha256 \
    && chmod +x /bin/kubectl

RUN wget https://github.com/TomWright/dasel/releases/download/v${DASEL_VERSION}/dasel_linux_${SYS_ARCH} -O dasel \
    && case "${SYS_ARCH}" in \
         amd64) echo "${DASEL_SHA256_AMD64}  dasel" | sha256sum -c - ;; \
         arm64) echo "${DASEL_SHA256_ARM64}  dasel" | sha256sum -c - ;; \
         *) echo "no pinned dasel checksum for arch ${SYS_ARCH}" >&2 && exit 1 ;; \
       esac \
    && chmod +x dasel && mv ./dasel /usr/local/bin/dasel

RUN git clone --branch k5.4 https://github.com/nestybox/shiftfs-dkms.git /opt/shiftfs-k5.4 \
    && git clone --branch k5.10 https://github.com/nestybox/shiftfs-dkms.git /opt/shiftfs-k5.10 \
    && git clone --branch k5.11 https://github.com/nestybox/shiftfs-dkms.git /opt/shiftfs-k5.11 \
    && git clone --branch k5.13 https://github.com/nestybox/shiftfs-dkms.git /opt/shiftfs-k5.13 \
    && git clone --branch k5.16 https://github.com/nestybox/shiftfs-dkms.git /opt/shiftfs-k5.16 \
    && git clone --branch k5.17 https://github.com/nestybox/shiftfs-dkms.git /opt/shiftfs-k5.17 \
    && git clone --branch k5.18 https://github.com/nestybox/shiftfs-dkms.git /opt/shiftfs-k5.18 \
    && git clone --branch k6.1 https://github.com/nestybox/shiftfs-dkms.git /opt/shiftfs-k6.1

COPY --from=sysbox-bins /out /opt/sysbox/bin

COPY --from=sysbox-pkgr /src/k8s/systemd/50-sysbox-mod.conf /opt/sysbox/systemd/50-sysbox-mod.conf
COPY --from=sysbox-pkgr /src/k8s/systemd/99-sysbox-sysctl.conf /opt/sysbox/systemd/99-sysbox-sysctl.conf
COPY --from=sysbox-pkgr /src/k8s/systemd/sysbox-installer-helper.service /opt/sysbox/systemd/sysbox-installer-helper.service
COPY --from=sysbox-pkgr /src/k8s/systemd/sysbox-removal-helper.service /opt/sysbox/systemd/sysbox-removal-helper.service
COPY --from=sysbox-pkgr /src/k8s/systemd/sysbox-fs.service /opt/sysbox/systemd/sysbox-fs.service
COPY --from=sysbox-pkgr /src/k8s/systemd/sysbox-mgr.service /opt/sysbox/systemd/sysbox-mgr.service
COPY --from=sysbox-pkgr /src/k8s/systemd/sysbox.service /opt/sysbox/systemd/sysbox.service

COPY --from=sysbox-pkgr /src/k8s/scripts/sysbox-installer-helper.sh /opt/sysbox/scripts/sysbox-installer-helper.sh
COPY --from=sysbox-pkgr /src/k8s/scripts/sysbox-removal-helper.sh /opt/sysbox/scripts/sysbox-removal-helper.sh

# Local copy of k8s/scripts/sysbox-deploy-k8s.sh @ SYSBOX_PKGR_REF, patched for:
#  - k8s v1.36 support
#  - k3s / RKE2 support: https://github.com/nestybox/sysbox-pkgr/pull/152
COPY scripts/sysbox-deploy-k8s.sh /opt/sysbox/scripts/sysbox-deploy-k8s.sh
COPY config/containerd-sysbox-dropin.toml /opt/sysbox/config/containerd-sysbox-dropin.toml
