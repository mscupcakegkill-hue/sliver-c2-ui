// script.js - Sliver C2 UI Frontend with Real Backend Integration
const API_BASE = 'http://localhost:3001/api';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load saved settings
    loadSettings();
    
    // Check backend status
    checkBackendStatus();
    
    // Start auto-refresh if enabled
    startAutoRefresh();
});

function initializeApp() {
    console.log('Sliver C2 UI initialized');
}

function setupEventListeners() {
    // Tab navigation
    const tabs = document.querySelectorAll('.sidebar nav ul li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
            
            // Load data for the selected tab
            if (tabId === 'sessions-tab') {
                loadSessions();
            }
        });
    });
    
    // Server management
    const startServerBtn = document.getElementById('start-server');
    const stopServerBtn = document.getElementById('stop-server');
    
    startServerBtn.addEventListener('click', startServer);
    stopServerBtn.addEventListener('click', stopServer);
    
    // Client connection
    const connectClientBtn = document.getElementById('connect-client');
    const disconnectClientBtn = document.getElementById('disconnect-client');
    
    connectClientBtn.addEventListener('click', connectClient);
    disconnectClientBtn.addEventListener('click', disconnectClient);
    
    // Command execution
    const commandInput = document.getElementById('command-input');
    const executeCommandBtn = document.getElementById('execute-command');
    const quickCmdButtons = document.querySelectorAll('.quick-cmd');
    
    executeCommandBtn.addEventListener('click', executeCommand);
    commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeCommand();
        }
    });
    
    quickCmdButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cmd = btn.getAttribute('data-cmd');
            document.getElementById('command-input').value = cmd;
            executeCommand();
        });
    });
    
    // Form submissions
    const serverConfigForm = document.getElementById('server-config');
    const clientConfigForm = document.getElementById('client-config');
    const saveSettingsBtn = document.getElementById('save-settings');
    
    serverConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Server configuration saved. Will be applied when starting server.', 'info');
    });
    
    clientConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Client connection details saved.', 'info');
    });
    
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Initial status updates
    updateServerStatus();
    updateClientStatus();
}

async function startServer() {
    const listenAddress = document.getElementById('listen-address').value || '0.0.0.0:8888';
    const certPath = document.getElementById('cert-path').value || '';
    const keyPath = document.getElementById('key-path').value || '';
    
    const serverStatus = document.querySelector('#server-tab .status');
    const startServerBtn = document.getElementById('start-server');
    const stopServerBtn = document.getElementById('stop-server');
    
    serverStatus.textContent = 'Starting...';
    serverStatus.className = 'status pulse';
    startServerBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/server/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listenAddress, certPath, keyPath })
        });
        
        const data = await response.json();
        if (data.success) {
            serverStatus.textContent = data.https ? 'Online (HTTPS)' : 'Online';
            serverStatus.className = 'status online';
            stopServerBtn.disabled = false;
            showToast('Server started successfully!', 'success');
        } else {
            serverStatus.textContent = 'Error';
            serverStatus.className = 'status offline';
            startServerBtn.disabled = false;
            showToast(data.error || 'Failed to start server', 'error');
        }
    } catch (error) {
        serverStatus.textContent = 'Error';
        serverStatus.className = 'status offline';
        startServerBtn.disabled = false;
        showToast('Failed to connect to backend: ' + error.message, 'error');
        console.error('Server start error:', error);
    }
}

