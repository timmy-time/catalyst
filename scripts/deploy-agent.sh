#!/bin/bash

# Catalyst Agent Deployment Script
# Installs and configures the Catalyst Agent on a fresh node

set -e

BACKEND_URL="${1:-http://localhost:3000}"
NODE_ID="${2:-node-$(hostname)}"
NODE_SECRET="${3:-}"

if [ -z "$NODE_SECRET" ]; then
    echo "Error: NODE_SECRET required"
    echo "Usage: $0 <backend_url> <node_id> <node_secret>"
    exit 1
fi

echo "=== Catalyst Agent Installation ==="
echo "Backend: $BACKEND_URL"
echo "Node ID: $NODE_ID"

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install dependencies
echo "Installing dependencies..."
apt-get install -y \
    curl \
    wget \
    unzip \
    build-essential \
    pkg-config \
    libssl-dev \
    containerd.io \
    nerdctl

# Create agent directory
echo "Creating agent directory..."
mkdir -p /opt/catalyst-agent
mkdir -p /var/lib/catalyst

# Download agent binary (placeholder)
echo "Downloading Catalyst Agent..."
# In production: wget https://releases.example.com/catalyst-agent-latest-linux-x64.zip
# unzip -o catalyst-agent-latest-linux-x64.zip -d /opt/catalyst-agent
# chmod +x /opt/catalyst-agent/catalyst-agent

# For now, assume we're compiling from source
if [ -f "$(pwd)/target/release/catalyst-agent" ]; then
    cp "$(pwd)/target/release/catalyst-agent" /opt/catalyst-agent/
    chmod +x /opt/catalyst-agent/catalyst-agent
fi

# Create configuration
echo "Creating configuration..."
cat > /opt/catalyst-agent/config.toml << EOF
[server]
backend_url = "${BACKEND_URL}"
node_id = "${NODE_ID}"
secret = "${NODE_SECRET}"
hostname = "$(hostname -f)"
data_dir = "/var/lib/catalyst"
max_connections = 100

[containerd]
socket_path = "/run/containerd/containerd.sock"
namespace = "catalyst"

[logging]
level = "info"
format = "json"
EOF

chmod 600 /opt/catalyst-agent/config.toml

# Create systemd service
echo "Installing systemd service..."
cat > /etc/systemd/system/catalyst-agent.service << EOF
[Unit]
Description=Catalyst Agent - Game Server Management
After=network.target containerd.service
Wants=network-online.target
Requires=containerd.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/catalyst-agent
ExecStart=/opt/catalyst-agent/catalyst-agent
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=yes

# Resource limits (optional)
MemoryLimit=512M
TasksMax=1000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable catalyst-agent

# Configure containerd namespace
echo "Configuring containerd..."
mkdir -p /etc/containerd
cat >> /etc/containerd/config.toml << EOF

[plugins."io.containerd.grpc.v1.cri".containerd]
  default_runtime_name = "runc"
  
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes."runc"]
  runtime_engine = ""
  runtime_root = ""
  runtime_type = "io.containerd.runc.v2"

  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes."runc".options]
    SystemdCgroup = true
EOF

systemctl restart containerd

# Start catalyst-agent
echo "Starting Catalyst Agent..."
systemctl start catalyst-agent

# Verify
sleep 2
if systemctl is-active --quiet catalyst-agent; then
    echo "✓ Catalyst Agent installed and running"
    systemctl status catalyst-agent
else
    echo "✗ Catalyst Agent failed to start"
    journalctl -u catalyst-agent -n 20
    exit 1
fi

echo ""
echo "Installation complete!"
echo "View logs: journalctl -u catalyst-agent -f"
