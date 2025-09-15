class PushToTalkApp {
    constructor() {
        this.socket = io();
        this.localStream = null;
        this.peerConnections = new Map();
        this.privatePeerConnections = new Map();
        this.isTalking = false;
        this.isMuted = false;
        this.volume = 0.5;
        this.audioContext = null;
        this.audioEnabled = false;
        this.remoteAudioElements = new Map();
        this.privateAudioElements = new Map();
        this.userName = null;
        this.currentPrivateChat = null;
        this.isPrivateTalking = false;
        this.beepSoundsEnabled = true;

        // Tab management properties
        this.isTabVisible = true;
        this.wakeLock = null;
        this.keepAliveInterval = null;
        this.lastActivityTime = Date.now();

        this.initializeElements();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.setupTabManagement();
        this.detectUserName();
        this.loadBeepSettings();
        this.checkMicrophonePermission();
    }

    initializeElements() {
        this.userNameInput = document.getElementById('userName');
        this.setNameBtn = document.getElementById('setNameBtn');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.userCount = document.getElementById('userCount');
        this.pushToTalkBtn = document.getElementById('pushToTalk');
        this.usersList = document.getElementById('usersList');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.muteBtn = document.getElementById('muteBtn');
        this.beepToggleBtn = document.getElementById('beepToggleBtn');
        this.privateChatStatus = document.getElementById('privateChatStatus');
        this.endPrivateChatBtn = document.getElementById('endPrivateChatBtn');
    }

    async detectUserName() {
        console.log('🔍 Detecting user name...');

        let detectedName = null;

        detectedName = localStorage.getItem('talkie_user_name');
        if (detectedName) {
            console.log('📦 Found saved name in localStorage:', detectedName);
        }

        if (!detectedName) {
            detectedName = await this.getPCUserName();
        }

        if (!detectedName) {
            detectedName = this.getBrowserUserName();
        }

        if (!detectedName) {
            detectedName = this.generateDefaultName();
        }

        if (detectedName) {
            this.userName = detectedName;
            this.userNameInput.value = detectedName;
            this.setUserName(detectedName);
            console.log('✅ User name set to:', detectedName);
        }
    }

    async getPCUserName() {
        try {
            const methods = [
                () => {
                    const ua = navigator.userAgent;
                    if (ua.includes('Windows')) {
                        return 'Windows User';
                    } else if (ua.includes('Mac')) {
                        return 'Mac User';
                    } else if (ua.includes('Linux')) {
                        return 'Linux User';
                    }
                    return null;
                },

                () => {
                    try {
                        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        const city = timezone.split('/')[1] || timezone.split('/')[0];
                        return `${city} User`;
                    } catch (e) {
                        return null;
                    }
                },

                () => {
                    try {
                        const lang = navigator.language.split('-')[0];
                        const languages = {
                            'en': 'English User',
                            'es': 'Spanish User',
                            'fr': 'French User',
                            'de': 'German User',
                            'it': 'Italian User',
                            'pt': 'Portuguese User',
                            'ru': 'Russian User',
                            'ja': 'Japanese User',
                            'ko': 'Korean User',
                            'zh': 'Chinese User'
                        };
                        return languages[lang] || 'User';
                    } catch (e) {
                        return null;
                    }
                }
            ];

            for (const method of methods) {
                try {
                    const result = method();
                    if (result) {
                        console.log('🖥️ Detected PC name:', result);
                        return result;
                    }
                } catch (error) {
                    console.log('PC name detection method failed:', error);
                }
            }
        } catch (error) {
            console.log('PC name detection failed:', error);
        }
        return null;
    }

    getBrowserUserName() {
        try {
            const browserInfo = {
                platform: navigator.platform,
                language: navigator.language,
                vendor: navigator.vendor
            };

            if (browserInfo.platform) {
                const platform = browserInfo.platform.toLowerCase();
                if (platform.includes('win')) {
                    return 'Windows User';
                } else if (platform.includes('mac')) {
                    return 'Mac User';
                } else if (platform.includes('linux')) {
                    return 'Linux User';
                }
            }

            return null;
        } catch (error) {
            console.log('Browser name detection failed:', error);
            return null;
        }
    }

    generateDefaultName() {
        const adjectives = ['Cool', 'Awesome', 'Smart', 'Quick', 'Bright', 'Swift', 'Sharp', 'Bold', 'Happy', 'Lucky'];
        const nouns = ['User', 'Player', 'Speaker', 'Talker', 'Voice', 'Chatter', 'Friend', 'Guest', 'Hero', 'Star'];

        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNum = Math.floor(Math.random() * 999) + 1;

        const defaultName = `${randomAdjective}${randomNoun}${randomNum}`;
        console.log('🎲 Generated default name:', defaultName);
        return defaultName;
    }

    setUserName(name) {
        if (!name || name.trim() === '') return;

        this.userName = name.trim();
        this.socket.emit('setName', this.userName);

        localStorage.setItem('talkie_user_name', this.userName);
        console.log('💾 Name saved to localStorage:', this.userName);
    }

    loadBeepSettings() {
        const savedBeepSettings = localStorage.getItem('talkie_beep_sounds');
        if (savedBeepSettings !== null) {
            this.beepSoundsEnabled = savedBeepSettings === 'true';
        }

        // Update UI to reflect current state
        if (this.beepToggleBtn) {
            this.beepToggleBtn.textContent = this.beepSoundsEnabled ? '🔔' : '🔕';
            this.beepToggleBtn.classList.toggle('muted', !this.beepSoundsEnabled);
        }

        console.log('🔔 Beep sounds:', this.beepSoundsEnabled ? 'enabled' : 'disabled');
    }

    setupEventListeners() {
        this.setNameBtn.addEventListener('click', () => {
            const name = this.userNameInput.value.trim();
            if (name) {
                this.setUserName(name);
                this.userNameInput.value = '';
            }
        });

        this.userNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setNameBtn.click();
            }
        });

        let nameTimeout;
        this.userNameInput.addEventListener('input', (e) => {
            clearTimeout(nameTimeout);
            nameTimeout = setTimeout(() => {
                const name = e.target.value.trim();
                if (name && name !== this.userName) {
                    this.setUserName(name);
                }
            }, 1000);
        });

        this.pushToTalkBtn.addEventListener('mousedown', () => this.startTalking());
        this.pushToTalkBtn.addEventListener('mouseup', () => this.stopTalking());
        this.pushToTalkBtn.addEventListener('mouseleave', () => this.stopTalking());

        this.pushToTalkBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startTalking();
        });
        this.pushToTalkBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopTalking();
        });
        this.pushToTalkBtn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.stopTalking();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                this.startTalking();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.stopTalking();
            }
        });

        this.volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.volumeValue.textContent = e.target.value;
            this.updateAudioVolume();
        });

        this.muteBtn.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            this.muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
            this.muteBtn.classList.toggle('muted', this.isMuted);
            this.updateAudioVolume();
        });

        // Beep toggle button
        this.beepToggleBtn.addEventListener('click', () => {
            this.beepSoundsEnabled = !this.beepSoundsEnabled;
            this.beepToggleBtn.textContent = this.beepSoundsEnabled ? '🔔' : '🔕';
            this.beepToggleBtn.classList.toggle('muted', !this.beepSoundsEnabled);

            // Save preference to localStorage
            localStorage.setItem('talkie_beep_sounds', this.beepSoundsEnabled);

            // Play a test beep when enabling
            if (this.beepSoundsEnabled) {
                this.playBeep(800, 200);
            }
        });

        document.addEventListener('click', () => this.enableAudio(), { once: true });
        document.addEventListener('touchstart', () => this.enableAudio(), { once: true });

        // Keep track of user activity
        document.addEventListener('mousemove', () => this.updateActivity());
        document.addEventListener('keydown', () => this.updateActivity());
        document.addEventListener('touchstart', () => this.updateActivity());
        document.addEventListener('click', () => this.updateActivity());
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.connectionStatus.textContent = 'Connected';
            this.connectionStatus.className = 'connection-status connected';

            if (this.userName) {
                this.socket.emit('setName', this.userName);
            }
        });

        this.socket.on('disconnect', () => {
            this.connectionStatus.textContent = 'Disconnected';
            this.connectionStatus.className = 'connection-status disconnected';
        });

        this.socket.on('users', (users) => {
            this.updateUsersList(users);
            this.userCount.textContent = `${users.length} users online`;
        });

        this.socket.on('userJoined', (user) => {
            this.createPeerConnection(user.id);
            this.updateUserCount();
        });

        this.socket.on('userLeft', (userId) => {
            this.closePeerConnection(userId);
            this.closePrivatePeerConnection(userId);
            this.updateUserCount();
        });

        this.socket.on('userStartedTalking', (user) => {
            this.updateUserTalkingStatus(user.id, true);
            this.playIncomingTransmissionBeep();
        });

        this.socket.on('userStoppedTalking', (user) => {
            this.updateUserTalkingStatus(user.id, false);
            this.playTransmissionEndBeep();
        });

        this.socket.on('privateChatStarted', (data) => {
            this.currentPrivateChat = data.targetUser;
            this.showPrivateChatUI(data.targetUser);
            this.createPrivatePeerConnection(data.targetUser.id);
            this.playPrivateChatStartBeep();
        });

        this.socket.on('privateChatEnded', () => {
            this.hidePrivateChatUI();
            this.currentPrivateChat = null;
            this.playPrivateChatEndBeep();
        });

        this.socket.on('privateChatError', (data) => {
            alert(data.message);
        });

        this.socket.on('userStartedPrivateTalking', (user) => {
            this.updateUserTalkingStatus(user.id, true, true);
            this.playIncomingTransmissionBeep();
        });

        this.socket.on('userStoppedPrivateTalking', (user) => {
            this.updateUserTalkingStatus(user.id, false, true);
            this.playTransmissionEndBeep();
        });

        this.socket.on('offer', async (data) => {
            await this.handleOffer(data);
        });

        this.socket.on('answer', async (data) => {
            await this.handleAnswer(data);
        });

        this.socket.on('ice-candidate', async (data) => {
            await this.handleIceCandidate(data);
        });

        this.socket.on('private-offer', async (data) => {
            await this.handlePrivateOffer(data);
        });

        this.socket.on('private-answer', async (data) => {
            await this.handlePrivateAnswer(data);
        });

        this.socket.on('private-ice-candidate', async (data) => {
            await this.handlePrivateIceCandidate(data);
        });

        // Keep-alive pong handler
        this.socket.on('pong', (data) => {
            const latency = Date.now() - data.timestamp;
            console.log(`💓 Keep-alive pong received - latency: ${latency}ms`);
            this.updateActivity();
        });
    }

    async checkMicrophonePermission() {
        // Check if we're on mobile and get device info
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isAndroid = /Android/i.test(userAgent);
        const isSamsung = /SM-|Galaxy|samsung/i.test(userAgent);
        const isChrome = /Chrome/i.test(userAgent) && !/Edge|OPR/i.test(userAgent);

        console.log('🔍 Device Detection:', {
            isMobile,
            isAndroid,
            isSamsung,
            isChrome,
            userAgent: userAgent.substring(0, 100) + '...'
        });

        if (isMobile) {
            console.log('📱 Mobile device detected - showing permission request UI');
            this.showMicrophonePermissionUI(isAndroid, isSamsung, isChrome);
        } else {
            // On desktop, try to request immediately
            await this.requestMicrophoneAccess();
        }
    }

    showMicrophonePermissionUI(isAndroid = false, isSamsung = false, isChrome = false) {
        // Create mobile permission UI
        const permissionDiv = document.createElement('div');
        permissionDiv.id = 'microphonePermission';
        permissionDiv.className = 'microphone-permission-overlay';

        let deviceSpecificText = '';
        if (isSamsung) {
            deviceSpecificText = '<p class="device-note">🤖 <strong>Samsung Galaxy detected!</strong> This works great on your device.</p>';
        } else if (isAndroid) {
            deviceSpecificText = '<p class="device-note">📱 <strong>Android device detected!</strong> Microphone access is supported.</p>';
        }

        permissionDiv.innerHTML = `
            <div class="permission-content">
                <div class="permission-icon">🎤</div>
                <h2>Microphone Access Required</h2>
                ${deviceSpecificText}
                <p>Talkie needs access to your microphone to enable voice chat.</p>
                <p class="chrome-note">📋 <strong>Steps:</strong> Tap the button below → Chrome will ask for permission → Tap "Allow"</p>
                <button id="requestMicBtn" class="request-mic-btn">🎤 Allow Microphone Access</button>
                <p class="permission-note">🔒 Your audio is only transmitted when you hold the talk button.</p>
            </div>
        `;

        document.body.appendChild(permissionDiv);

        // Add click handler
        const requestMicBtn = document.getElementById('requestMicBtn');
        requestMicBtn.addEventListener('click', async () => {
            try {
                await this.requestMicrophoneAccess();
                permissionDiv.remove();
            } catch (error) {
                // Don't remove on error - let error handling show
                console.log('Permission request failed, keeping overlay for error handling');
            }
        });
    }

    async requestMicrophoneAccess() {
        try {
            console.log('🎤 Requesting microphone access...');

            // Check if we're in a secure context (HTTPS or localhost)
            if (!window.isSecureContext) {
                throw new Error('Microphone access requires HTTPS or localhost');
            }

            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia not supported');
            }

            // Samsung Galaxy optimized audio constraints
            const audioConstraints = {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                // More compatible sample rate for mobile devices
                sampleRate: { ideal: 44100, min: 16000, max: 48000 },
                // Ensure we can get audio even if other apps are using mic
                channelCount: { ideal: 1, min: 1, max: 2 },
                // Reduce latency for real-time communication
                latency: { ideal: 0.01, max: 0.1 },
                // Mobile-friendly volume settings
                volume: { ideal: 1.0, min: 0.0, max: 1.0 }
            };

            console.log('🔧 Using audio constraints:', audioConstraints);

            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints
            });

            console.log('✅ Microphone access granted');
            console.log('🎵 Audio tracks:', this.localStream.getAudioTracks().map(track => ({
                id: track.id,
                label: track.label,
                kind: track.kind,
                enabled: track.enabled,
                settings: track.getSettings()
            })));

            // Show success message briefly
            this.showMicrophoneSuccessMessage();

        } catch (error) {
            console.error('❌ Error accessing microphone:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                constraint: error.constraint
            });
            this.showMicrophoneErrorMessage(error);
            throw error; // Re-throw to be caught by caller
        }
    }

    showMicrophoneSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'microphone-success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✅</span>
                <span>Microphone access granted!</span>
            </div>
        `;

        document.body.appendChild(successDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }

    showMicrophoneErrorMessage(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'microphone-error-overlay';

        let errorMessage = 'Microphone access is required for this app to work.';
        let helpText = 'Please refresh the page and allow microphone access.';

        if (error.name === 'NotAllowedError') {
            errorMessage = 'Microphone access was denied.';
            helpText = 'Please check your browser settings and allow microphone access for this site.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No microphone found.';
            helpText = 'Please connect a microphone and refresh the page.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Your browser doesn\'t support microphone access.';
            helpText = 'Please try using a modern browser like Chrome, Firefox, or Safari.';
        }

        errorDiv.innerHTML = `
            <div class="error-content">
                <div class="error-icon">❌</div>
                <h2>Microphone Access Required</h2>
                <p class="error-message">${errorMessage}</p>
                <p class="help-text">${helpText}</p>
                <div class="error-buttons">
                    <button id="retryMicBtn" class="retry-mic-btn">Try Again</button>
                    <button id="helpMicBtn" class="help-mic-btn">Show Help</button>
                </div>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // Add event listeners
        document.getElementById('retryMicBtn').addEventListener('click', async () => {
            errorDiv.remove();
            await this.requestMicrophoneAccess();
        });

        document.getElementById('helpMicBtn').addEventListener('click', () => {
            this.showMicrophoneHelpDialog();
        });
    }

    showMicrophoneHelpDialog() {
        const helpDiv = document.createElement('div');
        helpDiv.className = 'microphone-help-overlay';
        helpDiv.innerHTML = `
            <div class="help-content">
                <h2>How to Enable Microphone Access</h2>
                <div class="help-steps">
                    <div class="help-step">
                        <strong>Samsung Galaxy + Chrome:</strong>
                        <ol>
                            <li>Tap the 🔒 lock icon next to the URL</li>
                            <li>Tap "Permissions" or "Site settings"</li>
                            <li>Find "Microphone" and tap it</li>
                            <li>Select "Allow" or "Ask"</li>
                            <li>Refresh the page and try again</li>
                        </ol>
                    </div>
                    <div class="help-step">
                        <strong>If that doesn't work:</strong>
                        <ol>
                            <li>Open Chrome menu (⋮)</li>
                            <li>Go to "Settings" → "Site settings"</li>
                            <li>Tap "Microphone"</li>
                            <li>Make sure it's not blocked</li>
                            <li>Add this site to allowed sites</li>
                        </ol>
                    </div>
                    <div class="help-step">
                        <strong>Samsung-specific issues:</strong>
                        <ul>
                            <li>Make sure Samsung Voice Recorder isn't running</li>
                            <li>Close other apps that might use the microphone</li>
                            <li>Try restarting Chrome</li>
                            <li>Check if Samsung's privacy settings allow microphone access</li>
                        </ul>
                    </div>
                </div>
                <button id="closeHelpBtn" class="close-help-btn">Close</button>
            </div>
        `;

        document.body.appendChild(helpDiv);

        document.getElementById('closeHelpBtn').addEventListener('click', () => {
            helpDiv.remove();
        });
    }

    enableAudio() {
        if (!this.audioEnabled) {
            this.audioEnabled = true;
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            console.log('Audio enabled by user interaction');

            this.remoteAudioElements.forEach((audio, userId) => {
                this.playAudioElement(audio, userId);
            });

            this.privateAudioElements.forEach((audio, userId) => {
                this.playAudioElement(audio, userId);
            });
        }
    }

    // Beep sound generation functions
    playBeep(frequency = 800, duration = 200, type = 'sine') {
        if (!this.beepSoundsEnabled || this.isMuted) return;

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            // Volume envelope for smooth sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.warn('Could not play beep sound:', error);
        }
    }

    playIncomingTransmissionBeep() {
        // Higher pitched double beep for incoming transmission
        this.playBeep(1000, 150, 'sine');
        setTimeout(() => this.playBeep(1200, 150, 'sine'), 200);
    }

    playTransmissionEndBeep() {
        // Lower pitched single beep for end of transmission
        this.playBeep(600, 300, 'sine');
    }

    playPrivateChatStartBeep() {
        // Ascending tone for private chat start
        this.playBeep(800, 100, 'sine');
        setTimeout(() => this.playBeep(1000, 100, 'sine'), 150);
        setTimeout(() => this.playBeep(1200, 100, 'sine'), 300);
    }

    playPrivateChatEndBeep() {
        // Descending tone for private chat end
        this.playBeep(1200, 100, 'sine');
        setTimeout(() => this.playBeep(1000, 100, 'sine'), 150);
        setTimeout(() => this.playBeep(800, 100, 'sine'), 300);
    }

    startTalking() {
        if (this.isTalking || !this.localStream) return;

        this.isTalking = true;
        this.pushToTalkBtn.classList.add('talking');
        this.pushToTalkBtn.querySelector('.ptt-text').textContent = 'Talking...';

        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = true;
        }

        if (this.currentPrivateChat) {
            this.isPrivateTalking = true;
            this.socket.emit('startPrivateTalking', this.currentPrivateChat.id);
        } else {
            this.socket.emit('startTalking');
        }
    }

    stopTalking() {
        if (!this.isTalking) return;

        this.isTalking = false;
        this.pushToTalkBtn.classList.remove('talking');
        this.pushToTalkBtn.querySelector('.ptt-text').textContent = this.currentPrivateChat ? 'Hold to Talk (Private)' : 'Hold to Talk';

        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = false;
        }

        if (this.currentPrivateChat) {
            this.isPrivateTalking = false;
            this.socket.emit('stopPrivateTalking', this.currentPrivateChat.id);
        } else {
            this.socket.emit('stopTalking');
        }
    }

    startPrivateChat(userId) {
        console.log('📞 Attempting to start private chat with userId:', userId);
        this.socket.emit('startPrivateChat', userId);
    }

    endPrivateChat() {
        this.socket.emit('endPrivateChat');
    }

    showPrivateChatUI(targetUser) {
        if (!this.privateChatStatus) {
            const privateChatDiv = document.createElement('div');
            privateChatDiv.id = 'privateChatStatus';
            privateChatDiv.className = 'private-chat-status';
            privateChatDiv.innerHTML = `
                <div class="private-chat-content">
                    <span class="private-chat-icon">🔒</span>
                    <span class="private-chat-text">Private chat with <strong>${targetUser.name}</strong></span>
                    <button id="endPrivateChatBtn" class="end-private-chat-btn">End Chat</button>
                </div>
            `;

            const mainControls = document.querySelector('.main-controls');
            mainControls.insertAdjacentElement('afterend', privateChatDiv);

            this.privateChatStatus = privateChatDiv;
            this.endPrivateChatBtn = document.getElementById('endPrivateChatBtn');

            this.endPrivateChatBtn.addEventListener('click', () => {
                this.endPrivateChat();
            });
        } else {
            const textElement = this.privateChatStatus.querySelector('.private-chat-text');
            textElement.innerHTML = `Private chat with <strong>${targetUser.name}</strong>`;
        }

        this.privateChatStatus.style.display = 'block';
        this.pushToTalkBtn.querySelector('.ptt-text').textContent = 'Hold to Talk (Private)';
    }

    hidePrivateChatUI() {
        if (this.privateChatStatus) {
            this.privateChatStatus.style.display = 'none';
        }

        this.pushToTalkBtn.querySelector('.ptt-text').textContent = 'Hold to Talk';
    }

    async createPeerConnection(userId) {
        if (this.peerConnections.has(userId)) return;

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        peerConnection.ontrack = (event) => {
            console.log('Received remote stream from:', userId);
            const remoteStream = event.streams[0];
            this.playRemoteAudio(remoteStream, userId);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    target: userId,
                    candidate: event.candidate
                });
            }
        };

        this.peerConnections.set(userId, peerConnection);

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            this.socket.emit('offer', {
                target: userId,
                offer: offer
            });
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }

    async createPrivatePeerConnection(userId) {
        if (this.privatePeerConnections.has(userId)) return;

        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        peerConnection.ontrack = (event) => {
            console.log('Received private remote stream from:', userId);
            const remoteStream = event.streams[0];
            this.playPrivateRemoteAudio(remoteStream, userId);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('private-ice-candidate', {
                    target: userId,
                    candidate: event.candidate
                });
            }
        };

        this.privatePeerConnections.set(userId, peerConnection);

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            this.socket.emit('private-offer', {
                target: userId,
                offer: offer
            });
        } catch (error) {
            console.error('Error creating private offer:', error);
        }
    }

    async handleOffer(data) {
        const peerConnection = this.peerConnections.get(data.sender) ||
            await this.createPeerConnection(data.sender);

        try {
            await peerConnection.setRemoteDescription(data.offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            this.socket.emit('answer', {
                target: data.sender,
                answer: answer
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(data) {
        const peerConnection = this.peerConnections.get(data.sender);
        if (peerConnection) {
            try {
                await peerConnection.setRemoteDescription(data.answer);
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        }
    }

    async handleIceCandidate(data) {
        const peerConnection = this.peerConnections.get(data.sender);
        if (peerConnection) {
            try {
                await peerConnection.addIceCandidate(data.candidate);
            } catch (error) {
                console.error('Error handling ICE candidate:', error);
            }
        }
    }

    async handlePrivateOffer(data) {
        const peerConnection = this.privatePeerConnections.get(data.sender) ||
            await this.createPrivatePeerConnection(data.sender);

        try {
            await peerConnection.setRemoteDescription(data.offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            this.socket.emit('private-answer', {
                target: data.sender,
                answer: answer
            });
        } catch (error) {
            console.error('Error handling private offer:', error);
        }
    }

    async handlePrivateAnswer(data) {
        const peerConnection = this.privatePeerConnections.get(data.sender);
        if (peerConnection) {
            try {
                await peerConnection.setRemoteDescription(data.answer);
            } catch (error) {
                console.error('Error handling private answer:', error);
            }
        }
    }

    async handlePrivateIceCandidate(data) {
        const peerConnection = this.privatePeerConnections.get(data.sender);
        if (peerConnection) {
            try {
                await peerConnection.addIceCandidate(data.candidate);
            } catch (error) {
                console.error('Error handling private ICE candidate:', error);
            }
        }
    }

    playRemoteAudio(stream, userId) {
        console.log('Setting up audio for user:', userId);

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const audio = new Audio();
        audio.srcObject = stream;
        audio.volume = this.volume;
        audio.muted = this.isMuted;
        audio.autoplay = true;
        audio.playsInline = true;

        audio.setAttribute('data-user-id', userId);
        this.remoteAudioElements.set(userId, audio);
        document.body.appendChild(audio);

        const playAudio = async () => {
            try {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                await audio.play();
                console.log(`✅ Audio playing for user ${userId}`);
            } catch (error) {
                console.warn(`❌ Audio autoplay blocked for user ${userId}:`, error);
                this.showAudioPrompt(userId, audio);
            }
        };

        playAudio();

        audio.addEventListener('canplay', () => {
            console.log('Audio can play for user:', userId);
            playAudio();
        });

        audio.addEventListener('error', (e) => {
            console.error(`Audio error for user ${userId}:`, e);
        });

        audio.addEventListener('loadeddata', () => {
            console.log('Audio data loaded for user:', userId);
            playAudio();
        });
    }

    playPrivateRemoteAudio(stream, userId) {
        console.log('Setting up private audio for user:', userId);

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const audio = new Audio();
        audio.srcObject = stream;
        audio.volume = this.volume;
        audio.muted = this.isMuted;
        audio.autoplay = true;
        audio.playsInline = true;

        audio.setAttribute('data-private-user-id', userId);
        this.privateAudioElements.set(userId, audio);
        document.body.appendChild(audio);

        const playAudio = async () => {
            try {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                await audio.play();
                console.log(`✅ Private audio playing for user ${userId}`);
            } catch (error) {
                console.warn(`❌ Private audio autoplay blocked for user ${userId}:`, error);
                this.showAudioPrompt(userId, audio);
            }
        };

        playAudio();

        audio.addEventListener('canplay', () => {
            console.log('Private audio can play for user:', userId);
            playAudio();
        });

        audio.addEventListener('error', (e) => {
            console.error(`Private audio error for user ${userId}:`, e);
        });

        audio.addEventListener('loadeddata', () => {
            console.log('Private audio data loaded for user:', userId);
            playAudio();
        });
    }

    playAudioElement(audio, userId) {
        if (audio && !audio.paused) return;

        audio.play().then(() => {
            console.log(`✅ Audio resumed for user ${userId}`);
        }).catch(error => {
            console.warn(`❌ Could not resume audio for user ${userId}:`, error);
        });
    }

    showAudioPrompt(userId, audio) {
        const existingPrompt = document.querySelector(`[data-prompt-user="${userId}"]`);
        if (existingPrompt) {
            existingPrompt.remove();
        }

        const prompt = document.createElement('div');
        prompt.className = 'audio-prompt';
        prompt.setAttribute('data-prompt-user', userId);
        prompt.innerHTML = `
            <div class="audio-prompt-content">
                <p>🔊 Click to enable audio for user ${userId.substring(0, 6)}</p>
                <button onclick="this.parentElement.parentElement.remove(); this.audio.play().catch(console.error);">Enable Audio</button>
            </div>
        `;

        const button = prompt.querySelector('button');
        button.audio = audio;

        document.body.appendChild(prompt);
    }

    updateAudioVolume() {
        this.remoteAudioElements.forEach((audio, userId) => {
            audio.volume = this.volume;
            audio.muted = this.isMuted;
        });

        this.privateAudioElements.forEach((audio, userId) => {
            audio.volume = this.volume;
            audio.muted = this.isMuted;
        });
    }

    closePeerConnection(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(userId);
        }

        const audio = this.remoteAudioElements.get(userId);
        if (audio) {
            audio.remove();
            this.remoteAudioElements.delete(userId);
        }

        const prompt = document.querySelector(`[data-prompt-user="${userId}"]`);
        if (prompt) {
            prompt.remove();
        }
    }

    closePrivatePeerConnection(userId) {
        const peerConnection = this.privatePeerConnections.get(userId);
        if (peerConnection) {
            peerConnection.close();
            this.privatePeerConnections.delete(userId);
        }

        const audio = this.privateAudioElements.get(userId);
        if (audio) {
            audio.remove();
            this.privateAudioElements.delete(userId);
        }
    }

    updateUsersList(users) {
        this.usersList.innerHTML = '';
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.id = `user-${user.id}`;

            userCard.addEventListener('click', () => {
                console.log('🖱️ User card clicked:', user.name, user.id);
                console.log('🔍 Conditions check:', {
                    'not self': user.id !== this.socket.id,
                    'user not in private chat': !user.inPrivateChat,
                    'current user not in private chat': !this.currentPrivateChat
                });

                if (user.id !== this.socket.id && !user.inPrivateChat && !this.currentPrivateChat) {
                    console.log('✅ Starting private chat with:', user.name);
                    this.startPrivateChat(user.id);
                } else {
                    console.log('❌ Cannot start private chat due to conditions');
                }
            });

            userCard.innerHTML = `
                <div class="user-name">${user.name}</div>
                <div class="user-status">${user.isTalking ? 'Talking' : 'Listening'}</div>
                <div class="user-actions">
                    ${user.inPrivateChat ? '<span class="private-indicator">🔒 In Private Chat</span>' :
                    user.id !== this.socket.id ? '<span class="click-hint">Click to start private chat</span>' : ''}
                </div>
            `;

            if (user.isTalking) {
                userCard.classList.add('talking');
            }

            if (user.inPrivateChat) {
                userCard.classList.add('in-private-chat');
            }

            if (user.id === this.socket.id) {
                userCard.classList.add('current-user');
            }

            this.usersList.appendChild(userCard);
        });
    }

    updateUserTalkingStatus(userId, isTalking, isPrivate = false) {
        const userCard = document.getElementById(`user-${userId}`);
        if (userCard) {
            const statusElement = userCard.querySelector('.user-status');
            statusElement.textContent = isTalking ? 'Talking' : 'Listening';

            if (isTalking) {
                userCard.classList.add('talking');
            } else {
                userCard.classList.remove('talking');
            }
        }
    }

    updateUserCount() {
        const userCards = document.querySelectorAll('.user-card');
        this.userCount.textContent = `${userCards.length} users online`;
    }

    // Tab Management Methods
    setupTabManagement() {
        console.log('🔄 Setting up tab management for Chrome...');

        // Page Visibility API
        this.setupPageVisibilityAPI();

        // Wake Lock API (Chrome 84+)
        this.requestWakeLock();

        // Keep-alive mechanism
        this.startKeepAlive();

        // Audio context management
        this.setupAudioContextManagement();

        // Beforeunload warning
        this.setupUnloadWarning();
    }

    setupPageVisibilityAPI() {
        const handleVisibilityChange = () => {
            this.isTabVisible = !document.hidden;
            console.log(`👁️ Tab visibility changed: ${this.isTabVisible ? 'visible' : 'hidden'}`);

            if (this.isTabVisible) {
                console.log('✅ Tab is now active - resuming audio');
                this.resumeAudioContext();
                this.reconnectIfNeeded();
                this.showTabActiveNotification();
            } else {
                console.log('⚠️ Tab is now inactive - maintaining connections');
                this.showTabInactiveWarning();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Handle focus/blur for additional reliability
        window.addEventListener('focus', () => {
            this.isTabVisible = true;
            this.resumeAudioContext();
            this.updateActivity();
        });

        window.addEventListener('blur', () => {
            this.isTabVisible = false;
        });
    }

    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('🔒 Wake lock acquired - screen will stay active');
                this.showWakeLockIndicator(true);

                this.wakeLock.addEventListener('release', () => {
                    console.log('🔓 Wake lock released');
                    this.showWakeLockIndicator(false);
                });
            } else {
                console.log('⚠️ Wake Lock API not supported');
            }
        } catch (error) {
            console.warn('❌ Failed to acquire wake lock:', error);
        }
    }

    showWakeLockIndicator(isActive) {
        const existingIndicator = document.querySelector('.wake-lock-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (isActive) {
            const indicator = document.createElement('div');
            indicator.className = 'wake-lock-indicator';
            indicator.innerHTML = '🔒 Screen Lock Active';
            document.body.appendChild(indicator);

            // Remove after 5 seconds
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 5000);
        }
    }

    startKeepAlive() {
        // Send periodic ping to server to maintain connection
        this.keepAliveInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('ping', { timestamp: Date.now() });
            }

            // Maintain audio context
            this.maintainAudioContext();

        }, 10000); // Every 10 seconds

        console.log('💓 Keep-alive mechanism started');
    }

    setupAudioContextManagement() {
        // Ensure audio context doesn't get suspended
        setInterval(() => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                console.log('🎵 Resuming suspended audio context');
                this.audioContext.resume();
            }
        }, 1000);
    }

    setupUnloadWarning() {
        window.addEventListener('beforeunload', (event) => {
            if (this.socket && this.socket.connected) {
                const message = 'You are currently in a voice chat. Are you sure you want to leave?';
                event.preventDefault();
                event.returnValue = message;
                return message;
            }
        });
    }

    updateActivity() {
        this.lastActivityTime = Date.now();
    }

    async resumeAudioContext() {
        try {
            if (this.audioContext && this.audioContext.state !== 'running') {
                await this.audioContext.resume();
                console.log('🎵 Audio context resumed');
            }

            // Resume all audio elements
            this.remoteAudioElements.forEach(async (audio, userId) => {
                try {
                    if (audio.paused) {
                        await audio.play();
                        console.log(`▶️ Resumed audio for user ${userId}`);
                    }
                } catch (error) {
                    console.warn(`❌ Failed to resume audio for user ${userId}:`, error);
                }
            });

            this.privateAudioElements.forEach(async (audio, userId) => {
                try {
                    if (audio.paused) {
                        await audio.play();
                        console.log(`▶️ Resumed private audio for user ${userId}`);
                    }
                } catch (error) {
                    console.warn(`❌ Failed to resume private audio for user ${userId}:`, error);
                }
            });

        } catch (error) {
            console.warn('❌ Failed to resume audio context:', error);
        }
    }

    maintainAudioContext() {
        if (this.audioContext) {
            // Create a silent oscillator to keep context active
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                // Silent volume
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

                oscillator.frequency.value = 440;
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.001);
            } catch (error) {
                // Ignore errors for this maintenance operation
            }
        }
    }

    reconnectIfNeeded() {
        if (this.socket && !this.socket.connected) {
            console.log('🔄 Attempting to reconnect socket...');
            this.socket.connect();
        }
    }

    showTabActiveNotification() {
        if (!this.isTabVisible) return;

        const notification = document.createElement('div');
        notification.className = 'tab-notification tab-active';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✅</span>
                <span>Tab is active - voice chat ready</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    showTabInactiveWarning() {
        const notification = document.createElement('div');
        notification.className = 'tab-notification tab-inactive';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⚠️</span>
                <span>Keep this tab active for best voice quality</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Override the original playRemoteAudio to ensure tab activity
    playRemoteAudio(stream, userId) {
        console.log('Setting up audio for user:', userId);
        this.updateActivity(); // Mark as active when receiving audio

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const audio = new Audio();
        audio.srcObject = stream;
        audio.volume = this.volume;
        audio.muted = this.isMuted;
        audio.autoplay = true;
        audio.playsInline = true;

        audio.setAttribute('data-user-id', userId);
        this.remoteAudioElements.set(userId, audio);
        document.body.appendChild(audio);

        const playAudio = async () => {
            try {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                await audio.play();
                console.log(`✅ Audio playing for user ${userId}`);
                this.updateActivity(); // Mark as active when audio starts
            } catch (error) {
                console.warn(`❌ Audio autoplay blocked for user ${userId}:`, error);
                this.showAudioPrompt(userId, audio);
            }
        };

        playAudio();

        audio.addEventListener('canplay', () => {
            console.log('Audio can play for user:', userId);
            playAudio();
        });

        audio.addEventListener('error', (e) => {
            console.error(`Audio error for user ${userId}:`, e);
        });

        audio.addEventListener('loadeddata', () => {
            console.log('Audio data loaded for user:', userId);
            playAudio();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PushToTalkApp();
});
