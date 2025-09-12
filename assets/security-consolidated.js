/**
 * GuideSignal Consolidated Security Module
 * Combines all security functionality into a single optimized module
 */

class GuideSignalSecurity {
    constructor() {
        this.isInitialized = false;
        this.securityLevel = 'high';
        this.rateLimiters = new Map();
        this.threatDetector = new ThreatDetector();
        this.configManager = new ConfigManager();
        
        this.config = {
            maxRequestsPerMinute: 60,
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            enableCSPReporting: true,
            enableThreatDetection: true
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            await Promise.all([
                this.setupCSP(),
                this.setupHTTPS(),
                this.initializeRateLimiting(),
                this.threatDetector.initialize(),
                this.configManager.initialize()
            ]);

            this.setupEventListeners();
            this.startSecurityMonitoring();
            
            this.isInitialized = true;
            
            return { success: true, message: 'Security initialized successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Content Security Policy Implementation
    setupCSP() {
        const cspDirectives = {
            'default-src': "'self'",
            'script-src': "'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com",
            'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
            'font-src': "'self' https://fonts.gstatic.com",
            'img-src': "'self' data: https:",
            'connect-src': "'self' https://api.guidesignal.com wss://api.guidesignal.com",
            'frame-src': "'none'",
            'object-src': "'none'",
            'base-uri': "'self'",
            'form-action': "'self'",
            'upgrade-insecure-requests': true
        };

        if (this.config.enableCSPReporting) {
            cspDirectives['report-uri'] = '/api/csp-report';
        }

        const cspString = Object.entries(cspDirectives)
            .map(([directive, value]) => 
                typeof value === 'boolean' ? directive : `${directive} ${value}`
            )
            .join('; ');

        // Set CSP via meta tag if not set by server
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const meta = document.createElement('meta');
            meta.setAttribute('http-equiv', 'Content-Security-Policy');
            meta.setAttribute('content', cspString);
            document.head.appendChild(meta);
        }
    }

    // HTTPS Enforcement
    setupHTTPS() {
        // Force HTTPS redirect
        if (location.protocol !== 'https:' && 
            !['localhost', '127.0.0.1'].includes(location.hostname)) {
            
            const httpsUrl = location.href.replace('http:', 'https:');
            location.replace(httpsUrl);
            return;
        }

        // Set HSTS header via meta tag
        const hstsTag = document.createElement('meta');
        hstsTag.setAttribute('http-equiv', 'Strict-Transport-Security');
        hstsTag.setAttribute('content', 'max-age=31536000; includeSubDomains; preload');
        document.head.appendChild(hstsTag);

        // Secure cookie settings
        if (document.cookie) {
            this.secureExistingCookies();
        }
    }

    // Rate Limiting Implementation
    initializeRateLimiting() {
        this.rateLimiters.set('global', new RateLimiter(this.config.maxRequestsPerMinute, 60000));
        this.rateLimiters.set('login', new RateLimiter(this.config.maxLoginAttempts, this.config.lockoutDuration));
        this.rateLimiters.set('api', new RateLimiter(100, 60000)); // 100 requests per minute for API calls
    }

    // Check rate limits
    checkRateLimit(type, identifier = 'global') {
        const rateLimiter = this.rateLimiters.get(type);
        if (!rateLimiter) return true;

        const key = `${type}-${identifier}`;
        return rateLimiter.isAllowed(key);
    }

    // Input Sanitization
    sanitizeInput(input, type = 'text') {
        if (typeof input !== 'string') {
            input = String(input);
        }

        switch (type) {
            case 'html':
                return this.sanitizeHTML(input);
            case 'sql':
                return this.sanitizeSQL(input);
            case 'email':
                return this.sanitizeEmail(input);
            case 'url':
                return this.sanitizeURL(input);
            default:
                return this.sanitizeText(input);
        }
    }

    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    sanitizeSQL(input) {
        // Basic SQL injection prevention
        return input.replace(/['";\\]/g, '');
    }

    sanitizeEmail(email) {
        // Basic email sanitization
        return email.replace(/[<>'"]/g, '').trim().toLowerCase();
    }

    sanitizeURL(url) {
        try {
            const parsed = new URL(url);
            // Only allow https and http protocols
            if (!['https:', 'http:'].includes(parsed.protocol)) {
                return '';
            }
            return parsed.toString();
        } catch {
            return '';
        }
    }

    sanitizeText(text) {
        return text.replace(/[<>'"&]/g, (match) => {
            const entityMap = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
            };
            return entityMap[match];
        });
    }

    // Form Protection
    protectForm(formElement) {
        if (!formElement || formElement.hasAttribute('data-protected')) {
            return;
        }

        // Add CSRF token
        const csrfToken = this.generateCSRFToken();
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        csrfInput.value = csrfToken;
        formElement.appendChild(csrfInput);

        // Add form validation
        formElement.addEventListener('submit', (event) => {
            if (!this.validateForm(formElement)) {
                event.preventDefault();
                return false;
            }

            // Check rate limiting for form submissions
            if (!this.checkRateLimit('global', this.getClientId())) {
                event.preventDefault();
                this.showSecurityMessage('Too many requests. Please wait before submitting again.');
                return false;
            }
        });

        // Protect against rapid submissions
        let lastSubmitTime = 0;
        formElement.addEventListener('submit', (event) => {
            const now = Date.now();
            if (now - lastSubmitTime < 1000) { // Minimum 1 second between submissions
                event.preventDefault();
                return false;
            }
            lastSubmitTime = now;
        });

        formElement.setAttribute('data-protected', 'true');
    }

    // CSRF Token Management
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    validateCSRFToken(token) {
        const sessionToken = sessionStorage.getItem('csrf_token');
        return token === sessionToken;
    }

    // Form Validation
    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            if (input.required && !input.value.trim()) {
                isValid = false;
                this.markFieldInvalid(input, 'This field is required');
            } else if (input.type === 'email' && input.value && !this.isValidEmail(input.value)) {
                isValid = false;
                this.markFieldInvalid(input, 'Please enter a valid email address');
            } else if (input.type === 'url' && input.value && !this.isValidURL(input.value)) {
                isValid = false;
                this.markFieldInvalid(input, 'Please enter a valid URL');
            } else {
                this.markFieldValid(input);
            }
        });

        return isValid;
    }

    markFieldInvalid(field, message) {
        field.classList.add('security-invalid');
        field.setAttribute('aria-invalid', 'true');
        
        let errorElement = field.parentNode.querySelector('.security-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'security-error';
            errorElement.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    markFieldValid(field) {
        field.classList.remove('security-invalid');
        field.setAttribute('aria-invalid', 'false');
        
        const errorElement = field.parentNode.querySelector('.security-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Session Management
    initializeSession() {
        const sessionId = this.generateSessionId();
        sessionStorage.setItem('session_id', sessionId);
        sessionStorage.setItem('session_start', Date.now().toString());
        
        // Set session timeout
        setTimeout(() => {
            this.expireSession();
        }, this.config.sessionTimeout);
    }

    generateSessionId() {
        return crypto.randomUUID ? crypto.randomUUID() : this.generateCSRFToken();
    }

    expireSession() {
        sessionStorage.clear();
        localStorage.removeItem('rememberEmail'); // Clear remember me
        
        if (window.location.pathname !== '/auth.html') {
            this.showSecurityMessage('Your session has expired. Please sign in again.');
            setTimeout(() => {
                window.location.href = '/auth.html?expired=true';
            }, 2000);
        }
    }

    // Security Event Listeners
    setupEventListeners() {
        // Detect developer tools
        let devtools = false;
        setInterval(() => {
            if (!devtools && (window.outerHeight - window.innerHeight > 200 || 
                               window.outerWidth - window.innerWidth > 200)) {
                devtools = true;
                this.threatDetector.logSecurityEvent('devtools_opened', {
                    timestamp: Date.now(),
                    url: window.location.href
                });
            }
        }, 1000);

        // Detect right-click context menu
        document.addEventListener('contextmenu', (event) => {
            if (this.securityLevel === 'high') {
                event.preventDefault();
                this.threatDetector.logSecurityEvent('context_menu_blocked', {
                    element: event.target.tagName,
                    timestamp: Date.now()
                });
            }
        });

        // Detect key combinations
        document.addEventListener('keydown', (event) => {
            const blockedCombinations = [
                { key: 'F12' }, // Developer tools
                { key: 'I', ctrlKey: true, shiftKey: true }, // Inspect element
                { key: 'C', ctrlKey: true, shiftKey: true }, // Console
                { key: 'J', ctrlKey: true, shiftKey: true }, // Console
                { key: 'U', ctrlKey: true } // View source
            ];

            const isBlocked = blockedCombinations.some(combo => {
                return Object.keys(combo).every(key => 
                    key === 'key' ? event.code === combo[key] || event.key === combo[key] : 
                    event[key] === combo[key]
                );
            });

            if (isBlocked && this.securityLevel === 'high') {
                event.preventDefault();
                this.threatDetector.logSecurityEvent('blocked_key_combination', {
                    key: event.key,
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    timestamp: Date.now()
                });
            }
        });

        // Monitor for unusual activity
        let clickCount = 0;
        document.addEventListener('click', () => {
            clickCount++;
            if (clickCount > 100) { // Unusual number of clicks
                this.threatDetector.logSecurityEvent('suspicious_activity', {
                    type: 'excessive_clicks',
                    count: clickCount,
                    timestamp: Date.now()
                });
            }
        });

        // Reset click counter every minute
        setInterval(() => { clickCount = 0; }, 60000);
    }

    // Security Monitoring
    startSecurityMonitoring() {
        // Monitor for mixed content
        if (location.protocol === 'https:') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            this.checkForMixedContent(node);
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        // Monitor performance for potential attacks
        if ('PerformanceObserver' in window) {
            const perfObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.duration > 5000) { // Unusually slow operation
                        this.threatDetector.logSecurityEvent('performance_anomaly', {
                            name: entry.name,
                            duration: entry.duration,
                            timestamp: Date.now()
                        });
                    }
                });
            });

            perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
        }
    }

    // Mixed Content Detection
    checkForMixedContent(element) {
        const attributes = ['src', 'href', 'action'];
        
        attributes.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value && value.startsWith('http://')) {
                this.threatDetector.logSecurityEvent('mixed_content_detected', {
                    element: element.tagName,
                    attribute: attr,
                    url: value,
                    timestamp: Date.now()
                });

                // Attempt to fix by upgrading to HTTPS
                element.setAttribute(attr, value.replace('http://', 'https://'));
            }
        });
    }

    // Utility Methods
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    getClientId() {
        let clientId = localStorage.getItem('client_id');
        if (!clientId) {
            clientId = this.generateSessionId();
            localStorage.setItem('client_id', clientId);
        }
        return clientId;
    }

    secureExistingCookies() {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const [name] = cookie.split('=');
            if (name && !cookie.includes('Secure') && location.protocol === 'https:') {
                // Note: Can't modify existing cookies from JavaScript
                // This should be handled server-side
            }
        });
    }

    showSecurityMessage(message, type = 'warning') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `security-message security-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#fee' : '#fff3cd'};
            color: ${type === 'error' ? '#721c24' : '#856404'};
            padding: 12px 16px;
            border: 1px solid ${type === 'error' ? '#f5c6cb' : '#ffeaa7'};
            border-radius: 4px;
            z-index: 10000;
            max-width: 300px;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    // Public API
    protect(options = {}) {
        this.config = { ...this.config, ...options };
        return this.initialize();
    }

    sanitize(input, type) {
        return this.sanitizeInput(input, type);
    }

    validateCSRF(token) {
        return this.validateCSRFToken(token);
    }

    checkRate(type, identifier) {
        return this.checkRateLimit(type, identifier);
    }
}

// Rate Limiter Class
class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    isAllowed(key) {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];
        
        // Remove old requests outside the time window
        const validRequests = userRequests.filter(time => now - time < this.windowMs);
        
        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        // Add current request
        validRequests.push(now);
        this.requests.set(key, validRequests);
        
        return true;
    }

    reset(key) {
        this.requests.delete(key);
    }
}

// Threat Detection Class
class ThreatDetector {
    constructor() {
        this.threats = [];
        this.isInitialized = false;
        this.maxThreatHistory = 1000;
    }

    async initialize() {
        this.isInitialized = true;
        this.setupThreatPatterns();
    }

    setupThreatPatterns() {
        this.patterns = [
            {
                name: 'SQL_INJECTION',
                regex: /(\b(union|select|drop|delete|insert|update|exec)\b)|['";\-\-]/gi
            },
            {
                name: 'XSS_ATTEMPT',
                regex: /<script|javascript:|onload=|onerror=/gi
            },
            {
                name: 'PATH_TRAVERSAL',
                regex: /\.\.[/\\]/g
            }
        ];
    }

    detectThreats(input) {
        const threats = [];
        
        this.patterns.forEach(pattern => {
            if (pattern.regex.test(input)) {
                threats.push({
                    type: pattern.name,
                    input: input.substring(0, 100), // First 100 chars
                    timestamp: Date.now()
                });
            }
        });

        return threats;
    }

    logSecurityEvent(type, details) {
        const event = {
            type,
            details,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer
        };

        this.threats.push(event);

        // Keep only recent threats
        if (this.threats.length > this.maxThreatHistory) {
            this.threats = this.threats.slice(-this.maxThreatHistory);
        }

        // In production, send to security monitoring service
        if (typeof this.onSecurityEvent === 'function') {
            this.onSecurityEvent(event);
        }
    }

    getThreatSummary() {
        const summary = {};
        this.threats.forEach(threat => {
            summary[threat.type] = (summary[threat.type] || 0) + 1;
        });
        return summary;
    }
}

// Configuration Manager Class
class ConfigManager {
    constructor() {
        this.config = {};
        this.encrypted = false;
    }

    async initialize() {
        await this.loadConfig();
    }

    async loadConfig() {
        try {
            const response = await fetch('/config/security.json');
            if (response.ok) {
                this.config = await response.json();
            }
        } catch (error) {
            // Use default configuration
            this.config = {
                enableAdvancedProtection: true,
                enableThreatDetection: true,
                enableRateLimit: true
            };
        }
    }

    get(key, defaultValue = null) {
        return this.config[key] || defaultValue;
    }

    set(key, value) {
        this.config[key] = value;
    }
}

// Initialize and export
const guidesignalSecurity = new GuideSignalSecurity();

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        guidesignalSecurity.protect();
        
        // Auto-protect all forms
        document.querySelectorAll('form').forEach(form => {
            guidesignalSecurity.protectForm(form);
        });
    });
} else {
    guidesignalSecurity.protect();
    document.querySelectorAll('form').forEach(form => {
        guidesignalSecurity.protectForm(form);
    });
}

// Export for use in other modules
export default guidesignalSecurity;
export { GuideSignalSecurity, RateLimiter, ThreatDetector, ConfigManager };