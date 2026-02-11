#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL containerd launcher script
# This script sets up and runs PostgreSQL using containerd directly
# For automatic restart on boot, install the systemd service

CONTAINER_NAME=${CONTAINER_NAME:-catalyst-postgres}
POSTGRES_IMAGE=${POSTGRES_IMAGE:-docker.io/library/postgres:16-alpine}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-catalyst}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-catalyst_dev_password}
POSTGRES_DB=${POSTGRES_DB:-catalyst_db}
DATA_DIR=${DATA_DIR:-/var/lib/catalyst/postgres-data}
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

# Function to check if container exists
container_exists() {
  ctr -n "$CTR_NAMESPACE" containers ls 2>/dev/null | grep -q "^${CONTAINER_NAME}$"
}

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

# Function to create container
create_container() {
  local image="$1"

  # Pull and unpack image
  pull_image "$image"

  echo "Creating container '$CONTAINER_NAME'..."

  # Create container with PostgreSQL environment variables
  ctr -n "$CTR_NAMESPACE" run \
    --rm \
    --runtime "$RUNTIME" \
    --snapshotter "$SNAPSHOTTER" \
    --net-host \
    --mount type=bind,src="$DATA_DIR",dst=/var/lib/postgresql/data,options=rw \
    --env "POSTGRES_USER=$POSTGRES_USER" \
    --env "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
    --env "POSTGRES_DB=$POSTGRES_DB" \
    --env "PGDATA=/var/lib/postgresql/data/pgdata" \
    "$image" "$CONTAINER_NAME"
}

# Function to start container
start_container() {
  echo "Starting container '$CONTAINER_NAME'..."

  # Create container if it doesn't exist
  if ! container_exists; then
    create_container "$POSTGRES_IMAGE"
  fi

  # Start the container task
  if ! task_running; then
    ctr -n "$CTR_NAMESPACE" task start -d "$CONTAINER_NAME"
    echo "PostgreSQL started as '$CONTAINER_NAME' on port ${POSTGRES_PORT}."
  else
    echo "Container '$CONTAINER_NAME' is already running."
  fi
}

# Main execution
if task_running; then
  echo "Container '$CONTAINER_NAME' is already running."
  exit 0
fi

start_container

echo "Data directory: ${DATA_DIR}"
echo "PostgreSQL connection: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
echo ""
echo "To view logs: ctr -n ${CTR_NAMESPACE} tasks logs ${CONTAINER_NAME}"
echo "To stop: ctr -n ${CTR_NAMESPACE} task kill ${CONTAINER_NAME}"
echo ""
echo "For automatic restart on boot, install the systemd service:"
echo "  sudo cp containerd/catalyst-postgres.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable catalyst-postgres"
