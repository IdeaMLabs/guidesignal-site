// GuideSignal Enhanced HTTPS Security Configuration
// Comprehensive SSL/TLS and secure connections management

class SecurityManager {
    constructor() {
        this.config = {
            enforceHTTPS: true,
            strictTransportSecurity: true,
            allowedDomains: [
                'guide-signal.com',
                'www.guide-signal.com', 
                'guidesignal.netlify.app',
                'guidesignal.github.io',
                'ideamlabs.github.io'
            ],
            developmentDomains: [
                'localhost',
                '127.0.0.1',
                'localhost:3000',
                'localhost:8080'
            ],
            securityHeaders: {
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
            }
        };
        
        this.init();
    }

    init() {
        // Initialize security checks immediately
        this.enforceSecureConnection();
        this.setSecurityHeaders();
        this.monitorMixedContent();
        this.setupServiceWorkerSecurity();
    }

    isDevelopment() {
        const hostname = window.location.hostname.toLowerCase();
        return this.config.developmentDomains.some(domain => {
            return hostname === domain || hostname.startsWith(domain);
        }) || hostname.includes('local') || hostname.startsWith('192.168.');
    }

    isAllowedDomain() {
        const hostname = window.location.hostname.toLowerCase();
        return this.config.allowedDomains.some(domain => {
            return hostname === domain || hostname.includes(domain.replace('www.', ''));
        });
    }

    enforceSecureConnection() {
        // Skip in development
        if (this.isDevelopment()) {
            console.log('🔓 Development mode: HTTPS enforcement disabled');
            return;
        }

        // Redirect www to non-www first
        if (window.location.hostname === 'www.guide-signal.com') {
            const redirectUrl = 'https://guide-signal.com' + 
                               window.location.pathname + 
                               window.location.search + 
                               window.location.hash;
            console.log('🔄 Redirecting www to apex domain:', redirectUrl);
            window.location.replace(redirectUrl);
            return;
        }

        // Enforce HTTPS
        if (window.location.protocol !== 'https:') {
            if (this.isAllowedDomain()) {
                const httpsUrl = 'https://' + window.location.hostname + 
                               window.location.pathname + 
                               window.location.search + 
                               window.location.hash;
                
                console.log('🔐 Enforcing HTTPS:', httpsUrl);
                window.location.replace(httpsUrl);
            } else {
                console.error('🚫 Unauthorized domain detected:', window.location.hostname);
                this.showSecurityWarning('This domain is not authorized for secure access.');
            }
        }
    }

    setSecurityHeaders() {
        // Set security headers via meta tags for enhanced protection
        Object.entries(this.config.securityHeaders).forEach(([header, value]) => {
            // Check if header already exists
            let existingMeta = document.querySelector(`meta[http-equiv="${header}"]`);
            
            if (!existingMeta) {
                const meta = document.createElement('meta');
                meta.setAttribute('http-equiv', header);
                meta.setAttribute('content', value);
                document.head.appendChild(meta);
                console.log(`🛡️ Security header set: ${header}`);
            }
        });

        // Enhanced CSP for mixed content protection
        this.setContentSecurityPolicy();
    }

    setContentSecurityPolicy() {
        const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (csp) {
            // Enhance existing CSP
            const currentPolicy = csp.getAttribute('content');
            if (!currentPolicy.includes('upgrade-insecure-requests')) {
                csp.setAttribute('content', currentPolicy + '; upgrade-insecure-requests');
                console.log('🔒 Enhanced CSP with upgrade-insecure-requests');
            }
        } else {
            // Create comprehensive CSP
            const meta = document.createElement('meta');
            meta.setAttribute('http-equiv', 'Content-Security-Policy');
            meta.setAttribute('content', [
                "default-src 'self' https:",
                "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com https://identitytoolkit.googleapis.com https://cdn.emailjs.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com data:",
                "img-src 'self' data: https: blob:",
                "connect-src 'self' https: wss:",
                "form-action 'self' https:",
                "upgrade-insecure-requests"
            ].join('; '));
            document.head.appendChild(meta);
            console.log('🛡️ Comprehensive CSP set');
        }
    }

    monitorMixedContent() {
        // Monitor for mixed content issues
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            this.checkElementSecurity(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial check of existing elements
        document.querySelectorAll('img, script, link, iframe, video, audio').forEach((element) => {
            this.checkElementSecurity(element);
        });
    }

    checkElementSecurity(element) {
        const insecureAttributes = ['src', 'href', 'action'];
        
        insecureAttributes.forEach((attr) => {
            const value = element.getAttribute(attr);
            if (value && value.startsWith('http://')) {
                console.warn('⚠️ Insecure resource detected:', element.tagName, value);
                
                // Auto-fix common cases
                if (this.isAllowedDomain()) {
                    const httpsUrl = value.replace('http://', 'https://');
                    element.setAttribute(attr, httpsUrl);
                    console.log('🔧 Auto-fixed to HTTPS:', httpsUrl);
                }
            }
        });
    }

    setupServiceWorkerSecurity() {
        if ('serviceWorker' in navigator) {
            // Ensure service worker only registers on HTTPS
            if (window.location.protocol === 'https:' || this.isDevelopment()) {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('🔐 Secure Service Worker registered');
                        
                        // Monitor for updates
                        registration.addEventListener('updatefound', () => {
                            console.log('🔄 Service Worker update found');
                        });
                    })
                    .catch((error) => {
                        console.error('❌ Service Worker registration failed:', error);
                    });
            }
        }
    }

    showSecurityWarning(message) {
        // Create security warning modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 32px;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
                <h2 style="margin-bottom: 16px; color: #dc2626;">Security Warning</h2>
                <p style="margin-bottom: 24px; color: #374151;">${message}</p>
                <button onclick="window.location.href='https://guide-signal.com'" style="
                    background: #4a9eff;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    font-weight: 600;
                    cursor: pointer;
                ">Go to Secure Site</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Certificate validation and monitoring
    checkCertificateStatus() {
        // This would typically be done server-side, but we can provide client-side monitoring
        return new Promise((resolve) => {
            const testImg = new Image();
            testImg.onload = () => resolve(true);
            testImg.onerror = () => resolve(false);
            testImg.src = 'https://' + window.location.hostname + '/favicon.ico?' + Date.now();
        });
    }

    // Performance monitoring for security features
    measureSecurityOverhead() {
        const startTime = performance.now();
        
        // Measure time for security checks
        setTimeout(() => {
            const endTime = performance.now();
            const overhead = endTime - startTime;
            
            if (overhead > 100) {
                console.warn(`⚡ Security overhead: ${overhead.toFixed(2)}ms`);
            } else {
                console.log(`✅ Security initialized in ${overhead.toFixed(2)}ms`);
            }
        }, 0);
    }

    // Initialize everything
    static initialize() {
        return new SecurityManager();
    }
}

// Auto-initialize security when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.GuideSignalSecurity = SecurityManager.initialize();
    });
} else {
    window.GuideSignalSecurity = SecurityManager.initialize();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}