#!/usr/bin/env bash
set -uo pipefail

# PRELUX launcher: installs deps, starts MongoDB, backend, and frontend
# Enhanced error handling version

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
DATA_DIR="$ROOT/data"
LOG_DIR="$DATA_DIR/logs"

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}•${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC}  $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }
log_header() { echo -e "\n${BLUE}▶${NC} $1"; }

ensure_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_error "Required command '$1' not found. Please install it and re-run."
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
    log_info "Starting existing MongoDB container '$container_name'..."
    if docker start "$container_name" >/dev/null 2>&1; then
      log_success "MongoDB container started"
      return 0
    else
      log_error "Failed to start MongoDB container"
      return 1
    fi
  fi
  
  # Container doesn't exist, create it
  log_info "Creating new MongoDB Docker container '$container_name'..."
  if docker run -d \
    --name "$container_name" \
    -p "${port}:27017" \
    -v "${volume_name}:/data/db" \
    --restart unless-stopped \
    mongo:latest >/dev/null 2>&1; then
    log_success "MongoDB container created and started"
    return 0
  else
    log_error "Failed to create MongoDB container"
    return 1
  fi
}

start_mongo_local() {
  log_info "Starting local mongod..."
  if mongod --dbpath "$DATA_DIR/db" --logpath "$LOG_DIR/mongod.log" --fork --bind_ip 127.0.0.1 >/dev/null 2>&1; then
    log_success "mongod started (dbpath: $DATA_DIR/db, log: $LOG_DIR/mongod.log)"
    return 0
  else
    log_error "Failed to start mongod. Check $LOG_DIR/mongod.log"
    return 1
  fi
}

# Fix common config file issues (ES module vs CommonJS)
fix_config_files() {
  log_header "Checking and fixing config files..."
  
  local files_fixed=0
  
  # Fix postcss.config.js if it uses ES module syntax
  if [ -f "$FRONTEND/postcss.config.js" ]; then
    if grep -q "^export default" "$FRONTEND/postcss.config.js" 2>/dev/null; then
      log_warning "postcss.config.js uses ES module syntax - fixing..."
      sed -i 's/^export default/module.exports =/' "$FRONTEND/postcss.config.js"
      log_success "Fixed postcss.config.js"
      files_fixed=$((files_fixed + 1))
    fi
  fi
  
  # Fix tailwind.config.js if it uses ES module syntax
  if [ -f "$FRONTEND/tailwind.config.js" ]; then
    if grep -q "^export default" "$FRONTEND/tailwind.config.js" 2>/dev/null; then
      log_warning "tailwind.config.js uses ES module syntax - fixing..."
      sed -i 's/^export default/module.exports =/' "$FRONTEND/tailwind.config.js"
      log_success "Fixed tailwind.config.js"
      files_fixed=$((files_fixed + 1))
    fi
  fi
  
  if [ $files_fixed -eq 0 ]; then
    log_success "All config files are correctly formatted"
  else
    log_success "Fixed $files_fixed config file(s)"
  fi
}

# Validate Node.js version
check_node_version() {
  local required_major=18
  local node_version=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
  
  if [ -z "$node_version" ]; then
    log_error "Node.js is not installed or not in PATH"
    return 1
  fi
  
  if [ "$node_version" -lt "$required_major" ]; then
    log_warning "Node.js $node_version detected. Version $required_major+ is recommended."
  else
    log_success "Node.js v$node_version detected"
  fi
  return 0
}

# Clean npm cache and reinstall if needed
fix_npm_issues() {
  local dir=$1
  local name=$2
  
  log_warning "Attempting to fix $name npm issues..."
  
  # Remove node_modules and package-lock.json
  rm -rf "$dir/node_modules" "$dir/package-lock.json" 2>/dev/null
  
  # Clear npm cache
  npm cache clean --force 2>/dev/null || true
  
  # Reinstall
  log_info "Reinstalling $name dependencies..."
  if (cd "$dir" && npm install 2>&1); then
    log_success "$name dependencies reinstalled successfully"
    return 0
  else
    log_error "Failed to reinstall $name dependencies"
    return 1
  fi
}

# Check for port availability
check_port() {
  local port=$1
  local name=$2
  
  if command -v lsof >/dev/null 2>&1; then
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      return 1
    fi
  elif command -v ss >/dev/null 2>&1; then
    if ss -tuln | grep -q ":$port "; then
      return 1
    fi
  elif command -v netstat >/dev/null 2>&1; then
    if netstat -tuln | grep -q ":$port "; then
      return 1
    fi
  fi
  return 0
}

