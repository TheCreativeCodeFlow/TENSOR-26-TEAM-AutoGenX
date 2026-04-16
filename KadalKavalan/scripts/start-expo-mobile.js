const os = require('os');
const net = require('net');
const { spawn, execSync } = require('child_process');

function parseWindowsIpconfigIPv4() {
  try {
    const output = execSync('ipconfig', { encoding: 'utf8' });
    const blocks = output.split(/\r?\n\r?\n+/g);
    const candidates = [];

    for (const block of blocks) {
      const ipv4Match = block.match(/IPv4 Address[^:]*:\s*(\d+\.\d+\.\d+\.\d+)/i);
      if (!ipv4Match) {
        continue;
      }

      const gatewayMatch = block.match(/Default Gateway[^:]*:\s*([^\r\n]+)/i);
      const gateway = (gatewayMatch?.[1] || '').trim();
      const hasGateway = gateway && gateway !== '0.0.0.0';
      if (!hasGateway) {
        continue;
      }

      const header = block.split(/\r?\n/)[0] || '';
      const lowered = header.toLowerCase();
      let score = 0;

      if (lowered.includes('wi-fi') || lowered.includes('wireless')) {
        score += 4;
      }
      if (lowered.includes('ethernet')) {
        score += 3;
      }
      if (lowered.includes('vpn') || lowered.includes('virtual') || lowered.includes('vmware')) {
        score -= 5;
      }

      candidates.push({ ip: ipv4Match[1], score });
    }

    if (!candidates.length) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].ip;
  } catch {
    return null;
  }
}

function getPreferredIPv4() {
  const overrideIp = process.env.MOBILE_LAN_IP?.trim();
  if (overrideIp) {
    return overrideIp;
  }

  if (process.platform === 'win32') {
    const parsed = parseWindowsIpconfigIPv4();
    if (parsed) {
      return parsed;
    }
  }

  const interfaces = os.networkInterfaces();

  for (const [name, entries] of Object.entries(interfaces)) {
    if (!entries) continue;

    for (const entry of entries) {
      if (entry.family !== 'IPv4' || entry.internal) continue;

      const lowered = name.toLowerCase();
      const isVirtual =
        lowered.includes('virtual') ||
        lowered.includes('vmware') ||
        lowered.includes('vbox') ||
        lowered.includes('hyper-v') ||
        lowered.includes('loopback');

      if (!isVirtual) {
        return entry.address;
      }
    }
  }

  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;

    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

const ip = getPreferredIPv4();

if (!ip) {
  console.warn('[start:mobile] Could not detect LAN IPv4 address.');
  console.warn('[start:mobile] Starting Expo without pinned host.');
}

const env = {
  ...process.env,
  ...(ip ? { REACT_NATIVE_PACKAGER_HOSTNAME: ip } : {}),
};

if (ip) {
  console.log(`[start:mobile] Using LAN IP: ${ip}`);
}

function canUsePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen({ port, host: '0.0.0.0', exclusive: true });
  });
}

function isPortTakenOnWindows(port) {
  if (process.platform !== 'win32') {
    return false;
  }

  try {
    const output = execSync(`netstat -ano -p tcp | findstr /R /C:":${port} .*LISTENING"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return Boolean(output && output.trim());
  } catch {
    return false;
  }
}

async function getOpenPort(start = 8082, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const port = start + i;
    // eslint-disable-next-line no-await-in-loop
    const available = await canUsePort(port);
    if (available && !isPortTakenOnWindows(port)) {
      return port;
    }
  }

  return start;
}

async function startExpo() {
  const port = await getOpenPort(8082, 20);
  console.log(`[start:mobile] Using port: ${port}`);

  const launchEnv = {
    ...env,
    ...(ip
      ? {
          REACT_NATIVE_PACKAGER_HOSTNAME: ip,
          EXPO_PACKAGER_PROXY_URL: `http://${ip}:${port}`,
        }
      : {}),
  };

  if (ip) {
    console.log(`[start:mobile] Proxy URL: http://${ip}:${port}`);
  }

  const child =
    process.platform === 'win32'
      ? spawn('cmd.exe', ['/d', '/s', '/c', `npx expo start --host lan --port ${port} --clear`], {
          stdio: 'inherit',
          env: launchEnv,
          shell: false,
        })
      : spawn('npx', ['expo', 'start', '--host', 'lan', '--port', String(port), '--clear'], {
          stdio: 'inherit',
          env: launchEnv,
          shell: false,
        });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('[start:mobile] Failed to start Expo:', error.message);
    process.exit(1);
  });
}

startExpo().catch((error) => {
  console.error('[start:mobile] Unexpected startup error:', error.message);
  process.exit(1);
});
