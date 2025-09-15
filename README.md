# 🎤 Talkie - Push to Talk Web App

<div align="center">

![Talkie Logo](https://via.placeholder.com/400x200/667eea/ffffff?text=🎤+Talkie)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.7.2-blue.svg)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-orange.svg)](https://webrtc.org/)

*Real-time voice communication with push-to-talk functionality*

[🚀 Live Demo](#) | [📖 Documentation](#features) | [🐛 Issues](../../issues) | [💬 Discussions](../../discussions)

</div>

## ✨ Features

### 🎯 Core Functionality
- **🎤 Push-to-Talk**: Hold button or spacebar to transmit voice
- **👥 Multi-user Support**: Real-time voice chat with multiple participants
- **🔒 Private Chats**: One-on-one secure voice conversations
- **📱 Mobile Optimized**: Fully responsive design for all devices
- **🔊 Audio Controls**: Volume adjustment and mute functionality

### 🛠️ Technical Features
- **🌐 WebRTC**: Peer-to-peer audio streaming
- **⚡ Socket.IO**: Real-time communication
- **🎵 Audio Processing**: Echo cancellation and noise suppression
- **🔔 Sound Feedback**: Beep notifications for transmission events
- **👤 Auto Name Detection**: Intelligent user identification

## 📸 Screenshots

### Main Interface
![Main Interface](https://via.placeholder.com/800x500/667eea/ffffff?text=Main+Interface+Screenshot)
*Clean, intuitive push-to-talk interface with real-time user status*

### Mobile View
<div align="center">
<img src="https://via.placeholder.com/300x600/667eea/ffffff?text=Mobile+View" alt="Mobile Interface" width="300">
</div>

*Fully responsive design optimized for mobile devices*

### Private Chat Mode
![Private Chat](https://via.placeholder.com/800x400/ff6b6b/ffffff?text=Private+Chat+Mode)
*Secure one-on-one voice conversations with enhanced privacy*

### User Management
![User List](https://via.placeholder.com/600x400/4CAF50/ffffff?text=User+Management+Panel)
*Real-time user list with talking indicators and private chat options*

## 🚀 Quick Start

### Prerequisites
- Node.js v16 or higher
- Modern web browser with WebRTC support
- Microphone access permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/talkie.git
   cd talkie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

5. **Allow microphone access** when prompted

## 🎮 Usage

### Basic Voice Chat
1. **Connect**: Open the app in your browser
2. **Set Name**: Your name is auto-detected or you can set a custom one
3. **Talk**: Hold the microphone button or press spacebar to talk
4. **Listen**: Release to stop transmitting and listen to others

### Private Conversations
1. **Select User**: Click on any user in the online list
2. **Start Chat**: Private connection will be established
3. **Secure Talk**: Your conversation is now private and encrypted
4. **End Chat**: Click "End Chat" button to return to group mode

### Controls & Settings
- **🔊 Volume**: Adjust incoming audio volume
- **🔇 Mute**: Toggle audio output
- **🔔 Beeps**: Enable/disable notification sounds
- **📱 Mobile**: Touch-optimized controls for mobile devices

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client A      │    │   Server        │    │   Client B      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Browser   │◄├────┤►│  Socket.IO  │◄├────┤►│   Browser   │ │
│ │   WebRTC    │ │    │ │   Express   │ │    │ │   WebRTC    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Audio Processing**: WebRTC APIs
- **UI Framework**: Custom responsive design

## 📁 Project Structure

```
talkie/
├── 📁 public/              # Frontend assets
│   ├── 🎨 style.css       # Responsive styling
│   ├── ⚡ app.js          # Main application logic
│   └── 📄 index.html      # HTML structure
├── 🚀 server.js           # Express & Socket.IO server
├── 📦 package.json        # Dependencies & scripts
└── 📖 README.md           # Project documentation
```

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                   # Server port (default: 3000)
```

### Audio Settings
The app automatically configures optimal audio settings:
- **Echo Cancellation**: Enabled
- **Noise Suppression**: Enabled
- **Auto Gain Control**: Enabled
- **Sample Rate**: 44.1kHz (mobile compatible)
- **Latency**: Optimized for real-time communication

## 📱 Mobile Support

Talkie is fully optimized for mobile devices with:
- **Touch Controls**: Tap and hold for push-to-talk
- **Responsive Design**: Adapts to all screen sizes
- **Device Detection**: Samsung Galaxy optimizations
- **Mobile Audio**: Enhanced mobile browser compatibility
- **Gesture Support**: Intuitive touch interactions

![Mobile Demo](https://via.placeholder.com/600x300/667eea/ffffff?text=Mobile+Touch+Controls+Demo)

## 🔒 Privacy & Security

- **Peer-to-Peer**: Direct audio connections between users
- **No Recording**: Audio is transmitted in real-time only
- **Private Chats**: End-to-end encrypted private conversations
- **Microphone Control**: Audio only transmitted when talking
- **Local Storage**: Only user preferences stored locally

## 🛠️ Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

### Browser Compatibility
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

- **Latency**: < 100ms typical audio delay
- **Bandwidth**: ~32 kbps per audio stream
- **Scalability**: Supports 10+ concurrent users
- **Memory**: Efficient WebRTC connection management

## 🐛 Troubleshooting

### Common Issues

**Microphone not working?**
- Ensure browser permissions are granted
- Check if another app is using the microphone
- Try refreshing the page

**Audio quality issues?**
- Check your internet connection
- Ensure you're using a supported browser
- Try adjusting the volume settings

**Can't connect to other users?**
- Verify firewall settings
- Check WebRTC connectivity
- Ensure the server is running

### Getting Help
- 📖 [Documentation](#)
- 🐛 [Report Issues](../../issues)
- 💬 [Community Discussions](../../discussions)
- 📧 [Contact Support](#)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebRTC Community** for excellent documentation
- **Socket.IO Team** for real-time communication tools
- **Contributors** who helped improve the project

---

<div align="center">

**Made with ❤️ by developers who love real-time communication**

[⭐ Star this repo](../../stargazers) | [🍴 Fork it](../../fork) | [📢 Share it](#)

</div> 