# Network Access Guide

## Overview

The Modern Dashboard application is now configured to be accessible from any device on your network, not just localhost. This allows you to access the application from:
- Mobile devices (phones, tablets)
- Other computers on the same network
- Virtual machines
- Remote desktop sessions
- Development teams on the same network

## Configuration

### ✅ Already Configured

The application is pre-configured for network access:

**Frontend (Vite):**
- Listens on `0.0.0.0:3000` (all network interfaces)
- Accessible from any device on the network

**Backend (Express):**
- Listens on `0.0.0.0:4000` (all network interfaces)
- CORS configured to accept requests from any origin (development mode)
- Network URLs displayed on startup

## Quick Start

### 1. Start the Application

```bash
./start.sh
```

You'll see output like this:

```
========================================
  All Services Running Successfully!
========================================

Access the application:

Local Access:
  🌐 Dashboard:  http://localhost:3000
  🔌 API:        http://localhost:4000
  ❤️  Health:     http://localhost:4000/health

Network Access (from other devices):
  🌐 Dashboard:  http://192.168.1.100:3000
  🔌 API:        http://192.168.1.100:4000
```

### 2. Access from Other Devices

On any device on the same network:

1. Open a web browser
2. Navigate to: `http://<server-ip>:3000`
3. Login with: `demo` / `demo123`

**Example:**
- If server IP is `192.168.1.100`
- Access: `http://192.168.1.100:3000`

## Finding Your Server IP Address

### Linux/macOS
```bash
# Method 1: hostname command
hostname -I

# Method 2: ip command
ip addr show | grep "inet "

# Method 3: ifconfig
ifconfig | grep "inet "
```

### Windows
```cmd
# Command Prompt
ipconfig

# PowerShell
Get-NetIPAddress -AddressFamily IPv4
```

### From the Application
When you run `./start.sh`, it automatically detects and displays your network IPs.

## Firewall Configuration

To ensure external access, configure your firewall to allow ports **3000** and **4000**.

### Linux (UFW)
```bash
# Allow frontend port
sudo ufw allow 3000/tcp

# Allow backend port
sudo ufw allow 4000/tcp

# Check status
sudo ufw status
```

### Linux (firewalld)
```bash
# Allow frontend port
sudo firewall-cmd --add-port=3000/tcp --permanent

# Allow backend port
sudo firewall-cmd --add-port=4000/tcp --permanent

# Reload firewall
sudo firewall-cmd --reload

# Check
sudo firewall-cmd --list-ports
```

### Windows Firewall
```powershell
# Run as Administrator

# Allow frontend
New-NetFirewallRule -DisplayName "Dashboard Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Allow backend
New-NetFirewallRule -DisplayName "Dashboard Backend" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

### macOS
```bash
# macOS firewall is usually off by default
# If enabled, go to:
# System Preferences > Security & Privacy > Firewall > Firewall Options
# Allow incoming connections for Node
```

## Testing Network Access

### From the Server
```bash
# Check if ports are listening on all interfaces
sudo netstat -tlnp | grep -E ':(3000|4000)'

# Should show: 0.0.0.0:3000 and 0.0.0.0:4000
```

### From Another Device

**Test 1: Ping the server**
```bash
ping <server-ip>
```

**Test 2: Check port connectivity**
```bash
# Linux/macOS
nc -zv <server-ip> 3000
nc -zv <server-ip> 4000

# Windows
Test-NetConnection -ComputerName <server-ip> -Port 3000
Test-NetConnection -ComputerName <server-ip> -Port 4000
```

**Test 3: Access the application**
```bash
# Test backend health
curl http://<server-ip>:4000/health

# Test frontend
curl http://<server-ip>:3000
```

**Test 4: Browser access**
- Open: `http://<server-ip>:3000`
- Should see the dashboard

## Common Network Scenarios

### 1. Access from Phone/Tablet

**Ensure:**
- Phone/tablet is on the same WiFi network
- Server is running: `./status.sh`
- Firewall allows ports 3000 and 4000

**Access:**
1. Open browser on mobile device
2. Navigate to: `http://<server-ip>:3000`
3. Bookmark for easy access

### 2. Access from Another Computer

**Same as mobile:**
```
http://<server-ip>:3000
```

### 3. Access from Virtual Machine

**If VM is on bridged network:**
- VM has its own IP
- Access server IP from VM

**If VM is on NAT/Host-only:**
- May need port forwarding
- Or access via host IP from VM

### 4. Team Development

**Each developer can access:**
```
http://<server-ip>:3000
```

**Shared development server:**
- One person runs the server
- Team accesses via network IP
- Changes reflected for everyone

## CORS Configuration

### Development Mode (Default)

**Current setting:**
```bash
CORS_ORIGIN=*
```

- Accepts requests from any origin
- Suitable for development
- Allows easy testing from any device

### Production Mode

**For production, restrict origins:**

Edit `backend/.env`:
```bash
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

**Multiple origins (comma-separated):**
```bash
CORS_ORIGIN=https://app1.com,https://app2.com,https://app3.com
```

**How it works:**
- Development: accepts all origins (`*`)
- Production: only accepts origins in CORS_ORIGIN
- Requests from other origins are blocked

## Security Considerations

### Development Environment

✅ **Safe for:**
- Local network development
- Team development on trusted network
- Testing on personal devices
- Private home/office networks

⚠️ **Not recommended for:**
- Public WiFi networks
- Untrusted networks
- Internet-facing servers (without additional security)

### Production Environment

**Additional security measures needed:**

1. **HTTPS/SSL:**
   ```bash
   # Use reverse proxy (nginx/Apache)
   # Or configure SSL in Express
   ```

2. **Restricted CORS:**
   ```bash
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Authentication:**
   - Already implemented (JWT)
   - Consider adding rate limiting
   - Consider adding brute force protection