async function stopServer() {
    const serverStatus = document.querySelector('#server-tab .status');
    const startServerBtn = document.getElementById('start-server');
    const stopServerBtn = document.getElementById('stop-server');
    
    serverStatus.textContent = 'Stopping...';
    serverStatus.className = 'status pulse';
    stopServerBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/server/stop`, {
            method: 'POST'
        });
        
        const data = await response.json();
        if (data.success) {
            serverStatus.textContent = 'Offline';
            serverStatus.className = 'status offline';
            startServerBtn.disabled = false;
            showToast('Server stopped successfully!', 'success');
        } else {
            showToast(data.error || 'Failed to stop server', 'error');
            startServerBtn.disabled = false;
        }
    } catch (error) {
        showToast('Failed to connect to backend: ' + error.message, 'error');
        console.error('Server stop error:', error);
        startServerBtn.disabled = false;
    }
}

async function connectClient() {
    const serverAddress = document.getElementById('server-address').value || '127.0.0.1:8888';
    const operatorName = document.getElementById('operator-name').value || 'default';
    const configPath = document.getElementById('config-file').value || '';
    
    const clientStatus = document.querySelector('#client-tab .status');
    const connectClientBtn = document.getElementById('connect-client');
    const disconnectClientBtn = document.getElementById('disconnect-client');
    
    clientStatus.textContent = 'Connecting...';
    clientStatus.className = 'status pulse';
    connectClientBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/client/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serverAddress, operatorName, configPath })
        });
        
        const data = await response.json();
        if (data.success) {
            clientStatus.textContent = 'Connected';
            clientStatus.className = 'status connected';
            disconnectClientBtn.disabled = false;
            showToast('Client connected successfully!', 'success');
        } else {
            clientStatus.textContent = 'Error';
            clientStatus.className = 'status disconnected';
            connectClientBtn.disabled = false;
            showToast(data.error || 'Failed to connect client', 'error');
        }
    } catch (error) {
        clientStatus.textContent = 'Error';
        clientStatus.className = 'status disconnected';
        connectClientBtn.disabled = false;
        showToast('Failed to connect to backend: ' + error.message, 'error');
        console.error('Client connect error:', error);
    }
}

async function disconnectClient() {
    const clientStatus = document.querySelector('#client-tab .status');
    const connectClientBtn = document.getElementById('connect-client');
    const disconnectClientBtn = document.getElementById('disconnect-client');
    
    clientStatus.textContent = 'Disconnecting...';
    clientStatus.className = 'status pulse';
    disconnectClientBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/client/disconnect`, {
            method: 'POST'
        });
        
        const data = await response.json();
        if (data.success) {
            clientStatus.textContent = 'Disconnected';
            clientStatus.className = 'status disconnected';
            connectClientBtn.disabled = false;
            showToast('Client disconnected successfully!', 'success');
        } else {
            showToast(data.error || 'Failed to disconnect client', 'error');
            connectClientBtn.disabled = false;
        }
    } catch (error) {
        showToast('Failed to connect to backend: ' + error.message, 'error');
        console.error('Client disconnect error:', error);
        connectClientBtn.disabled = false;
    }
}