# Kill processes on a specific port
kill_port() {
  local port=$1
  
  if command -v lsof >/dev/null 2>&1; then
    local pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "$pids" | xargs kill -9 2>/dev/null || true
      sleep 1
      return 0
    fi
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k $port/tcp 2>/dev/null || true
    sleep 1
    return 0
  fi
  return 1
}

ensure_cmd node
ensure_cmd npm

mkdir -p "$DATA_DIR/db" "$LOG_DIR"

# Check Node.js version
log_header "Checking system requirements..."
check_node_version

log_header "Checking MongoDB..."
MONGO_STARTED=false
MONGO_VERIFIED=false

# Strategy 1: Check for running Docker MongoDB container
if command -v docker >/dev/null 2>&1; then
  if docker ps --filter "name=mongodb" --filter "status=running" --format '{{.Names}}' 2>/dev/null | grep -q '^mongodb$'; then
    log_info "Found running Docker container 'mongodb' on port 27017"
    MONGO_STARTED=true
  elif docker ps -a --filter "name=mongodb" --format '{{.Names}}' 2>/dev/null | grep -q '^mongodb$'; then
    # Container exists but is stopped - start it
    log_info "Found stopped Docker container 'mongodb' - starting it..."
    if start_mongo_docker; then
      MONGO_STARTED=true
    fi
  else
    # No container exists - create and start it
    log_info "No MongoDB Docker container found - creating one..."
    if start_mongo_docker; then
      MONGO_STARTED=true
    fi
  fi
fi

# Strategy 2: If Docker didn't work, try local mongod
if [ "$MONGO_STARTED" = false ]; then
  if pgrep -x mongod >/dev/null 2>&1; then
    log_info "Found running local mongod process"
    MONGO_STARTED=true
  elif command -v mongod >/dev/null 2>&1; then
    log_info "Starting local mongod..."
    if start_mongo_local; then
      MONGO_STARTED=true
    fi
  else
    log_warning "Neither Docker nor local mongod found."
    echo "   Please ensure MongoDB is running on port 27017"
    echo "   Or install Docker and run: docker run -d --name mongodb -p 27017:27017 mongo:latest"
  fi
fi

# Verify MongoDB connection
if [ "$MONGO_STARTED" = true ]; then
  log_info "Verifying MongoDB connection..."
  if check_mongo_connection; then
    log_success "MongoDB is ready and accessible"
    MONGO_VERIFIED=true
  else
    log_warning "MongoDB may have started but connection verification failed"
    echo "   The application will attempt to connect anyway"
  fi
else
  log_warning "MongoDB startup failed or was not found"
  echo "   The application may fail to start without MongoDB"
fi

# Fix config files before checking dependencies
fix_config_files

# Check for .env files and create if missing
log_header "Checking environment files..."
if [ ! -f "$BACKEND/.env" ]; then
  log_warning "$BACKEND/.env not found. Creating from template..."
  if cat > "$BACKEND/.env" << 'EOF'
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb+srv://pktonmoy:%23iamTonmoy01@cluster0.lapvnow.mongodb.net/prelux?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLIENT_URL=http://localhost:5173
EOF
  then
    log_info "Created $BACKEND/.env - please review and update JWT_SECRET"
  else
    log_error "Failed to create $BACKEND/.env"
    exit 1
  fi
else
  log_success "Backend .env file exists"
fi

if [ ! -f "$FRONTEND/.env" ]; then
  log_warning "$FRONTEND/.env not found. Creating from template..."
  if cat > "$FRONTEND/.env" << 'EOF'
VITE_API_URL=http://localhost:5001/api
EOF
  then
    log_info "Created $FRONTEND/.env"
  else
    log_error "Failed to create $FRONTEND/.env"
    exit 1
  fi
else
  log_success "Frontend .env file exists"
fi

log_header "Installing backend dependencies (if needed)..."
if [ ! -d "$BACKEND/node_modules" ]; then
  if ! (cd "$BACKEND" && npm install); then
    log_error "Failed to install backend dependencies"
    log_info "Attempting to fix npm issues..."
    if ! fix_npm_issues "$BACKEND" "backend"; then
      log_error "Could not fix backend npm issues. Please check package.json and try manually."
      exit 1
    fi
  fi
else
  log_info "backend/node_modules present, skipping npm install."
fi

log_header "Installing frontend dependencies (if needed)..."
if [ ! -d "$FRONTEND/node_modules" ]; then
  if ! (cd "$FRONTEND" && npm install); then
    log_error "Failed to install frontend dependencies"
    log_info "Attempting to fix npm issues..."
    if ! fix_npm_issues "$FRONTEND" "frontend"; then
      log_error "Could not fix frontend npm issues. Please check package.json and try manually."
      exit 1
    fi
  fi
else
  log_info "frontend/node_modules present, skipping npm install."
fi

