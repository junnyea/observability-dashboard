#!/bin/bash

DASHBOARD_DIR="/home/ubuntu/bulwark-stack-org/observability-dashboard"

echo "========================================"
echo "  Starting Observability Dashboard"
echo "========================================"

cd "$DASHBOARD_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Build client if not already built
if [ ! -d "client/dist" ]; then
    echo "Building client..."
    cd client && npm run build && cd ..
fi

# Start the server
echo "Starting dashboard server..."
node server/index.js
