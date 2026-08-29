#!/usr/bin/env bash
set -euo pipefail

dockerfile="$1"
context="$2"
tag="$3"

buildArgs=(--file "$dockerfile" --tag "$tag")
if [ "${PUSH:-false}" = "true" ]; then
  buildArgs+=(--output type=registry,oci-mediatypes=true,compression=zstd,force-compression=true)
fi

docker buildx build "${buildArgs[@]}" "$context"