# Cleanup function
cleanup() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Stopping PRELUX services..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Stop backend
  if [ -n "${BACK_PID:-}" ] && kill -0 $BACK_PID 2>/dev/null; then
    log_info "Stopping backend (PID: $BACK_PID)..."
    kill $BACK_PID 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if kill -0 $BACK_PID 2>/dev/null; then
      kill -9 $BACK_PID 2>/dev/null || true
    fi
  fi
  
  # Stop frontend
  if [ -n "${FRONT_PID:-}" ] && kill -0 $FRONT_PID 2>/dev/null; then
    log_info "Stopping frontend (PID: $FRONT_PID)..."
    kill $FRONT_PID 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if kill -0 $FRONT_PID 2>/dev/null; then
      kill -9 $FRONT_PID 2>/dev/null || true
    fi
  fi
  
  # Clean up any remaining processes
  log_info "Cleaning up remaining processes..."
  pkill -f "nodemon.*backend/src/server.js" 2>/dev/null || true
  pkill -f "vite.*frontend" 2>/dev/null || true
  
  log_success "All services stopped"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
}

trap cleanup INT TERM

# Kill any existing processes on backend port 5001
log_header "Checking and clearing ports..."
if ! check_port 5001 "backend"; then
  log_info "Found processes on port 5001 - killing them..."
  kill_port 5001
  log_success "Cleared port 5001"
fi

# Kill any existing processes on frontend port 5173
if ! check_port 5173 "frontend"; then
  log_info "Found processes on port 5173 - killing them..."
  kill_port 5173
  log_success "Cleared port 5173"
fi

# Also kill any lingering nodemon or node processes for this project
pkill -f "nodemon.*backend/src/server.js" 2>/dev/null || true
pkill -f "vite.*frontend" 2>/dev/null || true
sleep 1

log_header "Starting PRELUX backend..."
if [ ! -f "$BACKEND/package.json" ]; then
  log_error "$BACKEND/package.json not found"
  exit 1
fi

(cd "$BACKEND" && NODE_ENV=development npm run dev) >"$LOG_DIR/backend.log" 2>&1 &
BACK_PID=$!
log_info "Backend PID: $BACK_PID (log: $LOG_DIR/backend.log)"

# Wait and verify backend started successfully
sleep 3
if ! kill -0 $BACK_PID 2>/dev/null; then
  log_error "Backend process died immediately. Check $LOG_DIR/backend.log"
  echo "Last 30 lines of backend.log:"
  tail -30 "$LOG_DIR/backend.log" || echo "Log file not found or empty"
  
  # Try to fix and restart
  log_info "Attempting to fix backend issues..."
  if fix_npm_issues "$BACKEND" "backend"; then
    log_info "Retrying backend startup..."
    (cd "$BACKEND" && NODE_ENV=development npm run dev) >"$LOG_DIR/backend.log" 2>&1 &
    BACK_PID=$!
    sleep 3
    if ! kill -0 $BACK_PID 2>/dev/null; then
      log_error "Backend still failing after fix attempt"
      exit 1
    fi
    log_success "Backend started after fix"
  else
    exit 1
  fi
fi

# Check if backend is listening on port
sleep 2
if command -v curl >/dev/null 2>&1; then
  if curl -s http://localhost:5001/health >/dev/null 2>&1 || curl -s http://localhost:5001/ >/dev/null 2>&1; then
    log_success "Backend is responding on port 5001"
  else
    log_warning "Backend started but not responding yet (may need more time)"
  fi
fi

log_header "Starting PRELUX frontend..."
if [ ! -f "$FRONTEND/package.json" ]; then
  log_error "$FRONTEND/package.json not found"
  cleanup
  exit 1
fi

# Re-check config files before starting frontend
fix_config_files

(cd "$FRONTEND" && npm run dev -- --host) >"$LOG_DIR/frontend.log" 2>&1 &
FRONT_PID=$!
log_info "Frontend PID: $FRONT_PID (log: $LOG_DIR/frontend.log)"

