#!/usr/bin/env bash

# Catalyst Agent Uninstall Script
# Stops, disables, and removes the Catalyst Agent from a node.

set -euo pipefail

log() { echo "[uninstall-agent] $*"; }
fail() { echo "[uninstall-agent] ERROR: $*" >&2; exit 1; }

if [ "$EUID" -ne 0 ]; then
    fail "This script must be run as root."
fi

require_systemd() {
    command -v systemctl >/dev/null 2>&1 || fail "systemctl is required for uninstall."
}

detect_pkg_manager() {
    if command -v apt-get >/dev/null 2>&1; then echo "apt"; return; fi
    echo ""
}

stop_and_disable_service() {
    if systemctl list-unit-files --type=service | awk '{print $1}' | grep -qx "catalyst-agent.service"; then
        log "Stopping catalyst-agent service..."
        systemctl stop catalyst-agent >/dev/null 2>&1 || true
        log "Disabling catalyst-agent service..."
        systemctl disable catalyst-agent >/dev/null 2>&1 || true
        systemctl reset-failed catalyst-agent >/dev/null 2>&1 || true
    else
        log "catalyst-agent service not registered."
    fi
}

remove_unit_file() {
    if [ -f /etc/systemd/system/catalyst-agent.service ]; then
        log "Removing systemd unit file..."
        rm -f /etc/systemd/system/catalyst-agent.service
    fi

    if [ -f /etc/systemd/system/multi-user.target.wants/catalyst-agent.service ]; then
        rm -f /etc/systemd/system/multi-user.target.wants/catalyst-agent.service
    fi
}

remove_files() {
    if [ -d /opt/catalyst-agent ]; then
        log "Removing /opt/catalyst-agent..."
        rm -rf /opt/catalyst-agent
    fi

    if [ -d /var/lib/catalyst ]; then
        log "Removing /var/lib/catalyst..."
        rm -rf /var/lib/catalyst
    fi

    if [ -d /tmp/catalyst-console ]; then
        log "Removing /tmp/catalyst-console..."
        rm -rf /tmp/catalyst-console
    fi

    if [ -d /opt/cni/bin ]; then
        log "Removing /opt/cni/bin..."
        rm -rf /opt/cni/bin
    fi

    if [ -d /etc/cni/net.d ]; then
        log "Removing /etc/cni/net.d..."
        rm -rf /etc/cni/net.d
    fi

    if [ -d /var/lib/cni ]; then
        log "Removing /var/lib/cni..."
        rm -rf /var/lib/cni
    fi

    if [ -f /usr/local/bin/nerdctl ]; then
        log "Removing /usr/local/bin/nerdctl..."
        rm -f /usr/local/bin/nerdctl
    fi

    if [ -f /usr/local/bin/nerdctl-ctr ]; then
        log "Removing /usr/local/bin/nerdctl-ctr..."
        rm -f /usr/local/bin/nerdctl-ctr
    fi
}

remove_packages() {
    local pm
    pm="$(detect_pkg_manager)"
    if [ -z "$pm" ]; then
        log "No supported package manager detected; skipping package removal."
        return 0
    fi

    log "Removing system dependencies via $pm..."
    case "$pm" in
        apt)
            apt-get purge -y \
                ca-certificates curl wget jq tar gzip unzip \
                iproute2 iptables rsync util-linux e2fsprogs \
                containerd runc || true
            apt-get autoremove -y || true
            ;;
        *)
            log "Unsupported package manager for removal; skipping."
            ;;
    esac
}

reload_systemd() {
    log "Reloading systemd daemon..."
    systemctl daemon-reload
    systemctl reset-failed >/dev/null 2>&1 || true
}

main() {
    log "=== Catalyst Agent Uninstall ==="
    require_systemd
    stop_and_disable_service
    remove_unit_file
    remove_files
    remove_packages
    reload_systemd
    log "Uninstall complete."
}

main "$@"
