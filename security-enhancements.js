// Security Enhancements and Certificate Issue Fixes
// Handles HTTPS enforcement, certificate validation, and security headers

class SecurityManager {
    constructor() {
        this.securityConfig = {
            enforceHTTPS: true,
            checkCertificates: true,
            enableHSTS: true,
            enableCSP: true,
            enableXSSProtection: true
        };
        
        this.trustedDomains = [
            'localhost',
            '127.0.0.1',
            'guidesignal.netlify.app',
            'guidesignal.github.io',
            'ideamlabs.github.io',
            'guide-signal.com'
        ];
        
        this.init();
    }

    init() {
        console.log('🔒 Initializing Security Manager...');
        
        this.enforceHTTPS();
        this.validateCertificates();
        this.setSecurityHeaders();
        this.monitorSecurityIssues();
        
        console.log('✅ Security Manager initialized');
    }

    // ==================== HTTPS ENFORCEMENT ====================
    
    enforceHTTPS() {
        if (!this.securityConfig.enforceHTTPS) return;
        
        const isSecure = location.protocol === 'https:';
        const isDevelopment = this.isDevelopmentEnvironment();
        
        if (!isSecure && !isDevelopment) {
            const currentDomain = location.hostname.toLowerCase();
            const isTrustedDomain = this.trustedDomains.some(domain => 
                currentDomain === domain || currentDomain.includes(domain)
            );
            
            if (isTrustedDomain) {
                console.log('🔄 Redirecting to HTTPS...');
                const httpsUrl = `https://${location.host}${location.pathname}${location.search}${location.hash}`;
                
                // Use replace to avoid back button issues
                window.location.replace(httpsUrl);
            } else {
                console.warn('🚨 Untrusted domain detected:', currentDomain);
                this.showSecurityWarning('This site may not be secure. Please verify the URL.');
            }
        }
        
        // Set up HTTPS upgrade headers
        if (isSecure) {
            this.enableHSTS();
        }
    }

    isDevelopmentEnvironment() {
        return location.hostname === 'localhost' ||
               location.hostname === '127.0.0.1' ||
               location.hostname.startsWith('192.168.') ||
               location.hostname.endsWith('.local') ||
               location.port !== '';
    }

    enableHSTS() {
        if (!this.securityConfig.enableHSTS) return;
        
        // HSTS via meta tag (limited effectiveness, but better than nothing)
        const hsts = document.createElement('meta');
        hsts.setAttribute('http-equiv', 'Strict-Transport-Security');
        hsts.setAttribute('content', 'max-age=31536000; includeSubDomains; preload');
        
        if (!document.querySelector('meta[http-equiv="Strict-Transport-Security"]')) {
            document.head.appendChild(hsts);
        }
    }

    // ==================== CERTIFICATE VALIDATION ====================
    
