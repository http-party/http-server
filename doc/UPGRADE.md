# Upgrade Guide: http-server v14.1.1 → v15.0.0

> **WARNING: Major release with breaking changes after 3 years**
>
> **Test thoroughly before production deployment**

## Critical Breaking Changes

### 1. Node.js Version Requirement
- **Minimum**: Node.js 16.20.2
- **Impact**: Server will not start on older versions
- **Action**: Upgrade Node.js before upgrading http-server

The specific patch version (16.20.2) is unusual. Verify this requirement hasn't changed.

### 2. IPv6 Default Binding - SECURITY CRITICAL

**This is the most dangerous change in this release.**

- **Old**: Default host `0.0.0.0` (IPv4 only)
- **New**: Default host `::` (dual-stack IPv4+IPv6)

**DANGER**: Many firewalls are configured for IPv4 only. Enabling IPv6 by default means your server may be exposed to the internet BYPASSING YOUR FIREWALL.

**Before upgrading**:
1. Check if IPv6 is enabled: `ip -6 addr show` (Linux) or `ifconfig` (macOS)
2. Verify your firewall covers IPv6: `ip6tables -L -n` (Linux)
3. Understand that internal/dev servers may suddenly be internet-accessible
4. Test from an external IPv6 network if possible

**To maintain IPv4-only behavior**:
```bash
http-server -a 0.0.0.0
```

Update all deployment scripts, systemd services, and Docker configs to include this flag if you're not ready for dual-stack.

### 3. Development Dependencies (Contributors Only)
- **Old**: TAP v14
- **New**: TAP v21
- **Impact**: Test framework completely changed

## Security Warnings

### Header Injection Vulnerability (New -H Flag)

**SEVERITY: CRITICAL**

The new `-H/--header` option has NO CRLF validation. This allows HTTP response splitting attacks if you pass untrusted input.

**NEVER do this**:
```bash
http-server -H "$USER_INPUT"
```

**Safe usage**:
```bash
# Only use with hardcoded values
http-server -H "X-Custom: MyValue" -H "Cache-Control: max-age=3600"
```

If you need dynamic headers, validate rigorously:
- No `\r` or `\n` characters (including URL-encoded %0D, %0A)
- No control characters
- Better: use a reverse proxy to set headers instead

**This should be fixed in http-server itself.** Users shouldn't be responsible for security validation.

### WebSocket Proxy - Don't Use in Production

The new WebSocket support in proxy mode (`-P` flag) introduces attack vectors:
- No rate limiting for WebSocket connections
- Long-lived connections can exhaust resources
- Authentication bypass risks

**Recommendation**: Don't use http-server for production WebSocket workloads. Use nginx, HAProxy, or a dedicated WebSocket proxy. http-server is a simple file server, not a production WebSocket handler.

### CORS Wildcard Warning

`--cors` sets `Access-Control-Allow-Origin: *`, allowing ANY website to make JavaScript requests to your server and read responses.

**DANGER**:
- Any malicious website can access your API
- Credentials in cookies will be sent
- Private data becomes accessible to any origin
- No CSRF protection

**Only use --cors for**:
- Public CDN resources (fonts, images, libraries)
- Open APIs with no authentication
- Development/testing (never production)

**Never use --cors with**:
- APIs with authentication
- Any endpoint serving user-specific data
- Internal resources

## Quick Comparison

| Feature | v14.1.1 | v15.0.0 | Impact |
|---------|---------|---------|--------|
| Node.js | >=12 | >=16.20.2 | BREAKING |
| Default Host | 0.0.0.0 (IPv4) | :: (IPv4+IPv6) | BREAKING - Security Risk |
| --base-dir | Not available | Available | NEW - Changes URLs |
| -H/--header | Not available | Available | NEW - Security Risk |
| WebSocket Proxy | Not supported | Supported | NEW - Limited Use |
| TAP Version | v14 | v21 | Dev Only |

## New Features Reference

### --base-dir
Serve files from a subdirectory:
```bash
http-server --base-dir api/v1
# Files now served from /api/v1/* instead of /*
```
**Warning**: This changes all URLs. Update clients accordingly.

### -H / --header
Add custom response headers (see Security Warnings above).

