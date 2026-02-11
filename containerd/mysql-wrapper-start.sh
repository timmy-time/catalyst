#!/usr/bin/env bash
set -euo pipefail

# MySQL systemd wrapper for containerd

CONTAINER_NAME=${CONTAINER_NAME:-catalyst-mysql}
CTR_NAMESPACE=${CTR_NAMESPACE:-catalyst}
PID_FILE=${PID_FILE:-/tmp/catalyst-mysql.pid}
MYSQL_IMAGE=${MYSQL_IMAGE:-docker.io/library/mysql:8.4}
RUNTIME=${RUNTIME:-io.containerd.runc.v2}
SNAPSHOTTER=${SNAPSHOTTER:-overlayfs}
DATA_DIR=${DATA_DIR:-/var/lib/catalyst/mysql}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-catalyst_dev}
MYSQL_DATABASE=${MYSQL_DATABASE:-catalyst_databases}

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
if ! ctr -n "$CTR_NAMESPACE" images ls 2>/dev/null | grep -q "$MYSQL_IMAGE"; then
  echo "Pulling image: $MYSQL_IMAGE"
  ctr -n "$CTR_NAMESPACE" images pull "$MYSQL_IMAGE"
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
echo "Starting MySQL container $CONTAINER_NAME..."

ctr -n "$CTR_NAMESPACE" run \
  --runtime "$RUNTIME" \
  --snapshotter "$SNAPSHOTTER" \
  --net-host \
  --mount type=bind,src="$DATA_DIR",dst=/var/lib/mysql,options=rw \
  --env "MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD" \
  --env "MYSQL_DATABASE=$MYSQL_DATABASE" \
  -d \
  "$MYSQL_IMAGE" "$CONTAINER_NAME"

# Get the PID of the container task
sleep 2
PID=$(ctr -n "$CTR_NAMESPACE" task ls 2>/dev/null | grep "^${CONTAINER_NAME}" | awk '{print $2}')

if [ -n "$PID" ]; then
  echo "$PID" > "$PID_FILE"
  echo "MySQL started with PID $PID"
fi
