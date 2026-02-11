#!/usr/bin/env bash
set -euo pipefail

# Compose-to-containerd helper
# Starts PostgreSQL and Redis using containerd directly (no nerdctl required)
# This is the recommended way to run Catalyst dependencies

CTR_NAMESPACE=${CTR_NAMESPACE:-catalyst}

# PostgreSQL configuration
POSTGRES_CONTAINER=${POSTGRES_CONTAINER:-catalyst-postgres}
POSTGRES_IMAGE=${POSTGRES_IMAGE:-docker.io/library/postgres:16-alpine}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-catalyst}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-catalyst_dev_password}
POSTGRES_DB=${POSTGRES_DB:-catalyst_db}
POSTGRES_DATA_DIR=${POSTGRES_DATA_DIR:-/var/lib/catalyst/postgres-data}

# Redis configuration
REDIS_CONTAINER=${REDIS_CONTAINER:-catalyst-redis}
REDIS_IMAGE=${REDIS_IMAGE:-docker.io/library/redis:7-alpine}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_DATA_DIR=${REDIS_DATA_DIR:-/var/lib/catalyst/redis-data}

# Runtime configuration
RUNTIME=${RUNTIME:-io.containerd.runc.v2}
SNAPSHOTTER=${SNAPSHOTTER:-overlayfs}

# Check for ctr command
if ! command -v ctr >/dev/null 2>&1; then
  echo "ctr (containerd CLI) is required but not installed" >&2
  echo "Install containerd to use this script" >&2
  exit 1
fi

mkdir -p "$POSTGRES_DATA_DIR" "$REDIS_DATA_DIR"

# Function to check if task is running
task_running() {
  ctr -n "$CTR_NAMESPACE" task ls 2>/dev/null | grep -q "^${1}.*RUNNING"
}

# Function to pull image
pull_image() {
  local image="$1"
  echo "Pulling image: $image"
  if ! ctr -n "$CTR_NAMESPACE" images ls 2>/dev/null | grep -q "$image"; then
    ctr -n "$CTR_NAMESPACE" images pull "$image"
  fi
}

# Start PostgreSQL
start_postgres() {
  if task_running "$POSTGRES_CONTAINER"; then
    echo "PostgreSQL container '$POSTGRES_CONTAINER' is already running."
  else
    echo "Starting PostgreSQL container: $POSTGRES_CONTAINER"

    # Remove old container if exists
    if ctr -n "$CTR_NAMESPACE" containers ls 2>/dev/null | grep -q "^${POSTGRES_CONTAINER}$"; then
      ctr -n "$CTR_NAMESPACE" containers rm "$POSTGRES_CONTAINER" || true
    fi

    pull_image "$POSTGRES_IMAGE"

    ctr -n "$CTR_NAMESPACE" run \
      --rm \
      --runtime "$RUNTIME" \
      --snapshotter "$SNAPSHOTTER" \
      --net-host \
      --mount type=bind,src="$POSTGRES_DATA_DIR",dst=/var/lib/postgresql/data,options=rw \
      --env "POSTGRES_USER=$POSTGRES_USER" \
      --env "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
      --env "POSTGRES_DB=$POSTGRES_DB" \
      --env "PGDATA=/var/lib/postgresql/data/pgdata" \
      -d \
      "$POSTGRES_IMAGE" "$POSTGRES_CONTAINER"
  fi
}

# Start Redis
start_redis() {
  if task_running "$REDIS_CONTAINER"; then
    echo "Redis container '$REDIS_CONTAINER' is already running."
  else
    echo "Starting Redis container: $REDIS_CONTAINER"

    # Remove old container if exists
    if ctr -n "$CTR_NAMESPACE" containers ls 2>/dev/null | grep -q "^${REDIS_CONTAINER}$"; then
      ctr -n "$CTR_NAMESPACE" containers rm "$REDIS_CONTAINER" || true
    fi

    pull_image "$REDIS_IMAGE"

    ctr -n "$CTR_NAMESPACE" run \
      --rm \
      --runtime "$RUNTIME" \
      --snapshotter "$SNAPSHOTTER" \
      --net-host \
      --mount type=bind,src="$REDIS_DATA_DIR",dst=/data,options=rw \
      -d \
      "$REDIS_IMAGE" "$REDIS_CONTAINER" \
      redis-server --appendonly yes --save 60 1 --dir /data
  fi
}

# Start both services
start_postgres
start_redis

# Health checks
echo ""
echo "Waiting for services to be ready..."

# PostgreSQL health check
echo "Waiting for PostgreSQL to accept connections on port ${POSTGRES_PORT}..."
for i in $(seq 1 30); do
  if ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${POSTGRES_PORT}$"; then
    echo "PostgreSQL is listening on port ${POSTGRES_PORT}."
    break
  fi
  sleep 1
done

# Redis health check
echo "Waiting for Redis to respond on port ${REDIS_PORT}..."
for i in $(seq 1 30); do
  if ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${REDIS_PORT}$"; then
    echo "Redis is listening on port ${REDIS_PORT}."
    break
  fi
  sleep 1
done

cat <<EOF

Setup complete.
- PostgreSQL container: $POSTGRES_CONTAINER (port ${POSTGRES_PORT})
  Data dir: $POSTGRES_DATA_DIR
  Connection: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}

- Redis container: $REDIS_CONTAINER (port ${REDIS_PORT})
  Data dir: $REDIS_DATA_DIR

Notes:
- These services use containerd directly (no nerdctl/Docker required)
- For automatic restart on boot, install the systemd services:
  sudo cp containerd/catalyst-postgres.service /etc/systemd/system/
  sudo cp containerd/catalyst-redis.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable catalyst-postgres catalyst-redis

- To manage services:
  ctr -n ${CTR_NAMESPACE} tasks ls      # List running tasks
  ctr -n ${CTR_NAMESPACE} tasks logs <name>  # View logs
  ctr -n ${CTR_NAMESPACE} task kill <name> SIGTERM  # Stop gracefully

EOF
