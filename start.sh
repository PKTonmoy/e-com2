#!/usr/bin/env bash
set -euo pipefail

# PRELUX launcher: installs deps, starts MongoDB, backend, and frontend

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
DATA_DIR="$ROOT/data"
LOG_DIR="$DATA_DIR/logs"

ensure_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Required command '$1' not found. Please install it and re-run."
    exit 1
  fi
}

check_mongo_connection() {
  local max_attempts=15
  local attempt=1
  while [ $attempt -le $max_attempts ]; do
    # Try mongosh first (MongoDB 6+)
    if command -v mongosh >/dev/null 2>&1; then
      if mongosh --quiet --eval "db.runCommand({ ping: 1 })" mongodb://localhost:27017/prelux >/dev/null 2>&1; then
        return 0
      fi
    # Try legacy mongo client
    elif command -v mongo >/dev/null 2>&1; then
      if mongo --quiet --eval "db.runCommand({ ping: 1 })" mongodb://localhost:27017/prelux >/dev/null 2>&1; then
        return 0
      fi
    fi
    # Fallback: check if port is open (doesn't verify DB is ready, but better than nothing)
    if command -v nc >/dev/null 2>&1; then
      if nc -z localhost 27017 2>/dev/null; then
        # Port is open, give it a moment and return success
        sleep 1
        return 0
      fi
    fi
    if [ $attempt -lt $max_attempts ]; then
      echo "  Waiting for MongoDB to be ready... ($attempt/$max_attempts)"
      sleep 2
    fi
    attempt=$((attempt + 1))
  done
  return 1
}

start_mongo_docker() {
  local container_name="mongodb"
  local port="27017"
  local volume_name="prelux_mongodb_data"
  
  # Check if container exists but is stopped
  if docker ps -a --filter "name=$container_name" --format '{{.Names}}' 2>/dev/null | grep -q "^$container_name$"; then
    echo "• Starting existing MongoDB container '$container_name'..."
    if docker start "$container_name" >/dev/null 2>&1; then
      echo "✓ MongoDB container started"
      return 0
    else
      echo "❌ Failed to start MongoDB container"
      return 1
    fi
  fi
  
  # Container doesn't exist, create it
  echo "• Creating new MongoDB Docker container '$container_name'..."
  if docker run -d \
    --name "$container_name" \
    -p "${port}:27017" \
    -v "${volume_name}:/data/db" \
    --restart unless-stopped \
    mongo:latest >/dev/null 2>&1; then
    echo "✓ MongoDB container created and started"
    return 0
  else
    echo "❌ Failed to create MongoDB container"
    return 1
  fi
}

start_mongo_local() {
  echo "• Starting local mongod..."
  if mongod --dbpath "$DATA_DIR/db" --logpath "$LOG_DIR/mongod.log" --fork --bind_ip 127.0.0.1 >/dev/null 2>&1; then
    echo "✓ mongod started (dbpath: $DATA_DIR/db, log: $LOG_DIR/mongod.log)"
    return 0
  else
    echo "❌ Failed to start mongod. Check $LOG_DIR/mongod.log"
    return 1
  fi
}

ensure_cmd node
ensure_cmd npm
# Mongo can be provided by local mongod or docker container "mongodb"

mkdir -p "$DATA_DIR/db" "$LOG_DIR"

echo "▶ Checking MongoDB..."
MONGO_STARTED=false
MONGO_VERIFIED=false

# Strategy 1: Check for running Docker MongoDB container
if command -v docker >/dev/null 2>&1; then
  if docker ps --filter "name=mongodb" --filter "status=running" --format '{{.Names}}' 2>/dev/null | grep -q '^mongodb$'; then
    echo "• Found running Docker container 'mongodb' on port 27017"
    MONGO_STARTED=true
  elif docker ps -a --filter "name=mongodb" --format '{{.Names}}' 2>/dev/null | grep -q '^mongodb$'; then
    # Container exists but is stopped - start it
    echo "• Found stopped Docker container 'mongodb' - starting it..."
    if start_mongo_docker; then
      MONGO_STARTED=true
    fi
  else
    # No container exists - create and start it
    echo "• No MongoDB Docker container found - creating one..."
    if start_mongo_docker; then
      MONGO_STARTED=true
    fi
  fi
