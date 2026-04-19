#!/bin/bash

# Start server in background
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Call health check endpoint
RESPONSE=$(curl -s http://localhost:5000/health)

# Kill the server
kill $SERVER_PID 2>/dev/null

# Check response
if [ "$RESPONSE" = "OK" ]; then
  echo "TEST PASSED"
  exit 0
else
  echo "TEST FAILED"
  exit 1
fi