async function executeCommand() {
    const commandInput = document.getElementById('command-input');
    const command = commandInput.value.trim();
    const commandOutput = document.getElementById('command-output');
    
    if (!command) {
        showToast('Please enter a command', 'warning');
        return;
    }
    
    commandOutput.textContent = `Executing: ${command}\n\n`;
    commandOutput.style.color = '#0f172a';
    
    try {
        const response = await fetch(`${API_BASE}/command/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        
        const data = await response.json();
        if (data.success) {
            commandOutput.textContent = data.output;
            commandOutput.style.color = '#0f172a';
        } else {
            commandOutput.textContent = `Error: ${data.error}`;
            commandOutput.style.color = '#ef4444';
        }
    } catch (error) {
        commandOutput.textContent = `Error: Failed to connect to backend\n${error.message}`;
        commandOutput.style.color = '#ef4444';
        console.error('Command execution error:', error);
    }
}

async function loadSessions() {
    const tbody = document.querySelector('#sessions-table tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="no-data">Loading sessions...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/api/sessions`);
        const data = await response.json();
        
        if (data.success && data.sessions.length > 0) {
            tbody.innerHTML = '';
            data.sessions.forEach(session => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${session.id || 'N/A'}</td>
                    <td>${session.hostname || 'Unknown'}</td>
                    <td>${session.ip || 'N/A'}</td>
                    <td>${session.os || 'Unknown'}</td>
                    <td><span class="status online">Active</span></td>
                    <td>
                        <button class="btn secondary">Interact</button>
                        <button class="btn danger">Kill</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No active sessions</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Error loading sessions</td></tr>';
        console.error('Sessions load error:', error);
    }
}

async function updateServerStatus() {
    try {
        const response = await fetch(`${API_BASE}/server/status`);
        const data = await response.json();
        
        const serverStatus = document.querySelector('#server-tab .status');
        const startServerBtn = document.getElementById('start-server');
        const stopServerBtn = document.getElementById('stop-server');
        
        if (data.running) {
            serverStatus.textContent = 'Online';
            serverStatus.className = 'status online';
            startServerBtn.disabled = true;
            stopServerBtn.disabled = false;
            
            // Update form fields with current config
            if (data.config) {
                document.getElementById('listen-address').value = data.config.listenAddress || '0.0.0.0:8888';
                document.getElementById('cert-path').value = data.config.certPath || '';
                document.getElementById('key-path').value = data.config.keyPath || '';
            }
        } else {
            serverStatus.textContent = 'Offline';
            serverStatus.className = 'status offline';
            startServerBtn.disabled = false;
            stopServerBtn.disabled = true;
        }
    } catch (error) {
        console.error('Failed to update server status:', error);
    }
}

async function updateClientStatus() {
    try {
        const response = await fetch(`${API_BASE}/client/status`);
        const data = await response.json();
        
        const clientStatus = document.querySelector('#client-tab .status');
        const connectClientBtn = document.getElementById('connect-client');
        const disconnectClientBtn = document.getElementById('disconnect-client');
        
        if (data.connected) {
            clientStatus.textContent = 'Connected';
            clientStatus.className = 'status connected';
            connectClientBtn.disabled = true;
            disconnectClientBtn.disabled = false;
            
            // Update form fields with current config
            if (data.config) {
                document.getElementById('server-address').value = data.config.serverAddress || '127.0.0.1:8888';
                document.getElementById('operator-name').value = data.config.operatorName || 'default';
                document.getElementById('config-file').value = data.config.configPath || '';
            }
        } else {
            clientStatus.textContent = 'Disconnected';
            clientStatus.className = 'status disconnected';
            connectClientBtn.disabled = false;
            disconnectClientBtn.disabled = true;
        }
    } catch (error) {
        console.error('Failed to update client status:', error);
    }
}

function loadSettings() {
    const savedTheme = localStorage.getItem('sliver-c2-ui-theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('dark-mode').checked = true;
    }
    
    const savedAutoRefresh = localStorage.getItem('sliver-c2-ui-auto-refresh');
    if (savedAutoRefresh === 'true') {
        document.getElementById('auto-refresh').checked = true;
    }
    
    const savedRefreshInterval = localStorage.getItem('sliver-c2-ui-refresh-interval');
    if (savedRefreshInterval) {
        document.getElementById('refresh-interval').value = savedRefreshInterval;
    }
}

function saveSettings() {
    const darkMode = document.getElementById('dark-mode').checked;
    const autoRefresh = document.getElementById('auto-refresh').checked;
    const refreshInterval = document.getElementById('refresh-interval').value;
    
    localStorage.setItem('sliver-c2-ui-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('sliver-c2-ui-auto-refresh', autoRefresh.toString());
    localStorage.setItem('sliver-c2-ui-refresh-interval', refreshInterval);
    
    // Apply theme immediately
    if (darkMode) {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
    
    // Restart auto-refresh with new interval
    startAutoRefresh();
    
    showToast('Settings saved successfully!', 'success');
}

function checkBackendStatus() {
    fetch(`${API_BASE}/../health`)
        .then(response => {
            if (response.ok) {
                document.getElementById('backend-status').textContent = 'Backend: Online';
                document.getElementById('backend-status').className = 'backend-status online';
            } else {
                throw new Error('Backend health check failed');
            }
        })
        .catch(error => {
            document.getElementById('backend-status').textContent = 'Backend: Offline';
            document.getElementById('backend-status').className = 'backend-status offline';
            console.error('Backend status check failed:', error);
        });
}

function startAutoRefresh() {
    // Clear any existing interval
    if (window.autoRefreshInterval) {
        clearInterval(window.autoRefreshInterval);
    }
    
    const autoRefreshEnabled = document.getElementById('auto-refresh')?.checked || false;
    const refreshInterval = parseInt(document.getElementById('refresh-interval')?.value || '5000');
    
    if (autoRefreshEnabled && refreshInterval > 0) {
        window.autoRefreshInterval = setInterval(() => {
            updateServerStatus();
            updateClientStatus();
            const activeTab = document.querySelector('.sidebar nav ul li.active')?.getAttribute('data-tab');
            if (activeTab === 'sessions') {
                loadSessions();
            }
        }, refreshInterval);
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}