4. **Firewall:**
   - Only allow specific IPs
   - Use VPN for remote access

5. **Environment Variables:**
   - Use strong JWT_SECRET
   - Don't expose .env file

## Troubleshooting

### Can't Access from Network

**1. Check if service is running**
```bash
./status.sh
```

**2. Verify listening on 0.0.0.0**
```bash
netstat -tlnp | grep -E ':(3000|4000)'
# Should show 0.0.0.0:3000 and 0.0.0.0:4000
```

**3. Check firewall**
```bash
# Linux
sudo ufw status
sudo firewall-cmd --list-ports

# Try temporarily disabling (CAUTION)
sudo ufw disable  # Re-enable after testing!
```

**4. Verify network connectivity**
```bash
# From another device, ping server
ping <server-ip>
```

**5. Check server IP**
```bash
hostname -I
# Make sure you're using the correct IP
```

### CORS Errors

**Error in browser console:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**

1. Check `backend/.env`:
   ```bash
   CORS_ORIGIN=*
   ```

2. Restart backend:
   ```bash
   ./restart.sh
   ```

3. Clear browser cache

### Slow Performance

**If network access is slow:**

1. **Check network quality:**
   ```bash
   ping <server-ip>
   # Should be < 10ms on local network
   ```

2. **Check server resources:**
   ```bash
   ./status.sh
   # Look at CPU and memory usage
   ```

3. **Check for WiFi interference:**
   - Move closer to router
   - Use 5GHz WiFi if available
   - Consider wired connection

### Connection Refused

**Error: Connection refused**

**Causes:**
1. Service not running → `./start.sh`
2. Wrong IP address → Check with `hostname -I`
3. Wrong port → Use 3000 for frontend, 4000 for backend
4. Firewall blocking → Configure firewall (see above)

## Advanced Configuration

### Custom Network Interface

**Bind to specific interface:**

Edit `backend/.env`:
```bash
# Instead of 0.0.0.0, use specific IP
HOST=192.168.1.100
```

Edit `frontend/vite.config.ts`:
```typescript
server: {
  host: '192.168.1.100',
  port: 3000,
}
```

### Reverse Proxy Setup

**Using nginx:**

```nginx
server {
    listen 80;
    server_name dashboard.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Benefits:**
- Single port (80 or 443)
- SSL termination
- Load balancing
- Better security

### Docker Network Access

**When using Docker:**

Edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "0.0.0.0:3000:3000"  # Explicit network binding
  
  backend:
    ports:
      - "0.0.0.0:4000:4000"
    environment:
      - HOST=0.0.0.0
      - CORS_ORIGIN=*
```

## Mobile Development

### Accessing from Mobile Device

**QR Code (optional):**
```bash
# Generate QR code for easy mobile access
npm install -g qrcode-terminal
qrcode-terminal "http://$(hostname -I | awk '{print $1}'):3000"
```

**Or simply:**
1. Note the server IP from `./start.sh` output
2. Type URL in mobile browser
3. Bookmark for future access

### Mobile Testing

**Chrome DevTools:**
- Use Chrome on desktop
- Enable USB debugging on phone
- Use remote debugging to test

**Responsive Design:**
- Dashboard is already responsive
- Works on phones (320px+)
- Works on tablets
- Works on desktop (up to 4K)

## Performance Tips

1. **Use wired connection for server** (not WiFi)
2. **Use 5GHz WiFi** for client devices
3. **Keep server and clients on same subnet** (faster routing)
4. **Monitor resource usage:** `./status.sh`
5. **Close unused applications** on server

## Environment Variables Reference

```bash
# Backend (.env)
PORT=4000                    # Backend port
HOST=0.0.0.0                # Listen on all interfaces
NODE_ENV=development        # Environment mode
CORS_ORIGIN=*               # Allowed origins (* = all)
JWT_SECRET=your-secret      # JWT signing key
JWT_EXPIRY=7d               # Token expiration

# Frontend (vite.config.ts)
# Already configured for network access
# No additional env vars needed
```

## Quick Reference

### Enable Network Access
```bash
# Already enabled by default!
./start.sh
```

### Find Server IP
```bash
hostname -I | awk '{print $1}'
```

### Access URLs
```
Local:    http://localhost:3000
Network:  http://<your-ip>:3000
```

### Allow Firewall
```bash
# Linux (UFW)
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp

# Linux (firewalld)
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=4000/tcp --permanent
sudo firewall-cmd --reload
```

### Test Connectivity
```bash
# From another device
curl http://<server-ip>:4000/health
```

## Support

For issues:
1. Check `./status.sh` - Verify services are running
2. Check firewall - Allow ports 3000 and 4000
3. Check network - Ensure same network/subnet
4. Check logs - `tail -f .logs/*.log`
5. Check CORS - Verify `CORS_ORIGIN=*` in `.env`

## See Also

- `GETTING_STARTED.md` - General setup
- `SCRIPTS_GUIDE.md` - Management scripts
- `README.md` - Full documentation
- `QUICK_REFERENCE.md` - Quick commands

---

**Network access is enabled by default!**  
Just run `./start.sh` and access from any device on your network.
