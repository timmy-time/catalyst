#!/usr/bin/env bash
set -euo pipefail

# Redis containerd launcher script
# This script sets up and runs Redis using containerd directly
# For automatic restart on boot, install the systemd service

CONTAINER_NAME=${CONTAINER_NAME:-catalyst-redis}
REDIS_IMAGE=${REDIS_IMAGE:-docker.io/library/redis:7-alpine}
REDIS_PORT=${REDIS_PORT:-6379}
DATA_DIR=${DATA_DIR:-/var/lib/catalyst/redis-data}
NAMESPACE=${NAMESPACE:-catalyst}

# Runtime configuration
RUNTIME=${RUNTIME:-io.containerd.runc.v2}
SNAPSHOTTER=${SNAPSHOTTER:-overlayfs}
CTR_NAMESPACE=${CTR_NAMESPACE:-catalyst}

# Check for ctr command
if ! command -v ctr >/dev/null 2>&1; then
  echo "ctr (containerd CLI) is required but not installed" >&2
  exit 1
fi

# Ensure data directory exists
mkdir -p "$DATA_DIR"

# Function to check if task is running
task_running() {
  ctr -n "$CTR_NAMESPACE" task ls 2>/dev/null | grep -q "^${CONTAINER_NAME}.*RUNNING"
}

# Function to pull image
pull_image() {
  local image="$1"
  echo "Pulling image: $image"
  if ! ctr -n "$CTR_NAMESPACE" images pull "$image" 2>/dev/null; then
    echo "Failed to pull image: $image" >&2
    exit 1
  fi
}

# Function to create and start container
start_container() {
  local image="$1"

  # Pull and unpack image
  pull_image "$image"

  # Remove old container if exists
  if ctr -n "$CTR_NAMESPACE" containers ls 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
    echo "Removing old container $CONTAINER_NAME"
    ctr -n "$CTR_NAMESPACE" containers rm "$CONTAINER_NAME" || true
  fi

  echo "Starting Redis container '$CONTAINER_NAME'..."

  # Create and run container with persistence enabled
  ctr -n "$CTR_NAMESPACE" run \
    --rm \
    --runtime "$RUNTIME" \
    --snapshotter "$SNAPSHOTTER" \
    --net-host \
    --mount type=bind,src="$DATA_DIR",dst=/data,options=rw \
    -d \
    "$image" "$CONTAINER_NAME" \
    redis-server --appendonly yes --save 60 1 --dir /data
}

# Main execution
if task_running; then
  echo "Container '$CONTAINER_NAME' is already running."
  exit 0
fi

start_container "$REDIS_IMAGE"

echo "Redis started as '$CONTAINER_NAME' on port ${REDIS_PORT}."
echo "Data directory: ${DATA_DIR}"
echo ""
echo "To view logs: ctr -n ${CTR_NAMESPACE} tasks logs ${CONTAINER_NAME}"
echo "To connect: redis-cli -p ${REDIS_PORT} ping"
echo "To stop: ctr -n ${CTR_NAMESPACE} task kill ${CONTAINER_NAME}"
echo ""
echo "For automatic restart on boot, install the systemd service:"
echo "  sudo cp containerd/catalyst-redis.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable catalyst-redis"