    async validateCertificates() {
        if (!this.securityConfig.checkCertificates) return;
        
        try {
            // Check if we're on HTTPS
            if (location.protocol !== 'https:') {
                console.warn('🔓 Site is not using HTTPS');
                return;
            }
            
            // Basic certificate check by attempting to fetch from self
            const response = await fetch(location.origin + '/favicon.ico', {
                method: 'HEAD',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                console.log('✅ Certificate appears valid');
                this.markCertificateValid();
            } else {
                console.warn('⚠️ Certificate validation inconclusive');
            }
            
        } catch (error) {
            console.error('🚨 Certificate validation failed:', error);
            this.handleCertificateError(error);
        }
    }

    markCertificateValid() {
        // Add visual indicator of secure connection
        const secureIndicator = document.createElement('div');
        secureIndicator.id = 'security-indicator';
        secureIndicator.innerHTML = '🔒';
        secureIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 9999;
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        `;
        
        document.body.appendChild(secureIndicator);
        
        // Show indicator briefly
        setTimeout(() => {
            secureIndicator.style.opacity = '1';
            setTimeout(() => {
                secureIndicator.style.opacity = '0';
                setTimeout(() => secureIndicator.remove(), 300);
            }, 2000);
        }, 500);
    }

    handleCertificateError(error) {
        console.error('Certificate error details:', error);
        
        // Don't show scary warnings in development
        if (this.isDevelopmentEnvironment()) return;
        
        // Show user-friendly warning
        this.showSecurityWarning(
            'There may be an issue with this site\'s security certificate. Please ensure you\'re on the correct website.'
        );
    }

    // ==================== SECURITY HEADERS ====================
    
    setSecurityHeaders() {
        // Content Security Policy
        if (this.securityConfig.enableCSP) {
            this.setContentSecurityPolicy();
        }
        
        // XSS Protection
        if (this.securityConfig.enableXSSProtection) {
            this.setXSSProtection();
        }
        
        // Additional security headers
        this.setAdditionalSecurityHeaders();
    }

    setContentSecurityPolicy() {
        const cspDirectives = [
            "default-src 'self' https:",
            "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com https://identitytoolkit.googleapis.com https://www.google.com https://cdn.emailjs.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://formspree.io https://api.emailjs.com https: wss: data:",
            "media-src 'self' data: blob:",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self' https://formspree.io https://api.emailjs.com"
        ].join('; ');

        const csp = document.createElement('meta');
        csp.setAttribute('http-equiv', 'Content-Security-Policy');
        csp.setAttribute('content', cspDirectives);
        
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            document.head.appendChild(csp);
        }
    }

    setXSSProtection() {
        const xss = document.createElement('meta');
        xss.setAttribute('http-equiv', 'X-XSS-Protection');
        xss.setAttribute('content', '1; mode=block');
        
        if (!document.querySelector('meta[http-equiv="X-XSS-Protection"]')) {
            document.head.appendChild(xss);
        }
    }

    setAdditionalSecurityHeaders() {
        const headers = [
            { name: 'X-Content-Type-Options', content: 'nosniff' },
            { name: 'X-Frame-Options', content: 'DENY' },
            { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
            { name: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=()' }
        ];

        headers.forEach(header => {
            const existing = document.querySelector(`meta[http-equiv="${header.name}"]`);
            if (!existing) {
                const meta = document.createElement('meta');
                meta.setAttribute('http-equiv', header.name);
                meta.setAttribute('content', header.content);
                document.head.appendChild(meta);
            }
        });
    }

    // ==================== SECURITY MONITORING ====================
    
    monitorSecurityIssues() {
        // Monitor for mixed content warnings
        this.monitorMixedContent();
        
        // Monitor for certificate errors
        this.monitorCertificateErrors();
        
        // Monitor for CSP violations
        this.monitorCSPViolations();
    }

    monitorMixedContent() {
        // Check for mixed content issues
        const resources = performance.getEntriesByType('resource');
        const mixedContent = resources.filter(resource => {
            return location.protocol === 'https:' && 
                   resource.name.startsWith('http://');
        });

        if (mixedContent.length > 0) {
            console.warn('🚨 Mixed content detected:', mixedContent);
            mixedContent.forEach(resource => {
                console.warn(`Mixed content: ${resource.name}`);
            });
        }
    }

    monitorCertificateErrors() {
        // Listen for certificate-related fetch errors
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            try {
                return await originalFetch.apply(this, args);
            } catch (error) {
                if (error.message.includes('certificate') || 
                    error.message.includes('SSL') || 
                    error.message.includes('TLS')) {
                    console.error('🚨 Certificate-related fetch error:', error);
                }
                throw error;
            }
        };
    }

    monitorCSPViolations() {
        document.addEventListener('securitypolicyviolation', (event) => {
            console.warn('🚨 CSP Violation:', {
                directive: event.violatedDirective,
                blocked: event.blockedURI,
                original: event.originalPolicy
            });
        });
    }

    // ==================== USER INTERFACE ====================
    
    showSecurityWarning(message) {
        // Create non-intrusive security warning
        const warning = document.createElement('div');
        warning.id = 'security-warning';
        warning.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>🔒</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: rgba(255,255,255,0.2); border: none; color: inherit; padding: 4px 8px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
        `;
        
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 12px 16px;
            font-size: 14px;
            z-index: 10001;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        // Remove existing warnings
        const existing = document.getElementById('security-warning');
        if (existing) existing.remove();
        
        document.body.appendChild(warning);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.style.transform = 'translateY(-100%)';
                setTimeout(() => warning.remove(), 300);
            }
        }, 10000);
    }

    // ==================== UTILITY METHODS ====================
    
    checkDomainTrust(domain) {
        return this.trustedDomains.some(trusted => 
            domain === trusted || domain.includes(trusted)
        );
    }

    getSecurityReport() {
        return {
            isHTTPS: location.protocol === 'https:',
            isDevelopment: this.isDevelopmentEnvironment(),
            domain: location.hostname,
            isTrustedDomain: this.checkDomainTrust(location.hostname),
            hasCSP: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
            hasHSTS: !!document.querySelector('meta[http-equiv="Strict-Transport-Security"]'),
            mixedContent: this.checkMixedContent(),
            timestamp: new Date().toISOString()
        };
    }

    checkMixedContent() {
        const resources = performance.getEntriesByType('resource');
        return resources.filter(resource => {
            return location.protocol === 'https:' && resource.name.startsWith('http://');
        }).length;
    }
}

// Initialize Security Manager
document.addEventListener('DOMContentLoaded', () => {
    window.securityManager = new SecurityManager();
});

// Export for manual access
window.getSecurityReport = () => {
    return window.securityManager ? window.securityManager.getSecurityReport() : null;
};

console.log('🔒 Security Enhancement script loaded');