### WebSocket Proxy Support
When using `-P/--proxy`, WebSocket connections are proxied. Not recommended for production (see Security Warnings).

## Pre-Upgrade Checklist

- [ ] Test Node.js version: `node --version` (must be >=16.20.2)
- [ ] Document current configuration (all flags, systemd service files)
- [ ] Review firewall rules for IPv6 exposure
- [ ] Identify all services connecting to http-server
- [ ] Prepare rollback plan (keep v14.1.1 installation available)
- [ ] Test in development/staging first

## Step-by-Step Migration

### Step 1: Test Environment Setup

```bash
# Create test directory
mkdir /tmp/http-server-upgrade-test
cd /tmp/http-server-upgrade-test

# Install new version locally (doesn't affect global)
npm install http-server@15.0.0

# Test with your configuration
npx http-server [your-flags-here]

# Cleanup when done
cd ~ && rm -rf /tmp/http-server-upgrade-test
```

### Step 2: Test Connectivity

```bash
# Test IPv4
curl -4 http://localhost:8080

# Test IPv6 (if enabled)
curl -6 http://[::1]:8080

# If IPv6 fails or unwanted, use IPv4-only:
npx http-server -a 0.0.0.0
```

### Step 3: Update Deployment Configuration

```bash
# If maintaining IPv4-only compatibility
http-server /path/to/files -a 0.0.0.0 [other-options]

# Or embrace dual-stack (ensure firewall is ready)
http-server /path/to/files [other-options]
```

Update systemd services, Docker configs, and start scripts to include appropriate flags.

### Step 4: Reverse Proxy Configuration

If using nginx or Apache, update upstream configuration:

**nginx (recommended)**:
```nginx
# Use IPv6 dual-stack (handles both IPv4 and IPv6)
upstream http_server {
    server [::1]:8080;
}

# OR use IPv4 explicitly
upstream http_server {
    server 127.0.0.1:8080;
}
```

Don't configure both IPv4 and IPv6 as separate upstream servers unless you specifically want round-robin load balancing.

### Step 5: Production Deployment

**Install without sudo** (recommended):
```bash
# Using nvm (best practice)
nvm use 16.20.2  # or later
npm install -g http-server@15.0.0

# OR configure npm global directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g http-server@15.0.0
```

**With sudo** (not recommended but if required):
```bash
sudo npm install -g http-server@15.0.0 --unsafe-perm
```

**Verify installation**:
```bash
http-server --version  # Should show 15.0.0

# Start and test
http-server /tmp/test-dir &
curl http://localhost:8080/
pkill -f http-server
```

## Platform-Specific Notes

### Linux (systemd)
Update service files to include IPv4-only flag if needed:
```ini
[Service]
ExecStart=/usr/bin/http-server -a 0.0.0.0 [other-options]
# Remove IPv4-only address family restrictions:
# RestrictAddressFamilies=AF_INET  # <-- Remove this line if present
```

Reload: `sudo systemctl daemon-reload && sudo systemctl restart http-server`

### macOS
- IPv6 localhost might show as `::1` or `fe80::1%lo0`
- Firewall may prompt for IPv6 binding permission

### Windows
- Windows Firewall requires separate IPv6 rules
- WSL2 has IPv6 networking quirks - test thoroughly

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /srv/http-server
COPY . .
RUN npm install --production
EXPOSE 8080
CMD ["node", "./bin/http-server", "-a", "0.0.0.0"]
```

Note: Add `-a 0.0.0.0` if you want IPv4-only binding.

## Troubleshooting

### Server won't start
```bash
# Error: bind EADDRNOTAVAIL ::
# Fix: Use IPv4-only mode
http-server -a 0.0.0.0

# Check if IPv6 is disabled on your system
sysctl net.ipv6.conf.all.disable_ipv6  # Linux
```

### Can't connect on IPv6
```bash
# Test IPv6 connectivity
ping6 ::1

# Check listening ports
netstat -an | grep 8080
# Should show: tcp6  0  0  :::8080  :::*  LISTEN
```

### Firewall blocking IPv6
```bash
# Linux: Check ip6tables rules
sudo ip6tables -L -n

# AWS: Add IPv6 security group rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 8080 \
  --ipv6-cidr ::/0
