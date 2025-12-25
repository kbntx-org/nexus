#!/bin/bash

SSH_KEY="$1"
KNOWN_HOSTS="$2"

mkdir -p ~/.ssh
echo -n "$SSH_KEY" > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
echo -n "$KNOWN_HOSTS" > ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts
