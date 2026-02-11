#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL systemd wrapper for containerd
# This script starts the container and creates a PID file for systemd tracking

CONTAINER_NAME=${CONTAINER_NAME:-catalyst-postgres}
CTR_NAMESPACE=${CTR_NAMESPACE:-catalyst}
PID_FILE=${PID_FILE:-/tmp/catalyst-postgres.pid}
POSTGRES_IMAGE=${POSTGRES_IMAGE:-docker.io/library/postgres:16-alpine}
RUNTIME=${RUNTIME:-io.containerd.runc.v2}
SNAPSHOTTER=${SNAPSHOTTER:-overlayfs}
DATA_DIR=${DATA_DIR:-/var/lib/catalyst/postgres-data}
POSTGRES_USER=${POSTGRES_USER:-catalyst}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-catalyst_dev_password}
POSTGRES_DB=${POSTGRES_DB:-catalyst_db}

# Check if task is already running
if ctr -n "$CTR_NAMESPACE" task ls 2>/dev/null | grep -q "^${CONTAINER_NAME}.*RUNNING"; then
  echo "Container $CONTAINER_NAME is already running"
  exit 0
fi

# Kill any existing task (container exists but task might be dead)
if ctr -n "$CTR_NAMESPACE" task ls 2>/dev/null | grep -q "^${CONTAINER_NAME}"; then
  echo "Killing existing task for $CONTAINER_NAME"
  ctr -n "$CTR_NAMESPACE" task kill "$CONTAINER_NAME" || true
  sleep 1
fi

# Ensure data directory exists
mkdir -p "$DATA_DIR"

# Pull image if needed
if ! ctr -n "$CTR_NAMESPACE" images ls 2>/dev/null | grep -q "$POSTGRES_IMAGE"; then
  echo "Pulling image: $POSTGRES_IMAGE"
  ctr -n "$CTR_NAMESPACE" images pull "$POSTGRES_IMAGE"
fi

# Remove old snapshot if exists - must do this BEFORE removing container
if ctr -n "$CTR_NAMESPACE" snapshots --snapshotter "$SNAPSHOTTER" ls 2>/dev/null | awk '{print $1}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Removing old snapshot $CONTAINER_NAME"
  ctr -n "$CTR_NAMESPACE" snapshots --snapshotter "$SNAPSHOTTER" rm "$CONTAINER_NAME" || true
fi

# Remove old container if exists
if ctr -n "$CTR_NAMESPACE" containers ls 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
  echo "Removing old container $CONTAINER_NAME"
  ctr -n "$CTR_NAMESPACE" containers rm "$CONTAINER_NAME" || true
fi

# Create and start the container
echo "Starting PostgreSQL container $CONTAINER_NAME..."

ctr -n "$CTR_NAMESPACE" run \
  --runtime "$RUNTIME" \
  --snapshotter "$SNAPSHOTTER" \
  --net-host \
  --mount type=bind,src="$DATA_DIR",dst=/var/lib/postgresql/data,options=rw \
  --env "POSTGRES_USER=$POSTGRES_USER" \
  --env "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
  --env "POSTGRES_DB=$POSTGRES_DB" \
  --env "PGDATA=/var/lib/postgresql/data/pgdata" \
  -d \
  "$POSTGRES_IMAGE" "$CONTAINER_NAME"

# Get the PID of the container task
sleep 1
PID=$(ctr -n "$CTR_NAMESPACE" task ls 2>/dev/null | grep "^${CONTAINER_NAME}" | awk '{print $2}')

if [ -n "$PID" ]; then
  echo "$PID" > "$PID_FILE"
  echo "PostgreSQL started with PID $PID"
fi
