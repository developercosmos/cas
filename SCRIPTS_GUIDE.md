# Management Scripts Guide

## Overview

These scripts provide easy management of the Modern Dashboard application with guaranteed static ports:
- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000

## Available Scripts

### 🚀 start.sh
Starts both frontend and backend services.

```bash
./start.sh
```

**Features:**
- ✅ Checks if services are already running
- ✅ Verifies ports are available
- ✅ Creates .env if missing
- ✅ Starts services in background
- ✅ Waits for services to be ready
- ✅ Shows URLs and credentials
- ✅ Saves PIDs for later management
- ✅ Logs output to `.logs/` directory

**What it does:**
1. Creates `.pids/` and `.logs/` directories
2. Checks if backend (port 4000) is available
3. Starts backend with `npm run dev`
4. Waits for backend to respond
5. Checks if frontend (port 3000) is available
6. Starts frontend with `npm run dev`
7. Waits for frontend to respond
8. Displays status and access information

### 🛑 stop.sh
Stops both frontend and backend services gracefully.

```bash
./stop.sh
```

**Features:**
- ✅ Graceful shutdown (SIGTERM first)
- ✅ Force kill if needed (SIGKILL after 10s)
- ✅ Cleans up PID files
- ✅ Shows status for each service
- ✅ Safe to run multiple times

**What it does:**
1. Reads PIDs from `.pids/` directory
2. Sends SIGTERM to processes
3. Waits up to 10 seconds for graceful shutdown
4. Force kills if still running
5. Removes PID files
6. Confirms shutdown

### 📊 status.sh
Shows detailed status of all services.

```bash
./status.sh
```

**Features:**
- ✅ Process status (running/stopped)
- ✅ Port usage information
- ✅ CPU and memory usage
- ✅ Service uptime
- ✅ Health check (backend)
- ✅ Overall system status

**Output includes:**
- PID file status
- Process running status
- CPU usage percentage
- Memory usage percentage
- Service uptime
- Port availability
- HTTP health check
- Quick access URLs

### 🔄 restart.sh
Restarts both services (stop + start).

```bash
./restart.sh
```

**Features:**
- ✅ Stops all services
- ✅ Waits 2 seconds
- ✅ Starts all services
- ✅ Full status output

## Usage Examples

### Starting the Application

```bash
# Start both services
./start.sh

# Output shows:
# - Service status
# - Access URLs
# - Default credentials
# - Log file locations
```

### Checking Status

```bash
# Check if services are running
./status.sh

# Shows detailed information:
# - Process status
# - Resource usage
# - Port availability
# - Health status
```

### Stopping the Application

```bash
# Stop both services
./stop.sh

# Services shut down gracefully
```

### Restarting the Application

```bash
# Restart after making changes
./restart.sh

# Equivalent to:
# ./stop.sh && sleep 2 && ./start.sh
```

## Directory Structure

```
/var/www/cas/
├── start.sh          # Start script
├── stop.sh           # Stop script
├── status.sh         # Status script
├── restart.sh        # Restart script
├── .pids/           # Process ID files (auto-created)
│   ├── backend.pid
│   └── frontend.pid
└── .logs/           # Service logs (auto-created)
    ├── backend.log
    └── frontend.log
```

## Port Configuration

The scripts enforce static ports:

| Service  | Port | URL                          |
|----------|------|------------------------------|
| Frontend | 3000 | http://localhost:3000        |
| Backend  | 4000 | http://localhost:4000        |
| Health   | 4000 | http://localhost:4000/health |

**Port Conflict Handling:**
- Scripts check if ports are available before starting
- If port is in use, script exits with error
- Shows command to identify what's using the port

## Log Files

Logs are stored in `.logs/` directory:

**View live logs:**
```bash
# Frontend logs
tail -f .logs/frontend.log

# Backend logs
tail -f .logs/backend.log

# Both logs simultaneously
tail -f .logs/*.log
```

**Clear logs:**
```bash
# Clear all logs
rm .logs/*.log

# Or truncate without deleting
truncate -s 0 .logs/*.log
```

## Process Management

**PID Files:**
- Stored in `.pids/` directory
- One file per service
- Contains process ID
- Automatically cleaned up on stop

