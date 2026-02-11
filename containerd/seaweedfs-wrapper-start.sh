#!/usr/bin/env bash
set -euo pipefail

# SeaweedFS systemd wrapper for containerd

CONTAINER_NAME=${CONTAINER_NAME:-catalyst-seaweedfs}
CTR_NAMESPACE=${CTR_NAMESPACE:-catalyst}
PID_FILE=${PID_FILE:-/tmp/catalyst-seaweedfs.pid}
SEAWED_IMAGE=${SEAWED_IMAGE:-docker.io/chrislusf/seaweedfs:latest}
RUNTIME=${RUNTIME:-io.containerd.runc.v2}
SNAPSHOTTER=${SNAPSHOTTER:-overlayfs}
DATA_DIR=${DATA_DIR:-/var/lib/catalyst/seaweedfs}
S3_PORT=${S3_PORT:-8333}
MASTER_PORT=${MASTER_PORT:-9333}
VOLUME_PORT=${VOLUME_PORT:-8080}
FILER_PORT=${FILER_PORT:-8888}

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
if ! ctr -n "$CTR_NAMESPACE" images ls 2>/dev/null | grep -q "$SEAWED_IMAGE"; then
  echo "Pulling image: $SEAWED_IMAGE"
  ctr -n "$CTR_NAMESPACE" images pull "$SEAWED_IMAGE"
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
echo "Starting SeaweedFS container $CONTAINER_NAME..."

ctr -n "$CTR_NAMESPACE" run \
  --runtime "$RUNTIME" \
  --snapshotter "$SNAPSHOTTER" \
  --net-host \
  --mount type=bind,src="$DATA_DIR",dst=/data,options=rw \
  -d \
  "$SEAWED_IMAGE" "$CONTAINER_NAME" \
  server -dir=/data -ip=0.0.0.0 -master.port="$MASTER_PORT" -volume.port="$VOLUME_PORT" -filer -filer.port="$FILER_PORT" -s3 -s3.port="$S3_PORT"

# Get the PID of the container task
sleep 2
PID=$(ctr -n "$CTR_NAMESPACE" task ls 2>/dev/null | grep "^${CONTAINER_NAME}" | awk '{print $2}')

if [ -n "$PID" ]; then
  echo "$PID" > "$PID_FILE"
  echo "SeaweedFS started with PID $PID"
fi
