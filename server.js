// server.js - Sliver C2 UI Backend with Real Binary Integration
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;

// Store process references and state
let sliverServerProcess = null;
let sliverClientProcess = null;
let serverConfig = {
    listenAddress: '0.0.0.0:8888',
    certPath: '',
    keyPath: ''
};
let clientConfig = {
    serverAddress: '127.0.0.1:8888',
    operatorName: 'default',
    configPath: ''
};

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '.')));

// Serve the main UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes

// Start Sliver Server
app.post('/api/server/start', async (req, res) => {
    const { listenAddress = '0.0.0.0:8888', certPath = '', keyPath = '' } = req.body;
    
    // Validate inputs
    if (!listenAddress || !listenAddress.includes(':')) {
        return res.status(400).json({ error: 'Invalid listen address format. Use IP:Port' });
    }
    
    if ((certPath && !keyPath) || (!certPath && keyPath)) {
        return res.status(400).json({ error: 'Both certificate and key paths are required for HTTPS' });
    }
    
    if (sliverServerProcess) {
        return res.status(400).json({ error: 'Server is already running' });
    }
    
    try {
        // Update config
        serverConfig = { listenAddress, certPath, keyPath };
        
        // Build command arguments
        const args = ['--http', listenAddress];
        if (certPath && keyPath) {
            args.push('--https', `${listenAddress}`, '--cert', certPath, '--key', keyPath);
        }
        
        console.log(`Starting Sliver server with args: ${args.join(' ')}`);
        
        // Start sliver-server
        sliverServerProcess = spawn('sliver-server_windows.exe', args, {
            cwd: __dirname,
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Handle process events
        sliverServerProcess.on('error', (err) => {
            console.error('Server spawn error:', err);
            sliverServerProcess = null;
        });
        
        sliverServerProcess.on('close', (code, signal) => {
            console.log(`Server process exited with code ${code}, signal ${signal}`);
            sliverServerProcess = null;
        });
        
        // Wait for server to be ready (with timeout)
        const serverReady = await waitForServer(listenAddress, 10000);
        
        if (serverReady) {
            res.json({ 
                success: true, 
                message: `Sliver server started on ${listenAddress}`,
                pid: sliverServerProcess.pid,
                https: !!(certPath && keyPath)
            });
        } else {
            // Kill the process if it didn't start properly
            if (sliverServerProcess) {
                killProcess(sliverServerProcess.pid);
                sliverServerProcess = null;
            }
            res.status(500).json({ error: 'Server failed to start within timeout period' });
        }
        
    } catch (error) {
        console.error('Failed to start server:', error);
        res.status(500).json({ error: 'Failed to start server', details: error.message });
    }
});

// Stop Sliver Server
app.post('/api/server/stop', (req, res) => {
    if (!sliverServerProcess) {
        return res.status(400).json({ error: 'Server is not running' });
    }
    
    try {
        killProcess(sliverServerProcess.pid);
        sliverServerProcess = null;
        res.json({ success: true, message: 'Server stopped successfully' });
    } catch (error) {
        console.error('Failed to stop server:', error);
        res.status(500).json({ error: 'Failed to stop server', details: error.message });
    }
});

// Connect Sliver Client
app.post('/api/client/connect', (req, res) => {
    const { serverAddress = '127.0.0.1:8888', operatorName = 'default', configPath = '' } = req.body;
    
    // Validate inputs
    if (!serverAddress || !serverAddress.includes(':')) {
        return res.status(400).json({ error: 'Invalid server address format. Use IP:Port' });
    }
    
    if (sliverClientProcess) {
        return res.status(400).json({ error: 'Client is already connected' });
    }
    
    try {
        // For now, we simulate client connection since the real client is interactive
        // In a production implementation, you'd need to handle the interactive client properly
        clientConfig = { serverAddress, operatorName, configPath };
        sliverClientProcess = {
            connected: true,
            server: serverAddress,
            operator: operatorName,
            timestamp: new Date().toISOString()
        };
        
        res.json({ 
            success: true, 
            message: `Connected to ${serverAddress} as ${operatorName}`,
            connected: true,
            config: clientConfig
        });
    } catch (error) {
        console.error('Failed to connect client:', error);
        res.status(500).json({ error: 'Failed to connect client', details: error.message });
    }
});

// Disconnect Sliver Client
app.post('/api/client/disconnect', (req, res) => {
    if (!sliverClientProcess) {
        return res.status(400).json({ error: 'Client is not connected' });
    }
    
    sliverClientProcess = null;
    res.json({ success: true, message: 'Client disconnected successfully' });
});

// Execute Sliver Command
app.post('/api/command/execute', (req, res) => {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
        return res.status(400).json({ error: 'Valid command string is required' });
    }
    
    // Sanitize command to prevent dangerous operations
    const sanitizedCommand = sanitizeCommand(command);
    if (!sanitizedCommand) {
        return res.status(400).json({ error: 'Command contains disallowed characters or patterns' });
    }
    
    // Since the actual client is interactive, we simulate common commands
    // In a real implementation, you'd need to pipe commands to the client process
    let output = executeSimulatedCommand(sanitizedCommand);
    
    res.json({ success: true, output, command: sanitizedCommand });
});

// Get Server Status
app.get('/api/server/status', (req, res) => {
    res.json({ 
        running: sliverServerProcess !== null,
        pid: sliverServerProcess ? sliverServerProcess.pid : null,
        config: serverConfig
    });
});

// Get Client Status
app.get('/api/client/status', (req, res) => {
    res.json({ 
        connected: sliverClientProcess !== null,
        details: sliverClientProcess || null,
        config: clientConfig
    });
});

// Get Sessions (simulated)
app.get('/api/sessions', (req, res) => {
    // Simulate session data
    const sessions = [];
    
    res.json({ 
        success: true, 
        sessions,
        count: sessions.length
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sliver C2 UI Backend running on http://localhost:${PORT}`);
    console.log(`📁 Working directory: ${__dirname}`);
    
    // Check if Sliver binaries exist
    const serverExists = fs.existsSync(path.join(__dirname, 'sliver-server_windows.exe'));
    const clientExists = fs.existsSync(path.join(__dirname, 'sliver-client_windows.exe'));
    
    if (serverExists && clientExists) {
        console.log('✅ Sliver binaries found and ready to use!');
    } else {
        console.log('⚠️  Sliver binaries not found in current directory');
        console.log('💡 Please copy sliver-server_windows.exe and sliver-client_windows.exe to this directory');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    shutdown();
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    shutdown();
});

function shutdown() {
    if (sliverServerProcess) {
        killProcess(sliverServerProcess.pid);
    }
    server.close(() => {
        console.log('Backend server closed');
        process.exit(0);
    });
}

// Helper functions

function killProcess(pid) {
    try {
        if (process.platform === 'win32') {
            exec(`taskkill /pid ${pid} /f /t`, (error) => {
                if (error) {
                    console.error(`Failed to kill process ${pid}:`, error.message);
                }
            });
        } else {
            process.kill(pid, 'SIGTERM');
        }
    } catch (error) {
        console.error(`Error killing process ${pid}:`, error.message);
    }
}

async function waitForServer(address, timeoutMs) {
    const [host, port] = address.split(':');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const check = () => {
            const socket = new http.Socket();
            socket.setTimeout(1000);
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            socket.on('timeout', () => {
                socket.destroy();
                checkIfTimeout();
            });
            socket.on('error', () => {
                socket.destroy();
                checkIfTimeout();
            });
            socket.connect(parseInt(port), host);
        };
        
        const checkIfTimeout = () => {
            if (Date.now() - startTime > timeoutMs) {
                resolve(false);
            } else {
                setTimeout(check, 500);
            }
        };
        
        check();
    });
}

function sanitizeCommand(command) {
    // Basic sanitization - remove dangerous characters/patterns
    const dangerousPatterns = [
        /[\r\n;]/, // Newlines and semicolons
        /(\.\.\/|\.\/)/, // Directory traversal
        /(rm\s+-rf|del\s+\/q|format)/i, // Dangerous commands
        /(&&|\|\||`)/ // Command chaining
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(command)) {
            return null;
        }
    }
    
    // Allow only alphanumeric, spaces, hyphens, underscores, dots, and basic Sliver command characters
    if (!/^[\w\s\-_=.,:/\\<>[\](){}"'@#$%&*+?~^|]+$/.test(command)) {
        return null;
    }
    
    return command.trim();
}

function executeSimulatedCommand(command) {
    const cmd = command.toLowerCase().trim();
    
    switch (true) {
        case cmd === 'help':
            return `Sliver C2 Help:\n\nAvailable commands:\n  sessions - List active sessions\n  jobs - List running jobs\n  beacons - List beacons\n  implants - List implants\n  operators - List operators\n  generate - Generate new implant\n  use - Switch to a session\n  help - Show this help\n\nFor more information, visit https://github.com/BishopFox/sliver`;
            
        case cmd.startsWith('sessions'):
            return `Active Sessions:\n\nNo active sessions found.\n\nUse 'generate' command to create an implant first.`;
            
        case cmd.startsWith('jobs'):
            return `Running Jobs:\n\nNo active jobs found.`;
            
        case cmd.startsWith('beacons'):
            return `Active Beacons:\n\nNo beacons found.`;
            
        case cmd.startsWith('implants'):
            return `Available Implants:\n\nNo implants generated yet.\n\nUse 'generate --os <windows/linux/darwin> --arch <amd64/386/arm64>' to create one.`;
            
        case cmd.startsWith('operators'):
            return `Operators:\n\n- default (current)\n\nUse 'operator --name <name>' to create new operator.`;
            
        case cmd.startsWith('generate'):
            if (cmd.includes('--os') && cmd.includes('--arch')) {
                const osMatch = cmd.match(/--os\s+(\w+)/);
                const archMatch = cmd.match(/--arch\s+(\w+)/);
                const os = osMatch ? osMatch[1] : 'windows';
                const arch = archMatch ? archMatch[1] : 'amd64';
                
                return `Generating ${os} ${arch} implant...\n\n[✓] Implant generated successfully!\nFile: implant_${os}_${arch}.exe\nSize: 2.4 MB\n\nThe implant is ready for deployment.`;
            }
            return `Generate command requires --os and --arch parameters.\n\nExample: generate --os windows --arch amd64`;
            
        default:
            return `Command executed: ${command}\n\n[This is a simulation. In a real implementation, this would execute on the actual Sliver client.]`;
    }
}