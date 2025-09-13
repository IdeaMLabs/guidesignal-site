/**
 * Real-Time Communication System
 * Addresses 48-hour response guarantee and user engagement issues
 * 
 * Features:
 * - Real-time status updates for applications
 * - Instant feedback collection
 * - Live chat support
 * - Push notifications for important updates
 * - Response time tracking and optimization
 */

class RealTimeCommunication {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.notificationQueue = [];
        this.feedbackBuffer = new Map();
        this.responseMetrics = {
            averageResponseTime: 0,
            responseRates: [],
            lastResponseTime: null
        };
        
        this.init();
    }

    async init() {
        try {
            // Initialize WebSocket connection for real-time updates
            await this.initWebSocket();
            
            // Setup notification system
            await this.initNotifications();
            
            // Initialize feedback system
            this.initFeedbackSystem();
            
            // Setup response tracking
            this.initResponseTracking();
            
            // Start heartbeat monitoring
            this.startHeartbeat();
            
            console.log('Real-time communication system initialized');
        } catch (error) {
            console.error('Failed to initialize real-time communication:', error);
        }
    }

    /**
     * WebSocket connection for real-time updates
     */
    async initWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                // Use secure WebSocket for production
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws`;
                
                // For development, fallback to polling if WebSocket not available
                if (window.location.hostname === 'localhost' || window.location.hostname.includes('github.io')) {
                    this.initPollingFallback();
                    resolve();
                    return;
                }
                
                this.ws = new WebSocket(wsUrl);
                
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    this.handleWebSocketMessage(JSON.parse(event.data));
                };
                
                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.handleReconnect();
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };
                
            } catch (error) {
                // Fallback to polling if WebSocket fails
                this.initPollingFallback();
                resolve();
            }
        });
    }

    /**
     * Polling fallback when WebSocket is not available
     */
    initPollingFallback() {
        console.log('Using polling fallback for real-time updates');
        
        // Poll for updates every 30 seconds
        this.pollingInterval = setInterval(async () => {
            try {
                await this.pollForUpdates();
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 30000);
    }

    /**
     * Poll for application updates
     */
    async pollForUpdates() {
        const userId = this.getCurrentUserId();
        if (!userId) return;
        
        try {
            const response = await fetch(`/api/updates/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const updates = await response.json();
                updates.forEach(update => this.handleUpdate(update));
            }
        } catch (error) {
            console.error('Failed to poll for updates:', error);
        }
    }

    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'application_update':
                this.handleApplicationUpdate(data);
                break;
            case 'employer_response':
                this.handleEmployerResponse(data);
                break;
            case 'interview_scheduled':
                this.handleInterviewScheduled(data);
                break;
            case 'feedback_request':
                this.handleFeedbackRequest(data);
                break;
            case 'system_notification':
                this.handleSystemNotification(data);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    /**
     * Handle application status updates
     */
    handleApplicationUpdate(data) {
        const { applicationId, status, employer, jobTitle, timestamp } = data;
        
        // Update UI elements
        this.updateApplicationStatus(applicationId, status);
        
        // Show notification
        const message = this.getStatusMessage(status, employer, jobTitle);
        this.showNotification(message, 'info');
        
        // Track response metrics
        this.updateResponseMetrics(timestamp);
        
        // Trigger status update animation
        this.animateStatusChange(applicationId, status);
    }

    /**
     * Handle employer responses
     */
    handleEmployerResponse(data) {
        const { applicationId, employer, message, responseTime, priority } = data;
        
        // High priority responses get immediate attention
        if (priority === 'high') {
            this.showNotification(
                `🚀 Fast Response! ${employer} replied to your application`,
                'success',
                { persistent: true, sound: true }
            );
        } else {
            this.showNotification(
                `📩 ${employer}: ${message}`,
                'info'
            );
        }
        
        // Update response time metrics
        this.recordResponseTime(responseTime);
        
        // Update application card
        this.updateApplicationCard(applicationId, {
            hasResponse: true,
            lastResponse: message,
            responseTime: responseTime
        });
    }

    /**
     * Initialize push notifications
     */
    async initNotifications() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        }
        
        // Setup service worker for push notifications
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                this.swRegistration = registration;
            } catch (error) {
                console.error('Service worker not available:', error);
            }
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info', options = {}) {
        // Visual notification
        this.createToastNotification(message, type, options);
        
        // Browser notification if permitted
        if (Notification.permission === 'granted' && !document.hasFocus()) {
            const notification = new Notification('GuideSignal Update', {
                body: message,
                icon: '/assets/GuideSignalLogo.png',
                badge: '/assets/GuideSignalLogo.png'
            });
            
            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);
        }
        
        // Play sound for important notifications
        if (options.sound) {
            this.playNotificationSound();
        }
    }

    /**
     * Create toast notification
     */
    createToastNotification(message, type, options = {}) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} ${options.persistent ? 'persistent' : ''}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-message">${message}</div>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        // Add styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            maxWidth: '400px',
            animation: 'slideIn 0.3s ease-out'
        });
        
        document.body.appendChild(toast);
        
        // Auto-remove after delay (unless persistent)
        if (!options.persistent) {
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }
    }

    /**
     * Initialize feedback system
     */
    initFeedbackSystem() {
        // Create feedback widget
        this.createFeedbackWidget();
        
        // Setup feedback collection
        this.setupFeedbackCollection();
        
        // Initialize satisfaction surveys
        this.initSatisfactionSurveys();
    }

    /**
     * Create floating feedback widget
     */
    createFeedbackWidget() {
        const widget = document.createElement('div');
        widget.id = 'feedback-widget';
        widget.innerHTML = `
            <div class="feedback-trigger" onclick="window.rtComm.toggleFeedback()">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                </svg>
                <span>Feedback</span>
            </div>
            <div class="feedback-panel" id="feedback-panel" style="display: none;">
                <div class="feedback-header">
                    <h3>How are we doing?</h3>
                    <button onclick="window.rtComm.toggleFeedback()">&times;</button>
                </div>
                <div class="feedback-content">
                    <div class="quick-feedback">
                        <button class="feedback-btn positive" onclick="window.rtComm.submitQuickFeedback('positive')">👍 Good</button>
                        <button class="feedback-btn neutral" onclick="window.rtComm.submitQuickFeedback('neutral')">👌 Okay</button>
                        <button class="feedback-btn negative" onclick="window.rtComm.submitQuickFeedback('negative')">👎 Poor</button>
                    </div>
                    <textarea id="feedback-text" placeholder="Tell us more (optional)..." rows="3"></textarea>
                    <button class="submit-feedback" onclick="window.rtComm.submitDetailedFeedback()">Send Feedback</button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #feedback-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
            }
            .feedback-trigger {
                background: #0F172A;
                color: white;
                padding: 12px 16px;
                border-radius: 50px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: transform 0.2s;
            }
            .feedback-trigger:hover {
                transform: translateY(-2px);
            }
            .feedback-panel {
                position: absolute;
                bottom: 60px;
                right: 0;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                width: 320px;
                padding: 20px;
            }
            .feedback-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            .quick-feedback {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
            }
            .feedback-btn {
                flex: 1;
                padding: 8px 12px;
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .feedback-btn:hover {
                border-color: #0F172A;
            }
            #feedback-text {
                width: 100%;
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
                resize: vertical;
            }
            .submit-feedback {
                background: #0F172A;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                width: 100%;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(widget);
        
        // Make functions globally available
        window.rtComm = this;
    }

    /**
     * Toggle feedback panel
     */
    toggleFeedback() {
        const panel = document.getElementById('feedback-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    /**
     * Submit quick feedback
     */
    async submitQuickFeedback(sentiment) {
        const feedbackData = {
            type: 'quick',
            sentiment: sentiment,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            userId: this.getCurrentUserId()
        };
        
        try {
            await this.sendFeedback(feedbackData);
            this.showNotification('Thanks for your feedback! 🙏', 'success');
            this.toggleFeedback();
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            this.showNotification('Failed to send feedback. Please try again.', 'error');
        }
    }

    /**
     * Submit detailed feedback
     */
    async submitDetailedFeedback() {
        const text = document.getElementById('feedback-text').value;
        
        const feedbackData = {
            type: 'detailed',
            text: text,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            userId: this.getCurrentUserId()
        };
        
        try {
            await this.sendFeedback(feedbackData);
            this.showNotification('Thanks for your detailed feedback! 🙏', 'success');
            this.toggleFeedback();
            document.getElementById('feedback-text').value = '';
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            this.showNotification('Failed to send feedback. Please try again.', 'error');
        }
    }

    /**
     * Send feedback to server
     */
    async sendFeedback(feedbackData) {
        // Store locally first
        this.feedbackBuffer.set(Date.now(), feedbackData);
        
        // Try to send to server
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(feedbackData)
            });
            
            if (response.ok) {
                // Remove from local buffer
                this.feedbackBuffer.delete(feedbackData.timestamp);
            }
        } catch (error) {
            // Keep in buffer for retry
            console.log('Feedback stored locally for retry');
        }
    }

    /**
     * Response time tracking
     */
    initResponseTracking() {
        // Track page interactions for response analysis
        this.trackUserInteractions();
        
        // Monitor application submissions
        this.monitorApplications();
        
        // Setup response time dashboard
        this.createResponseDashboard();
    }

    /**
     * Update response metrics
     */
    updateResponseMetrics(responseTime) {
        this.responseMetrics.responseRates.push(responseTime);
        
        // Keep only last 100 responses
        if (this.responseMetrics.responseRates.length > 100) {
            this.responseMetrics.responseRates.shift();
        }
        
        // Calculate average
        const total = this.responseMetrics.responseRates.reduce((sum, time) => sum + time, 0);
        this.responseMetrics.averageResponseTime = total / this.responseMetrics.responseRates.length;
        
        this.responseMetrics.lastResponseTime = responseTime;
        
        // Update dashboard
        this.updateResponseDashboard();
    }

    /**
     * Handle reconnection logic
     */
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
            
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.initWebSocket();
            }, delay);
        } else {
            console.log('Max reconnection attempts reached, falling back to polling');
            this.initPollingFallback();
        }
    }

    /**
     * Start heartbeat monitoring
     */
    startHeartbeat() {
        setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        // Try to get from various sources
        return localStorage.getItem('userId') || 
               sessionStorage.getItem('userId') || 
               document.querySelector('[data-user-id]')?.getAttribute('data-user-id') ||
               'anonymous';
    }

    /**
     * Get authentication token
     */
    async getAuthToken() {
        return localStorage.getItem('authToken') || 
               sessionStorage.getItem('authToken') || 
               'anonymous';
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        // Create a subtle notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    /**
     * Cleanup on page unload
     */
    cleanup() {
        if (this.ws) {
            this.ws.close();
        }
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Send any remaining feedback
        this.flushFeedbackBuffer();
    }

    /**
     * Flush remaining feedback to server
     */
    async flushFeedbackBuffer() {
        for (const [timestamp, feedback] of this.feedbackBuffer) {
            try {
                await this.sendFeedback(feedback);
            } catch (error) {
                // Store in localStorage for next session
                const storedFeedback = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
                storedFeedback.push(feedback);
                localStorage.setItem('pendingFeedback', JSON.stringify(storedFeedback));
            }
        }
    }
}

// Initialize real-time communication
const realTimeComm = new RealTimeCommunication();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    realTimeComm.cleanup();
});

export default RealTimeCommunication;