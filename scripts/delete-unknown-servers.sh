#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/delete-unknown-servers.sh [SERVER_ID ...]
       scripts/delete-unknown-servers.sh --from-file path/to/ids.txt
       cat ids.txt | scripts/delete-unknown-servers.sh

Deletes unknown servers by ID using:
  nerdctl --namespace catalyst delete <server_id>
USAGE
}

ids=()

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "--from-file" ]]; then
  if [[ -z "${2:-}" ]]; then
    echo "Missing file path for --from-file" >&2
    usage
    exit 1
  fi
  if [[ ! -f "$2" ]]; then
    echo "File not found: $2" >&2
    exit 1
  fi
  mapfile -t ids < "$2"
  shift 2
else
  if [[ "$#" -gt 0 ]]; then
    ids=("$@")
  else
    # Read from stdin if no args were provided.
    if [[ -p /dev/stdin ]]; then
      mapfile -t ids
    fi
  fi
fi

if [[ "${#ids[@]}" -eq 0 ]]; then
  echo "No server IDs provided." >&2
  usage
  exit 1
fi

for raw_id in "${ids[@]}"; do
  server_id="$(echo "$raw_id" | tr -d '[:space:]')"
  if [[ -z "$server_id" ]]; then
    continue
  fi
  echo "Deleting server: $server_id"
  nerdctl --namespace catalyst delete "$server_id"
done