fi

# Strategy 2: If Docker didn't work, try local mongod
if [ "$MONGO_STARTED" = false ]; then
  if pgrep -x mongod >/dev/null 2>&1; then
    echo "• Found running local mongod process"
    MONGO_STARTED=true
  elif command -v mongod >/dev/null 2>&1; then
    echo "• Starting local mongod..."
    if start_mongo_local; then
      MONGO_STARTED=true
    fi
  else
    echo "⚠️  Warning: Neither Docker nor local mongod found."
    echo "   Please ensure MongoDB is running on port 27017"
    echo "   Or install Docker and run: docker run -d --name mongodb -p 27017:27017 mongo:latest"
  fi
fi

# Verify MongoDB connection
if [ "$MONGO_STARTED" = true ]; then
  echo "• Verifying MongoDB connection..."
  if check_mongo_connection; then
    echo "✓ MongoDB is ready and accessible"
    MONGO_VERIFIED=true
  else
    echo "⚠️  Warning: MongoDB may have started but connection verification failed"
    echo "   The application will attempt to connect anyway"
  fi
else
  echo "⚠️  Warning: MongoDB startup failed or was not found"
  echo "   The application may fail to start without MongoDB"
fi

# Check for .env files and create if missing
echo "▶ Checking environment files..."
if [ ! -f "$BACKEND/.env" ]; then
  echo "⚠️  Warning: $BACKEND/.env not found. Creating from template..."
  if cat > "$BACKEND/.env" << 'EOF'
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/prelux
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLIENT_URL=http://localhost:5173
EOF
  then
    echo "• Created $BACKEND/.env - please review and update JWT_SECRET"
  else
    echo "❌ Failed to create $BACKEND/.env"
    exit 1
  fi
else
  echo "✓ Backend .env file exists"
fi

if [ ! -f "$FRONTEND/.env" ]; then
  echo "⚠️  Warning: $FRONTEND/.env not found. Creating from template..."
  if cat > "$FRONTEND/.env" << 'EOF'
VITE_API_URL=http://localhost:5000/api
EOF
  then
    echo "• Created $FRONTEND/.env"
  else
    echo "❌ Failed to create $FRONTEND/.env"
    exit 1
  fi
else
  echo "✓ Frontend .env file exists"
fi

echo "▶ Installing backend dependencies (if needed)..."
if [ ! -d "$BACKEND/node_modules" ]; then
  (cd "$BACKEND" && npm install) || {
    echo "❌ Failed to install backend dependencies"
    exit 1
  }
else
  echo "• backend/node_modules present, skipping npm install."
fi

echo "▶ Installing frontend dependencies (if needed)..."
if [ ! -d "$FRONTEND/node_modules" ]; then
  (cd "$FRONTEND" && npm install) || {
    echo "❌ Failed to install frontend dependencies"
    exit 1
  }
else
  echo "• frontend/node_modules present, skipping npm install."
fi

# Cleanup function
cleanup() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Stopping PRELUX services..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Stop backend
  if [ -n "${BACK_PID:-}" ] && kill -0 $BACK_PID 2>/dev/null; then
    echo "• Stopping backend (PID: $BACK_PID)..."
    kill $BACK_PID 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if kill -0 $BACK_PID 2>/dev/null; then
      kill -9 $BACK_PID 2>/dev/null || true
    fi
  fi
  
  # Stop frontend
  if [ -n "${FRONT_PID:-}" ] && kill -0 $FRONT_PID 2>/dev/null; then
    echo "• Stopping frontend (PID: $FRONT_PID)..."
    kill $FRONT_PID 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if kill -0 $FRONT_PID 2>/dev/null; then
      kill -9 $FRONT_PID 2>/dev/null || true
    fi
  fi
  
  # Clean up any remaining processes
  echo "• Cleaning up remaining processes..."
  pkill -f "nodemon.*backend/src/server.js" 2>/dev/null || true
  pkill -f "vite.*frontend" 2>/dev/null || true
  
  echo "✓ All services stopped"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
}