**Manual Process Management:**
```bash
# Get backend PID
cat .pids/backend.pid

# Get frontend PID
cat .pids/frontend.pid

# Kill specific service manually
kill $(cat .pids/backend.pid)

# Check process details
ps -p $(cat .pids/backend.pid)
```

## Troubleshooting

### Port Already in Use

**Error:**
```
✗ Port 3000 is already in use by another process
Run: lsof -i :3000 to see what's using it
```

**Solution:**
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or try starting again
./start.sh
```

### Service Failed to Start

**Error:**
```
✗ Backend failed to start. Check logs: .logs/backend.log
```

**Solution:**
```bash
# Check the logs
cat .logs/backend.log

# Common issues:
# - Missing dependencies: cd backend && npm install
# - Missing .env: cp backend/.env.example backend/.env
# - Port in use: see above
```

### Stale PID Files

**Issue:** PID file exists but process isn't running

**Solution:**
```bash
# Remove stale PID files
rm -f .pids/*.pid

# Start fresh
./start.sh
```

### Services Won't Stop

**Issue:** `./stop.sh` doesn't stop services

**Solution:**
```bash
# Force kill all node processes (careful!)
pkill -9 node

# Or manually:
kill -9 $(cat .pids/backend.pid)
kill -9 $(cat .pids/frontend.pid)

# Clean up
rm -f .pids/*.pid
```

## Advanced Usage

### Custom Port Checking

```bash
# Check if port is in use
lsof -i :3000
lsof -i :4000

# Check what's listening
netstat -tlnp | grep 3000
netstat -tlnp | grep 4000
```

### Running in Background

Scripts already run services in background, but to detach completely:

```bash
# Start and detach from terminal
nohup ./start.sh > /dev/null 2>&1 &

# Services will continue after terminal closes
```

### Auto-start on Boot

**Using cron:**
```bash
# Edit crontab
crontab -e

# Add this line:
@reboot cd /var/www/cas && ./start.sh
```

**Using systemd:** (see SYSTEMD_GUIDE.md for details)

### Resource Monitoring

```bash
# Watch status continuously
watch -n 2 ./status.sh

# Monitor CPU/Memory
top -p $(cat .pids/backend.pid),$(cat .pids/frontend.pid)

# Monitor ports
watch -n 1 'lsof -i :3000,4000'
```

## Environment Variables

Scripts respect these environment variables:

```bash
# Backend port (default: 4000)
export PORT=4000

# Frontend port (default: 3000)
export VITE_PORT=3000

# Node environment
export NODE_ENV=development
```

## Script Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (port in use, service failed, etc.) |

**Using in other scripts:**
```bash
if ./start.sh; then
    echo "Services started"
else
    echo "Failed to start services"
    exit 1
fi
```

## Integration with Other Tools

### With Docker

```bash
# Use scripts instead of docker-compose
./start.sh

# Or use docker-compose
docker-compose up -d
```

### With PM2

```bash
# Use scripts (simpler)
./start.sh

# Or use PM2 (more features)
pm2 start ecosystem.config.js
```

### With CI/CD

```yaml
# Example GitHub Actions
- name: Start application
  run: ./start.sh

- name: Run tests
  run: npm test

- name: Stop application
  run: ./stop.sh
```

## Security Notes

- Scripts use PID files for process management
- Logs may contain sensitive information
- PID files are in `.pids/` (gitignored)
- Logs are in `.logs/` (gitignored)
- Never commit PID or log files to git

## Performance Tips

1. **Check logs regularly**: `tail -f .logs/*.log`
2. **Monitor resources**: `./status.sh`
3. **Restart if issues**: `./restart.sh`
4. **Clean old logs**: `rm .logs/*.log` (before they get too large)

## Quick Reference

```bash
# Start everything
./start.sh

# Check status
./status.sh

# View logs
tail -f .logs/frontend.log
tail -f .logs/backend.log

# Restart
./restart.sh

# Stop everything
./stop.sh
```

## Default Credentials

When accessing the application:
- **Username**: `demo`
- **Password**: `demo123`

## Support

For issues with:
- **Scripts**: Check logs in `.logs/`
- **Application**: See `GETTING_STARTED.md`
- **Development**: See `README.md`

## See Also

- `GETTING_STARTED.md` - Application setup guide
- `README.md` - Full documentation
- `QUICK_REFERENCE.md` - Command reference
- Backend `.env` - Environment configuration
