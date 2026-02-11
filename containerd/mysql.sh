#!/usr/bin/env bash
set -euo pipefail

# MySQL containerd launcher script
# This script sets up and runs MySQL using containerd directly
# For automatic restart on boot, install the systemd service

CONTAINER_NAME=${CONTAINER_NAME:-catalyst-mysql}
MYSQL_IMAGE=${MYSQL_IMAGE:-docker.io/library/mysql:8.4}
MYSQL_PORT=${MYSQL_PORT:-3306}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-catalyst_dev}
MYSQL_DATABASE=${MYSQL_DATABASE:-catalyst_databases}
DATA_DIR=${DATA_DIR:-/var/lib/catalyst/mysql}
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

  echo "Starting MySQL container '$CONTAINER_NAME'..."

  # Create and run container
  ctr -n "$CTR_NAMESPACE" run \
    --rm \
    --runtime "$RUNTIME" \
    --snapshotter "$SNAPSHOTTER" \
    --net-host \
    --mount type=bind,src="$DATA_DIR",dst=/var/lib/mysql,options=rw \
    --env "MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD" \
    --env "MYSQL_DATABASE=$MYSQL_DATABASE" \
    -d \
    "$image" "$CONTAINER_NAME"
}

# Main execution
if task_running; then
  echo "Container '$CONTAINER_NAME' is already running."
  exit 0
fi

start_container "$MYSQL_IMAGE"

echo "MySQL started as '$CONTAINER_NAME' on port ${MYSQL_PORT}."
echo "Data directory: ${DATA_DIR}"
echo "Root password: ${MYSQL_ROOT_PASSWORD}"
echo "Default database: ${MYSQL_DATABASE}"
echo ""
echo "To view logs: ctr -n ${CTR_NAMESPACE} tasks logs ${CONTAINER_NAME}"
echo "To stop: ctr -n ${CTR_NAMESPACE} task kill ${CONTAINER_NAME}"
echo ""
echo "For automatic restart on boot, install the systemd service:"
echo "  sudo cp containerd/catalyst-mysql.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable catalyst-mysql"