# Wait and verify frontend started successfully
sleep 5
if ! kill -0 $FRONT_PID 2>/dev/null; then
  log_error "Frontend process died immediately. Check $LOG_DIR/frontend.log"
  echo "Last 50 lines of frontend.log:"
  tail -50 "$LOG_DIR/frontend.log" || echo "Log file not found or empty"
  
  # Check for common errors and attempt fixes
  if grep -q "Unexpected token 'export'" "$LOG_DIR/frontend.log" 2>/dev/null; then
    log_warning "Detected ES module syntax error in config files"
    fix_config_files
    
    log_info "Retrying frontend startup..."
    (cd "$FRONTEND" && npm run dev -- --host) >"$LOG_DIR/frontend.log" 2>&1 &
    FRONT_PID=$!
    sleep 5
    if ! kill -0 $FRONT_PID 2>/dev/null; then
      log_error "Frontend still failing after config fix"
      tail -30 "$LOG_DIR/frontend.log" || true
      cleanup
      exit 1
    fi
    log_success "Frontend started after config fix"
  elif grep -q "Cannot find module" "$LOG_DIR/frontend.log" 2>/dev/null; then
    log_warning "Detected missing module error"
    if fix_npm_issues "$FRONTEND" "frontend"; then
      log_info "Retrying frontend startup..."
      (cd "$FRONTEND" && npm run dev -- --host) >"$LOG_DIR/frontend.log" 2>&1 &
      FRONT_PID=$!
      sleep 5
      if ! kill -0 $FRONT_PID 2>/dev/null; then
        log_error "Frontend still failing after npm fix"
        cleanup
        exit 1
      fi
      log_success "Frontend started after npm fix"
    else
      cleanup
      exit 1
    fi
  else
    # Unknown error - try reinstalling dependencies
    log_warning "Unknown error - attempting full reinstall..."
    if fix_npm_issues "$FRONTEND" "frontend"; then
      fix_config_files
      log_info "Retrying frontend startup..."
      (cd "$FRONTEND" && npm run dev -- --host) >"$LOG_DIR/frontend.log" 2>&1 &
      FRONT_PID=$!
      sleep 5
      if ! kill -0 $FRONT_PID 2>/dev/null; then
        log_error "Frontend still failing after reinstall"
        tail -30 "$LOG_DIR/frontend.log" || true
        cleanup
        exit 1
      fi
      log_success "Frontend started after reinstall"
    else
      cleanup
      exit 1
    fi
  fi
fi

# Check if frontend is listening on port
sleep 2
if command -v curl >/dev/null 2>&1; then
  if curl -s http://localhost:5173/ >/dev/null 2>&1; then
    log_success "Frontend is responding on port 5173"
  else
    log_warning "Frontend started but not responding yet (may need more time)"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ PRELUX is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "• API:      http://localhost:5001"
echo "• Frontend: http://localhost:5173"
if [ "$MONGO_VERIFIED" = true ]; then
  echo "• MongoDB:  ✓ Connected (MongoDB Atlas)"
else
  echo "• MongoDB:  Using MongoDB Atlas"
fi
echo "• Logs:     $LOG_DIR/"
echo ""
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Monitor processes and wait
RESTART_ATTEMPTS=0
MAX_RESTARTS=3

while true; do
  sleep 5
  
  # Check if backend is still running
  if ! kill -0 $BACK_PID 2>/dev/null; then
    echo ""
    log_error "Backend process (PID: $BACK_PID) died unexpectedly!"
    echo "Last 20 lines of backend.log:"
    tail -20 "$LOG_DIR/backend.log" 2>/dev/null || echo "Log file not found"
    
    if [ $RESTART_ATTEMPTS -lt $MAX_RESTARTS ]; then
      RESTART_ATTEMPTS=$((RESTART_ATTEMPTS + 1))
      log_warning "Attempting to restart backend (attempt $RESTART_ATTEMPTS/$MAX_RESTARTS)..."
      (cd "$BACKEND" && NODE_ENV=development npm run dev) >"$LOG_DIR/backend.log" 2>&1 &
      BACK_PID=$!
      sleep 3
      if kill -0 $BACK_PID 2>/dev/null; then
        log_success "Backend restarted (new PID: $BACK_PID)"
        continue
      fi
    fi
    
    log_error "Backend failed to recover after $MAX_RESTARTS attempts"
    cleanup
    exit 1
  fi
  
  # Check if frontend is still running
  if ! kill -0 $FRONT_PID 2>/dev/null; then
    echo ""
    log_error "Frontend process (PID: $FRONT_PID) died unexpectedly!"
    echo "Last 20 lines of frontend.log:"
    tail -20 "$LOG_DIR/frontend.log" 2>/dev/null || echo "Log file not found"
    
    if [ $RESTART_ATTEMPTS -lt $MAX_RESTARTS ]; then
      RESTART_ATTEMPTS=$((RESTART_ATTEMPTS + 1))
      log_warning "Attempting to restart frontend (attempt $RESTART_ATTEMPTS/$MAX_RESTARTS)..."
      fix_config_files
      (cd "$FRONTEND" && npm run dev -- --host) >"$LOG_DIR/frontend.log" 2>&1 &
      FRONT_PID=$!
      sleep 5
      if kill -0 $FRONT_PID 2>/dev/null; then
        log_success "Frontend restarted (new PID: $FRONT_PID)"
        continue
      fi
    fi
    
    log_error "Frontend failed to recover after $MAX_RESTARTS attempts"
    cleanup
    exit 1
  fi
done