```

## Rollback Plan

### When to rollback
- Server fails to start
- IPv6 exposure causing security issues
- Critical functionality broken
- Performance degradation >30%

### Rollback procedure

```bash
# 1. Stop the service
sudo systemctl stop http-server
# OR: pm2 stop http-server
# OR: pkill -f http-server

# 2. Verify stopped
ps aux | grep http-server

# 3. Downgrade package
npm install -g http-server@14.1.1

# 4. Verify version
http-server --version  # Should show 14.1.1

# 5. Restore configuration (if changed)
sudo cp /path/to/backup/http-server.service /etc/systemd/system/
sudo systemctl daemon-reload

# 6. Restart service
sudo systemctl start http-server
# Verify: curl http://localhost:8080/

# 7. Preserve error logs for debugging
journalctl -u http-server -n 100 > rollback-incident.log
```

### If rollback fails
```bash
# Use npx to run specific version
npx http-server@14.1.1 /path/to/files

# OR pull specific Docker image
docker pull ghcr.io/http-party/http-server:14.1.1
```

## Performance Considerations

Expected performance characteristics:

- **IPv6 dual-stack binding**: Minimal overhead, no significant performance impact
- **Memory usage**: No substantial changes expected
- **Throughput**: Should be comparable to v14.1.1
- **Dependency updates**: TAP v21 is dev-only, shouldn't affect runtime performance

If you observe significant performance degradation (>10% throughput reduction), report it as a bug.

Benchmark before and after with realistic workloads:
```bash
# Install load testing tool
npm install -g autocannon

# Benchmark
autocannon -c 100 -d 30 http://localhost:8080/typical-file.html
```

## Testing Checklist

- [ ] **Connectivity**: IPv4 works, IPv6 works (if enabled)
- [ ] **Security**: Firewall rules effective for both IPv4 and IPv6
- [ ] **Performance**: Response times within 10% of v14.1.1
- [ ] **Integration**: Reverse proxy, monitoring, health checks work
- [ ] **Regression**: All existing URLs work, MIME types unchanged

## Programmatic API Users

If you use http-server as a Node.js module (`require('http-server')`):

Check the CHANGELOG and release notes for API breaking changes. The programmatic API is not covered in this guide. Test your code thoroughly with v15.0.0 before deploying.

## Known Issues

1. **IPv6 on systems with IPv6 disabled**: Server fails to start
   - Workaround: Use `-a 0.0.0.0`

2. **Header injection risk**: No CRLF validation in `-H` option
   - Mitigation: Never pass untrusted input to -H flag

3. **Specific Node.js patch requirement**: 16.20.2 is unusually specific
   - Verify this is still accurate before upgrading

## Resources

- **Repository**: https://github.com/http-party/http-server
- **Issue Tracker**: https://github.com/http-party/http-server/issues
- **Security Reports**: GitHub Security Advisories (preferred)
- **npm Package**: https://www.npmjs.com/package/http-server

## Should You Use http-server in Production?

Be realistic about http-server's purpose: it's a simple file server for development and serving static assets.

If you need:
- Advanced security features
- Rate limiting
- Complex routing
- WebSocket support
- Load balancing

Use nginx, Caddy, or a proper application server instead. Don't try to make http-server into something it's not.

## FAQ

**Q: Is this a security update?**
A: Partially. It includes improvements but also introduces new attack surfaces (IPv6 exposure, header injection risk).

**Q: Can I stay on v14.1.1?**
A: Yes, but plan to upgrade within 6-12 months as v14.1.1 is unlikely to receive updates.

**Q: Why such a specific Node.js version (16.20.2)?**
A: Unclear. This specificity is unusual. Verify the actual requirement before upgrading.

**Q: Will this break my CI/CD pipeline?**
A: Possibly, if it assumes IPv4-only or uses Node.js <16.20.2. Test thoroughly.

**Q: How do I report issues?**
A: GitHub Issues with: http-server version, Node.js version, OS, full command, error messages.

---

**Document Version**: 1.0.0 (Matteo Collina synthesis)
**Applies to**: http-server v15.0.0
**Last Updated**: 2025-10-10
**Philosophy**: Security first, pragmatic guidance, concise documentation that developers actually read.
