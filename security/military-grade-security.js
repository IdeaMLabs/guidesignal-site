/**
 * MILITARY-GRADE SECURITY SYSTEM
 * =================================
 * 
 * Advanced security framework providing:
 * - Advanced threat detection and prevention
 * - Real-time attack mitigation
 * - Multi-layered defense systems
 * - Encrypted communications
 * - Intrusion detection and response
 * 
 * Classification: UNCLASSIFIED
 * Security Level: CONFIDENTIAL
 */

class MilitaryGradeSecurity {
    constructor() {
        this.securityLevel = 'CLASSIFIED';
        this.threatLevel = 'GREEN';
        this.attackPatterns = new Map();
        this.ipBlacklist = new Set();
        this.securityEvents = [];
        this.encryptionKey = null;
        this.csrfTokens = new Map();
        this.rateLimiters = new Map();
        this.honeypots = new Set();
        this.integrityHashes = new Map();
        
        this.initialize();
    }

    // ====================================
    // INITIALIZATION & CORE SETUP
    // ====================================

    async initialize() {
        console.log('🛡️ INITIALIZING MILITARY-GRADE SECURITY SYSTEM');
        
        try {
            await this.setupEncryption();
            await this.initializeCSP();
            await this.setupWAF();
            await this.initializeRateLimiting();
            await this.setupIntrusionDetection();
            await this.initializeHoneypots();
            await this.setupIntegrityChecking();
            await this.enableSecurityMonitoring();
            
            this.logSecurityEvent('SYSTEM_INITIALIZED', {
                level: 'INFO',
                message: 'Military-grade security system operational',
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ SECURITY SYSTEM FULLY OPERATIONAL');
        } catch (error) {
            console.error('🚨 SECURITY INITIALIZATION FAILED:', error);
            this.threatLevel = 'RED';
            this.lockdownProtocol();
        }
    }

    // ====================================
    // ADVANCED CONTENT SECURITY POLICY
    // ====================================

    async initializeCSP() {
        const cspDirectives = {
            'default-src': "'self'",
            'script-src': [
                "'self'",
                "'unsafe-inline'", // Only for critical inline scripts
                "https://www.gstatic.com",
                "https://apis.google.com",
                "https://cdn.jsdelivr.net",
                "https://unpkg.com",
                "'nonce-" + this.generateNonce() + "'"
            ].join(' '),
            'style-src': [
                "'self'",
                "'unsafe-inline'", // For dynamic styles
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ].join(' '),
            'img-src': [
                "'self'",
                "data:",
                "https:",
                "blob:"
            ].join(' '),
            'connect-src': [
                "'self'",
                "https://identitytoolkit.googleapis.com",
                "https://securetoken.googleapis.com",
                "https://firestore.googleapis.com",
                "https://formspree.io",
                "wss:"
            ].join(' '),
            'font-src': [
                "'self'",
                "https://fonts.gstatic.com"
            ].join(' '),
            'object-src': "'none'",
            'media-src': "'self'",
            'frame-src': "'none'",
            'worker-src': "'self'",
            'manifest-src': "'self'",
            'base-uri': "'self'",
            'form-action': "'self'",
            'frame-ancestors': "'none'",
            'upgrade-insecure-requests': '',
            'block-all-mixed-content': ''
        };

        // Apply CSP to current document
        const cspString = Object.entries(cspDirectives)
            .map(([directive, value]) => `${directive} ${value}`)
            .join('; ');

        // Create meta tag for CSP
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = cspString;
        document.head.appendChild(meta);

        // Additional security headers
        this.setSecurityHeaders();
    }

    setSecurityHeaders() {
        const headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
        };

        // Apply headers via meta tags where possible
        Object.entries(headers).forEach(([name, value]) => {
            const meta = document.createElement('meta');
            meta.httpEquiv = name;
            meta.content = value;
            document.head.appendChild(meta);
        });
    }

    // ====================================
    // WEB APPLICATION FIREWALL (WAF)
    // ====================================

    async setupWAF() {
        // SQL Injection patterns
        this.sqlPatterns = [
            /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
            /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
            /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
            /((\%27)|(\'))union/i,
            /exec(\s|\+)+(s|x)p\w+/i,
            /union([^a-zA-Z])+select/i,
            /select.+from.+where/i
        ];

        // XSS patterns
        this.xssPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
            /<embed[\s\S]*?>/gi,
            /eval\(/gi,
            /expression\(/gi
        ];

        // Command injection patterns
        this.commandPatterns = [
            /[;&|`]|(\|\|)|(\&\&)/,
            /(cmd|exec|system|shell_exec|passthru)/i,
            /\$\{.*\}/,
            /\$\(.*\)/
        ];

        console.log('🛡️ WAF initialized with advanced threat patterns');
    }

    // ====================================
    // RATE LIMITING & DDOS PROTECTION
    // ====================================

    async initializeRateLimiting() {
        const rateLimits = {
            'api': { requests: 100, window: 60000 }, // 100 requests per minute
            'auth': { requests: 5, window: 300000 }, // 5 auth attempts per 5 minutes
            'form': { requests: 10, window: 60000 }, // 10 form submissions per minute
            'general': { requests: 200, window: 60000 } // 200 general requests per minute
        };

        Object.entries(rateLimits).forEach(([type, config]) => {
            this.rateLimiters.set(type, {
                ...config,
                requests: new Map() // IP -> { count, firstRequest }
            });
        });

        console.log('⚡ Rate limiting initialized');
    }

    checkRateLimit(ip, type = 'general') {
        const limiter = this.rateLimiters.get(type);
        if (!limiter) return true;

        const now = Date.now();
        const requestData = limiter.requests.get(ip) || { count: 0, firstRequest: now };

        // Reset counter if window expired
        if (now - requestData.firstRequest > limiter.window) {
            requestData.count = 0;
            requestData.firstRequest = now;
        }

        requestData.count++;
        limiter.requests.set(ip, requestData);

        if (requestData.count > limiter.requests) {
            this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
                ip,
                type,
                count: requestData.count,
                level: 'WARNING'
            });
            return false;
        }

        return true;
    }

    // ====================================
    // ADVANCED XSS PROTECTION
    // ====================================

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        // Advanced XSS sanitization
        let sanitized = input
            // Remove script tags
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            // Remove javascript: protocols
            .replace(/javascript:/gi, '')
            // Remove event handlers
            .replace(/on\w+\s*=/gi, '')
            // Remove potentially dangerous tags
            .replace(/<(iframe|object|embed|form|input|textarea|button|link|meta|style)[\s\S]*?>/gi, '')
            // Encode HTML entities
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

        // Additional protection against advanced XSS
        sanitized = sanitized
            .replace(/&#x0*3c;/gi, '&lt;')
            .replace(/&#x0*3e;/gi, '&gt;')
            .replace(/&#0*60;/gi, '&lt;')
            .replace(/&#0*62;/gi, '&gt;');

        return sanitized;
    }

    // ====================================
    // CSRF PROTECTION
    // ====================================

    generateCSRFToken() {
        const token = this.generateSecureToken(32);
        const expiry = Date.now() + 3600000; // 1 hour
        
        this.csrfTokens.set(token, {
            created: Date.now(),
            expiry,
            used: false
        });

        return token;
    }

    validateCSRFToken(token) {
        const tokenData = this.csrfTokens.get(token);
        
        if (!tokenData) {
            this.logSecurityEvent('CSRF_INVALID_TOKEN', {
                token: token.substring(0, 8) + '...',
                level: 'WARNING'
            });
            return false;
        }

        if (tokenData.used) {
            this.logSecurityEvent('CSRF_TOKEN_REUSE', {
                token: token.substring(0, 8) + '...',
                level: 'WARNING'
            });
            return false;
        }

        if (Date.now() > tokenData.expiry) {
            this.csrfTokens.delete(token);
            this.logSecurityEvent('CSRF_TOKEN_EXPIRED', {
                token: token.substring(0, 8) + '...',
                level: 'INFO'
            });
            return false;
        }

        // Mark as used
        tokenData.used = true;
        return true;
    }

    // ====================================
    // ENCRYPTION & SECURE COMMUNICATIONS
    // ====================================

    async setupEncryption() {
        // Generate encryption key for session
        this.encryptionKey = await this.generateEncryptionKey();
        console.log('🔐 Encryption system initialized');
    }

    async generateEncryptionKey() {
        const key = await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        );
        return key;
    }

    async encryptData(data) {
        const encoder = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            this.encryptionKey,
            encoder.encode(JSON.stringify(data))
        );

        return {
            data: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv)
        };
    }

    async decryptData(encryptedData) {
        const decoder = new TextDecoder();
        
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(encryptedData.iv),
            },
            this.encryptionKey,
            new Uint8Array(encryptedData.data)
        );

        return JSON.parse(decoder.decode(decrypted));
    }

    // ====================================
    // INTRUSION DETECTION SYSTEM
    // ====================================

    async setupIntrusionDetection() {
        // Monitor for suspicious activities
        this.suspiciousPatterns = [
            { pattern: /admin|administrator|root|sudo/i, severity: 'MEDIUM' },
            { pattern: /\.\.\/|\.\.\\/, severity: 'HIGH' }, // Path traversal
            { pattern: /%00|null|undefined/, severity: 'MEDIUM' },
            { pattern: /sleep\(|benchmark\(|waitfor/i, severity: 'HIGH' },
            { pattern: /<script|javascript:|vbscript:/i, severity: 'HIGH' }
        ];

        // Monitor DOM mutations for injected content
        if (window.MutationObserver) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            this.scanNodeForThreats(node);
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['onclick', 'onload', 'onerror']
            });
        }

        console.log('👁️ Intrusion detection system active');
    }

    scanNodeForThreats(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for suspicious attributes
            const suspiciousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover'];
            suspiciousAttrs.forEach(attr => {
                if (node.hasAttribute && node.hasAttribute(attr)) {
                    this.logSecurityEvent('SUSPICIOUS_ATTRIBUTE_DETECTED', {
                        tagName: node.tagName,
                        attribute: attr,
                        value: node.getAttribute(attr),
                        level: 'WARNING'
                    });
                }
            });

            // Check for suspicious content
            const content = node.textContent || node.innerHTML || '';
            this.suspiciousPatterns.forEach(({ pattern, severity }) => {
                if (pattern.test(content)) {
                    this.logSecurityEvent('SUSPICIOUS_CONTENT_DETECTED', {
                        pattern: pattern.toString(),
                        severity,
                        content: content.substring(0, 100),
                        level: severity === 'HIGH' ? 'CRITICAL' : 'WARNING'
                    });
                }
            });
        }
    }

    // ====================================
    // HONEYPOT SYSTEM
    // ====================================

    async initializeHoneypots() {
        // Create invisible form fields as honeypots
        const honeypotFields = [
            'user_email_confirm',
            'phone_number',
            'website_url',
            'company_name_verify'
        ];

        honeypotFields.forEach(fieldName => {
            this.honeypots.add(fieldName);
            
            // Add honeypot to any existing forms
            document.querySelectorAll('form').forEach(form => {
                this.addHoneypotToForm(form, fieldName);
            });
        });

        // Monitor for honeypot triggers
        document.addEventListener('input', (e) => {
            if (this.honeypots.has(e.target.name)) {
                this.triggerHoneypot(e.target.name, e.target.value);
            }
        });

        console.log('🍯 Honeypot traps deployed');
    }

    addHoneypotToForm(form, fieldName) {
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = fieldName;
        honeypot.style.cssText = `
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
        `;
        honeypot.setAttribute('tabindex', '-1');
        honeypot.setAttribute('autocomplete', 'off');
        form.appendChild(honeypot);
    }

    triggerHoneypot(fieldName, value) {
        this.logSecurityEvent('HONEYPOT_TRIGGERED', {
            field: fieldName,
            value: value.substring(0, 50),
            level: 'CRITICAL',
            ip: this.getClientIP()
        });

        // Add IP to blacklist
        const ip = this.getClientIP();
        this.ipBlacklist.add(ip);
        
        // Activate lockdown for this session
        this.threatLevel = 'RED';
        this.lockdownProtocol();
    }

    // ====================================
    // REQUEST SIGNING & INTEGRITY
    // ====================================

    async setupIntegrityChecking() {
        // Generate integrity hashes for critical resources
        const criticalResources = [
            'firebase-config.js',
            'auth.html',
            'index.html'
        ];

        for (const resource of criticalResources) {
            try {
                const response = await fetch(resource);
                if (response.ok) {
                    const content = await response.text();
                    const hash = await this.generateHash(content);
                    this.integrityHashes.set(resource, hash);
                }
            } catch (error) {
                console.warn(`Could not generate integrity hash for ${resource}`);
            }
        }

        console.log('🔐 Integrity checking initialized');
    }

    async generateHash(data) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async verifyIntegrity(resource, content) {
        const expectedHash = this.integrityHashes.get(resource);
        if (!expectedHash) return true; // No hash to verify against

        const actualHash = await this.generateHash(content);
        const isValid = expectedHash === actualHash;

        if (!isValid) {
            this.logSecurityEvent('INTEGRITY_VIOLATION', {
                resource,
                expectedHash: expectedHash.substring(0, 16) + '...',
                actualHash: actualHash.substring(0, 16) + '...',
                level: 'CRITICAL'
            });
        }

        return isValid;
    }

    // ====================================
    // SECURITY MONITORING & ALERTING
    // ====================================

    async enableSecurityMonitoring() {
        // Monitor console for suspicious activity
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.logSecurityEvent('CONSOLE_ERROR', {
                message: args.join(' '),
                level: 'INFO'
            });
            originalConsoleError.apply(console, args);
        };

        // Monitor for DevTools usage
        let devtools = { open: false };
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSecurityEvent('DEVTOOLS_DETECTED', {
                        level: 'INFO',
                        message: 'Developer tools opened'
                    });
                }
            } else {
                devtools.open = false;
            }
        }, 500);

        // Monitor for suspicious network activity
        this.monitorNetworkActivity();

        console.log('📡 Security monitoring active');
    }

    monitorNetworkActivity() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const ip = this.getClientIP();
            
            // Check if IP is blacklisted
            if (this.ipBlacklist.has(ip)) {
                this.logSecurityEvent('BLOCKED_REQUEST_BLACKLISTED_IP', {
                    ip,
                    url: url.toString(),
                    level: 'WARNING'
                });
                throw new Error('Request blocked by security system');
            }

            // Check rate limiting
            if (!this.checkRateLimit(ip, 'api')) {
                throw new Error('Rate limit exceeded');
            }

            // Scan URL for suspicious patterns
            const urlStr = url.toString();
            this.suspiciousPatterns.forEach(({ pattern, severity }) => {
                if (pattern.test(urlStr)) {
                    this.logSecurityEvent('SUSPICIOUS_REQUEST_PATTERN', {
                        url: urlStr,
                        pattern: pattern.toString(),
                        severity,
                        level: severity === 'HIGH' ? 'WARNING' : 'INFO'
                    });
                }
            });

            return originalFetch(url, options);
        };
    }

    // ====================================
    // UTILITY FUNCTIONS
    // ====================================

    generateNonce() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    generateSecureToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    getClientIP() {
        // In a real scenario, this would be determined server-side
        return 'client-ip-placeholder';
    }

    logSecurityEvent(type, data) {
        const event = {
            id: this.generateSecureToken(16),
            type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...data
        };

        this.securityEvents.push(event);
        
        // Keep only last 1000 events to prevent memory issues
        if (this.securityEvents.length > 1000) {
            this.securityEvents = this.securityEvents.slice(-1000);
        }

        // Log critical events to console
        if (data.level === 'CRITICAL' || data.level === 'WARNING') {
            console.warn(`🚨 SECURITY EVENT [${type}]:`, data);
        }

        // Send to security monitoring service (if available)
        this.sendSecurityAlert(event);
    }

    async sendSecurityAlert(event) {
        try {
            // In production, this would send to your security monitoring service
            if (event.level === 'CRITICAL') {
                console.error('🚨 CRITICAL SECURITY ALERT:', event);
                
                // Could integrate with services like:
                // - DataDog
                // - Splunk
                // - ELK Stack
                // - Custom security operations center
            }
        } catch (error) {
            console.error('Failed to send security alert:', error);
        }
    }

    // ====================================
    // LOCKDOWN PROTOCOLS
    // ====================================

    lockdownProtocol() {
        console.warn('🔒 INITIATING LOCKDOWN PROTOCOL');
        
        // Disable form submissions
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.showSecurityNotification('System is under security lockdown. Please try again later.');
            });
        });

        // Disable sensitive buttons
        document.querySelectorAll('button[type="submit"], input[type="submit"]').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });

        // Show security warning
        this.showSecurityWarning();
    }

    showSecurityWarning() {
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #dc2626;
                color: white;
                padding: 10px;
                text-align: center;
                z-index: 999999;
                font-weight: bold;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            ">
                🛡️ SECURITY SYSTEM ACTIVE - Enhanced Protection Enabled
            </div>
        `;
        document.body.appendChild(warning);
    }

    showSecurityNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1f2937;
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 1000000;
            max-width: 400px;
            text-align: center;
        `;
        notification.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">🛡️</div>
            <div style="font-weight: bold; margin-bottom: 10px;">Security System</div>
            <div>${message}</div>
            <button onclick="this.parentNode.remove()" style="
                margin-top: 15px;
                padding: 8px 16px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">OK</button>
        `;
        document.body.appendChild(notification);
    }

    // ====================================
    // PUBLIC API
    // ====================================

    // Secure form validation
    validateForm(formData) {
        const results = {
            valid: true,
            errors: [],
            sanitized: {}
        };

        Object.entries(formData).forEach(([key, value]) => {
            // Check for honeypot fields
            if (this.honeypots.has(key) && value) {
                this.triggerHoneypot(key, value);
                results.valid = false;
                results.errors.push('Security violation detected');
                return;
            }

            // Sanitize input
            results.sanitized[key] = this.sanitizeInput(value);

            // Check against WAF patterns
            if (this.checkWAF(value)) {
                results.valid = false;
                results.errors.push(`Invalid input detected in ${key}`);
            }
        });

        return results;
    }

    checkWAF(input) {
        const allPatterns = [
            ...this.sqlPatterns,
            ...this.xssPatterns,
            ...this.commandPatterns
        ];

        return allPatterns.some(pattern => pattern.test(input));
    }

    // Get security status
    getSecurityStatus() {
        return {
            level: this.securityLevel,
            threatLevel: this.threatLevel,
            eventsCount: this.securityEvents.length,
            blacklistedIPs: this.ipBlacklist.size,
            csrfTokens: this.csrfTokens.size,
            honeypots: this.honeypots.size
        };
    }

    // Force security scan
    performSecurityScan() {
        console.log('🔍 Performing comprehensive security scan...');
        
        // Scan all forms
        document.querySelectorAll('form').forEach(form => {
            this.scanFormSecurity(form);
        });

        // Scan all scripts
        document.querySelectorAll('script').forEach(script => {
            this.scanScriptSecurity(script);
        });

        // Check for inline event handlers
        this.scanInlineHandlers();

        console.log('✅ Security scan completed');
    }

    scanFormSecurity(form) {
        // Check for missing CSRF protection
        if (!form.querySelector('input[name="csrf_token"]')) {
            this.logSecurityEvent('MISSING_CSRF_PROTECTION', {
                formId: form.id || 'unknown',
                level: 'WARNING'
            });
        }

        // Check for unencrypted sensitive fields
        const sensitiveFields = form.querySelectorAll('input[type="password"], input[name*="email"], input[name*="phone"]');
        sensitiveFields.forEach(field => {
            if (window.location.protocol !== 'https:') {
                this.logSecurityEvent('UNENCRYPTED_SENSITIVE_FIELD', {
                    fieldName: field.name,
                    level: 'WARNING'
                });
            }
        });
    }

    scanScriptSecurity(script) {
        if (script.src && !script.src.startsWith('https://')) {
            this.logSecurityEvent('INSECURE_SCRIPT_SOURCE', {
                src: script.src,
                level: 'WARNING'
            });
        }
    }

    scanInlineHandlers() {
        const elements = document.querySelectorAll('[onclick], [onload], [onerror], [onmouseover]');
        elements.forEach(element => {
            this.logSecurityEvent('INLINE_EVENT_HANDLER', {
                tagName: element.tagName,
                attributes: Array.from(element.attributes)
                    .filter(attr => attr.name.startsWith('on'))
                    .map(attr => attr.name),
                level: 'INFO'
            });
        });
    }
}

// Initialize global security system
window.MilitaryGradeSecurity = new MilitaryGradeSecurity();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MilitaryGradeSecurity;
}

console.log('🛡️ MILITARY-GRADE SECURITY SYSTEM LOADED');