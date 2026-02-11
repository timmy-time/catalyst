#!/usr/bin/env bash
set -euo pipefail

# Redis systemd wrapper for containerd

CONTAINER_NAME=${CONTAINER_NAME:-catalyst-redis}
CTR_NAMESPACE=${CTR_NAMESPACE:-catalyst}
PID_FILE=${PID_FILE:-/tmp/catalyst-redis.pid}
REDIS_IMAGE=${REDIS_IMAGE:-docker.io/library/redis:7-alpine}
RUNTIME=${RUNTIME:-io.containerd.runc.v2}
SNAPSHOTTER=${SNAPSHOTTER:-overlayfs}
DATA_DIR=${DATA_DIR:-/var/lib/catalyst/redis-data}

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
if ! ctr -n "$CTR_NAMESPACE" images ls 2>/dev/null | grep -q "$REDIS_IMAGE"; then
  echo "Pulling image: $REDIS_IMAGE"
  ctr -n "$CTR_NAMESPACE" images pull "$REDIS_IMAGE"
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
echo "Starting Redis container $CONTAINER_NAME..."

ctr -n "$CTR_NAMESPACE" run \
  --runtime "$RUNTIME" \
  --snapshotter "$SNAPSHOTTER" \
  --net-host \
  --mount type=bind,src="$DATA_DIR",dst=/data,options=rw \
  -d \
  "$REDIS_IMAGE" "$CONTAINER_NAME" \
  redis-server --appendonly yes --save 60 1 --dir /data

# Get the PID of the container task
sleep 1
PID=$(ctr -n "$CTR_NAMESPACE" task ls 2>/dev/null | grep "^${CONTAINER_NAME}" | awk '{print $2}')

if [ -n "$PID" ]; then
  echo "$PID" > "$PID_FILE"
  echo "Redis started with PID $PID"
fi
