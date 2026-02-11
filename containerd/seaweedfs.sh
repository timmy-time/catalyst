#!/usr/bin/env bash
set -euo pipefail

# SeaweedFS containerd launcher script
# This script sets up and runs SeaweedFS using containerd directly
# For automatic restart on boot, install the systemd service

CONTAINER_NAME=${CONTAINER_NAME:-catalyst-seaweedfs}
SEAWED_IMAGE=${SEAWED_IMAGE:-docker.io/chrislusf/seaweedfs:latest}
S3_PORT=${S3_PORT:-8333}
MASTER_PORT=${MASTER_PORT:-9333}
VOLUME_PORT=${VOLUME_PORT:-8080}
FILER_PORT=${FILER_PORT:-8888}
DATA_DIR=${DATA_DIR:-/var/lib/catalyst/seaweedfs}
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

# Helper: check whether a host TCP port is free
is_port_free() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | awk '{print $4}' | grep -qE "(:|\[)${port}$" && return 1 || return 0
  elif command -v netstat >/dev/null 2>&1; then
    netstat -tln | awk '{print $4}' | grep -qE "(:|\[)${port}$" && return 1 || return 0
  else
    return 1
  fi
}

find_free_port() {
  local start="$1"
  local end="$2"
  local p
  for ((p=start; p<=end; p++)); do
    if is_port_free "$p"; then
      echo "$p"
      return 0
    fi
  done
  return 1
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

  echo "Starting SeaweedFS container '$CONTAINER_NAME'..."

  # Create and run container with all components (master, volume, filer, S3)
  ctr -n "$CTR_NAMESPACE" run \
    --rm \
    --runtime "$RUNTIME" \
    --snapshotter "$SNAPSHOTTER" \
    --net-host \
    --mount type=bind,src="$DATA_DIR",dst=/data,options=rw \
    -d \
    "$image" "$CONTAINER_NAME" \
    server -dir=/data -ip=0.0.0.0 -master.port="$MASTER_PORT" -volume.port="$VOLUME_PORT" -filer -filer.port="$FILER_PORT" -s3 -s3.port="$S3_PORT"
}

# Main execution
if task_running; then
  echo "Container '$CONTAINER_NAME' is already running."
  exit 0
fi

start_container "$SEAWED_IMAGE"

echo "SeaweedFS started as '$CONTAINER_NAME'"
echo "S3 gateway: http://localhost:${S3_PORT}"
echo "Master: http://localhost:${MASTER_PORT}"
echo "Volume: http://localhost:${VOLUME_PORT}"
echo "Filer: http://localhost:${FILER_PORT}"
echo "Data directory: ${DATA_DIR}"
echo ""
echo "To view logs: ctr -n ${CTR_NAMESPACE} tasks logs ${CONTAINER_NAME}"
echo "To stop: ctr -n ${CTR_NAMESPACE} task kill ${CONTAINER_NAME}"
echo ""
echo "For automatic restart on boot, install the systemd service:"
echo "  sudo cp containerd/catalyst-seaweedfs.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable catalyst-seaweedfs"
