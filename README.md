# Sliver C2 UI

![Sliver C2 UI](https://via.placeholder.com/800x400/1e293b/ffffff?text=Sliver+C2+UI) <!-- Replace with actual screenshot -->

A modern, professional web interface for the [Sliver C2 framework](https://github.com/BishopFox/sliver). This UI provides a user-friendly way to manage Sliver server and client operations through a sleek web dashboard.

## 🚀 Features

- **Server Management**: Start/stop Sliver server with custom configurations
- **Client Connection**: Connect/disconnect Sliver client to your server
- **Command Execution**: Execute Sliver commands through an interactive terminal
- **Session Monitoring**: View and manage active sessions (simulated in current version)
- **Real-time Status**: Live status updates for server and client connections
- **Responsive Design**: Works on desktop and tablet devices
- **Dark/Light Mode**: Toggle between themes based on your preference
- **Auto-refresh**: Automatically update session data at configurable intervals
- **Secure Backend**: Node.js/Express backend with input validation and sanitization

## 🎨 UI Design

The interface features:
- **Glassmorphism effects** with frosted glass panels
- **Modern gradient backgrounds** with animated transitions
- **Professional color scheme** using Tailwind-inspired palettes
- **Smooth animations** and hover effects
- **Responsive layout** that adapts to different screen sizes
- **Intuitive tab navigation** for different operational areas

## 🛠️ Installation

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Sliver binaries** (`sliver-server_windows.exe` and `sliver-client_windows.exe`)
- **Windows operating system** (tested on Windows 10/11)

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/sliver-c2-ui.git
   cd sliver-c2-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Copy Sliver binaries**:
   - Download the latest Sliver release from [BishopFox/sliver releases](https://github.com/BishopFox/sliver/releases)
   - Copy `sliver-server_windows.exe` and `sliver-client_windows.exe` to the project root directory

4. **Start the backend server**:
   ```bash
   node server.js
   ```
   
   The backend will start on `http://localhost:3001`

5. **Open the web interface**:
   - Open your browser and navigate to `http://localhost:3001`
   - The UI will automatically connect to the backend

## 🖥️ Usage

### Server Tab

1. **Configure Server Settings**:
   - **Listen Address**: Set the IP:Port for the server (default: `0.0.0.0:8888`)
   - **Certificate Path**: Optional path to SSL certificate file
   - **Key Path**: Optional path to SSL private key file

2. **Start Server**:
   - Click the "Start Server" button to launch the Sliver server
   - Status will change to "Online" when successfully started

3. **Stop Server**:
   - Click the "Stop Server" button to terminate the server process

### Client Tab

1. **Configure Connection**:
   - **Server Address**: IP:Port of the running Sliver server (default: `127.0.0.1:8888`)
   - **Operator Name**: Your operator name (default: `default`)
   - **Config File**: Path to existing configuration file (optional)

2. **Connect Client**:
   - Click "Connect Client" to establish connection to the server
   - Status will show "Connected" when successful

3. **Disconnect Client**:
   - Click "Disconnect Client" to terminate the connection

### Command Tab

1. **Execute Commands**:
   - Type Sliver commands in the input field
   - Press Enter or click "Execute" to run the command
   - Results will appear in the output panel below

2. **Quick Commands**:
   - Use preset buttons for common commands:
     - `sessions` - List active sessions
     - `jobs` - List running jobs
     - `beacons` - List beacons
     - `implants` - List generated implants
     - `operators` - List operators
     - `help` - Show help information

### Sessions Tab

- View active sessions (currently simulated)
- Interact with or terminate sessions (future implementation)

### Settings Tab

- **Theme**: Toggle between dark and light mode
- **Auto-refresh**: Enable automatic data refresh
- **Refresh Interval**: Set refresh frequency in milliseconds (default: 5000ms)

## 🔒 Security Considerations

This application is designed for **local/offline use only**. The backend includes:

- **Input sanitization** to prevent command injection
- **Process isolation** for Sliver binary execution
- **No external network access** beyond localhost
- **Local storage only** for user preferences

⚠️ **Important**: Do not expose this interface to external networks or the internet.

## 🐛 Known Limitations

### Current Implementation

1. **Client Interaction**: The real Sliver client is interactive and requires stdin/stdout handling that's complex in web environments. Current implementation simulates common commands.

2. **Session Management**: Active sessions are simulated since real session data requires proper client-server communication.

3. **Binary Dependencies**: Requires manual copying of Sliver binaries to the project directory.

### Future Improvements

- Full interactive client support using WebSockets
- Real session management with live data
- Implant generation and deployment interface
- Beacon management capabilities
- Operator management tools
- Enhanced security features

## 📁 Project Structure

```
sliver-c2-ui/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling with glassmorphism effects
├── script.js           # Frontend JavaScript logic
├── server.js           # Backend Node.js/Express server
├── package.json        # Project dependencies and metadata
├── README.md           # This documentation file
└── *.exe              # Sliver binaries (copied manually)
```

## 📦 Dependencies

- **express**: Web server framework
- **cors**: Cross-origin resource sharing middleware
- **body-parser**: Request body parsing middleware
- **child_process**: Node.js built-in for process management

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [BishopFox](https://www.bishopfox.com/) for creating the amazing [Sliver C2 framework](https://github.com/BishopFox/sliver)
- [Tailwind CSS](https://tailwindcss.com/) for design inspiration
- The open-source security community

## ❓ Support

For issues or questions, please open an issue in the GitHub repository.

---

**Note**: This UI is a third-party interface for Sliver C2 and is not officially affiliated with BishopFox. Always ensure you have proper authorization before using penetration testing tools.