trap cleanup INT TERM

# Check if backend port is already in use
if command -v lsof >/dev/null 2>&1; then
  if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Port 5000 is already in use"
    echo "   Another process may be using the backend port"
  fi
fi

# Check if frontend port is already in use
if command -v lsof >/dev/null 2>&1; then
  if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Warning: Port 5173 is already in use"
    echo "   Another process may be using the frontend port"
  fi
fi

echo "▶ Starting PRELUX backend..."
if [ ! -f "$BACKEND/package.json" ]; then
  echo "❌ Error: $BACKEND/package.json not found"
  exit 1
fi

(cd "$BACKEND" && NODE_ENV=development npm run dev) >"$LOG_DIR/backend.log" 2>&1 &
BACK_PID=$!
echo "• Backend PID: $BACK_PID (log: $LOG_DIR/backend.log)"

# Wait and verify backend started successfully
sleep 3
if ! kill -0 $BACK_PID 2>/dev/null; then
  echo "❌ Backend process died immediately. Check $LOG_DIR/backend.log"
  echo "Last 30 lines of backend.log:"
  tail -30 "$LOG_DIR/backend.log" || echo "Log file not found or empty"
  exit 1
fi

# Check if backend is listening on port
sleep 2
if command -v curl >/dev/null 2>&1; then
  if curl -s http://localhost:5000/health >/dev/null 2>&1 || curl -s http://localhost:5000/ >/dev/null 2>&1; then
    echo "✓ Backend is responding on port 5000"
  else
    echo "⚠️  Backend started but not responding yet (may need more time)"
  fi
fi

echo "▶ Starting PRELUX frontend..."
if [ ! -f "$FRONTEND/package.json" ]; then
  echo "❌ Error: $FRONTEND/package.json not found"
  cleanup
  exit 1
fi

(cd "$FRONTEND" && npm run dev -- --host) >"$LOG_DIR/frontend.log" 2>&1 &
FRONT_PID=$!
echo "• Frontend PID: $FRONT_PID (log: $LOG_DIR/frontend.log)"

# Wait and verify frontend started successfully
sleep 3
if ! kill -0 $FRONT_PID 2>/dev/null; then
  echo "❌ Frontend process died immediately. Check $LOG_DIR/frontend.log"
  echo "Last 30 lines of frontend.log:"
  tail -30 "$LOG_DIR/frontend.log" || echo "Log file not found or empty"
  cleanup
  exit 1
fi

# Check if frontend is listening on port
sleep 2
if command -v curl >/dev/null 2>&1; then
  if curl -s http://localhost:5173/ >/dev/null 2>&1; then
    echo "✓ Frontend is responding on port 5173"
  else
    echo "⚠️  Frontend started but not responding yet (may need more time)"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ PRELUX is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "• API:      http://localhost:5000"
echo "• Frontend: http://localhost:5173"
if [ "$MONGO_VERIFIED" = true ]; then
  echo "• MongoDB:  ✓ Connected (mongodb://localhost:27017/prelux)"
else
  echo "• MongoDB:  ⚠️  Connection status unknown"
fi
echo "• Logs:     $LOG_DIR/"
echo ""
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Monitor processes and wait
while true; do
  sleep 5
  # Check if backend is still running
  if ! kill -0 $BACK_PID 2>/dev/null; then
    echo ""
    echo "❌ Backend process (PID: $BACK_PID) died unexpectedly!"
    echo "Last 20 lines of backend.log:"
    tail -20 "$LOG_DIR/backend.log" 2>/dev/null || echo "Log file not found"
    cleanup
    exit 1
  fi
  # Check if frontend is still running
  if ! kill -0 $FRONT_PID 2>/dev/null; then
    echo ""
    echo "❌ Frontend process (PID: $FRONT_PID) died unexpectedly!"
    echo "Last 20 lines of frontend.log:"
    tail -20 "$LOG_DIR/frontend.log" 2>/dev/null || echo "Log file not found"
    cleanup
    exit 1
  fi
done

