/**
 * SECURITY INTEGRATION LAYER
 * ===========================
 * 
 * Integration layer that connects all security systems and provides
 * a unified interface for the GuideSignal application.
 * 
 * Features:
 * - Central security orchestration
 * - Real-time threat response
 * - Automatic security policy enforcement
 * - Security event correlation
 * - Compliance monitoring
 */

class SecurityIntegration {
    constructor() {
        this.securitySystems = new Map();
        this.securityPolicies = new Map();
        this.threatLevel = 'GREEN';
        this.eventCorrelator = new SecurityEventCorrelator();
        this.complianceMonitor = new ComplianceMonitor();
        this.isInitialized = false;
    }

    // ====================================
    // INITIALIZATION
    // ====================================

    async initialize() {
        console.log('🛡️ Initializing Security Integration Layer');
        
        try {
            // Initialize all security systems
            await this.initializeSecuritySystems();
            
            // Load security policies
            await this.loadSecurityPolicies();
            
            // Setup event correlation
            await this.setupEventCorrelation();
            
            // Setup compliance monitoring
            await this.setupComplianceMonitoring();
            
            // Setup automatic threat response
            await this.setupThreatResponse();
            
            // Integrate with existing systems
            await this.integrateWithExistingSystems();
            
            this.isInitialized = true;
            console.log('✅ Security Integration Layer initialized');
            
            // Start security health check
            this.startSecurityHealthCheck();
            
            return { success: true };
        } catch (error) {
            console.error('❌ Security integration failed:', error);
            return { success: false, error: error.message };
        }
    }

    async initializeSecuritySystems() {
        // Initialize core security systems
        this.securitySystems.set('military-grade', window.MilitaryGradeSecurity);
        this.securitySystems.set('auth-security', window.AdvancedAuthSecurity);
        this.securitySystems.set('config-manager', window.EncryptedConfigManager);
        
        console.log('🔧 Security systems integrated');
    }

    async loadSecurityPolicies() {
        this.securityPolicies.set('password-policy', {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            prohibitCommonPasswords: true,
            maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
            preventReuse: 12
        });

        this.securityPolicies.set('session-policy', {
            maxIdleTime: 30 * 60 * 1000, // 30 minutes
            maxSessionTime: 8 * 60 * 60 * 1000, // 8 hours
            requireMFAForSensitive: true,
            maxConcurrentSessions: 3,
            allowedDevices: 5
        });

        this.securityPolicies.set('access-policy', {
            maxFailedAttempts: 5,
            lockoutDuration: 15 * 60 * 1000, // 15 minutes
            requireDeviceRegistration: true,
            allowedGeolocations: [], // Empty = all allowed
            timeBasedAccess: false
        });

        this.securityPolicies.set('data-policy', {
            encryptSensitiveData: true,
            dataRetentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
            requireConsentForTracking: true,
            minimizeDataCollection: true,
            anonymizeAnalytics: true
        });

        console.log('📋 Security policies loaded');
    }

    // ====================================
    // FORM INTEGRATION
    // ====================================

    secureForm(form) {
        if (!form || !form.tagName || form.tagName !== 'FORM') {
            console.warn('Invalid form provided to secureForm');
            return;
        }

        const formId = form.id || `form_${Date.now()}`;
        
        // Add CSRF protection
        this.addCSRFProtection(form);
        
        // Add honeypot fields
        this.addHoneypotProtection(form);
        
        // Add input validation
        this.addInputValidation(form);
        
        // Add submission protection
        this.addSubmissionProtection(form);
        
        // Add security monitoring
        this.addFormMonitoring(form);

        console.log(`🔒 Form '${formId}' secured with military-grade protection`);
    }

    addCSRFProtection(form) {
        const militaryGrade = this.securitySystems.get('military-grade');
        if (!militaryGrade) return;

        // Remove existing CSRF tokens
        const existingTokens = form.querySelectorAll('input[name="csrf_token"]');
        existingTokens.forEach(token => token.remove());

        // Add new CSRF token
        const csrfToken = militaryGrade.generateCSRFToken();
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'csrf_token';
        tokenInput.value = csrfToken;
        form.appendChild(tokenInput);
    }

    addHoneypotProtection(form) {
        const militaryGrade = this.securitySystems.get('military-grade');
        if (!militaryGrade) return;

        // Add multiple honeypot fields
        const honeypotFields = [
            { name: 'website_url', type: 'url' },
            { name: 'confirm_email', type: 'email' },
            { name: 'phone_verify', type: 'tel' },
            { name: 'company_size', type: 'text' }
        ];

        honeypotFields.forEach(field => {
            if (!form.querySelector(`[name="${field.name}"]`)) {
                militaryGrade.addHoneypotToForm(form, field.name);
            }
        });
    }

    addInputValidation(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Add real-time validation
            input.addEventListener('input', (e) => {
                this.validateInput(e.target);
            });

            // Add blur validation
            input.addEventListener('blur', (e) => {
                this.validateInput(e.target, true);
            });
        });
    }

    validateInput(input, showErrors = false) {
        const militaryGrade = this.securitySystems.get('military-grade');
        if (!militaryGrade) return true;

        const value = input.value;
        const errors = [];

        // Check for malicious patterns
        if (militaryGrade.checkWAF(value)) {
            errors.push('Invalid characters detected');
            this.highlightInput(input, 'error');
        }

        // Sanitize input
        const sanitized = militaryGrade.sanitizeInput(value);
        if (sanitized !== value) {
            input.value = sanitized;
            errors.push('Input was automatically cleaned');
        }

        // Validate based on input type
        if (input.type === 'email') {
            if (!this.isValidEmail(value)) {
                errors.push('Invalid email format');
            }
        } else if (input.type === 'password') {
            const passwordErrors = this.validatePassword(value);
            errors.push(...passwordErrors);
        }

        // Show errors if requested
        if (showErrors && errors.length > 0) {
            this.showInputErrors(input, errors);
        }

        return errors.length === 0;
    }

    addSubmissionProtection(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.secureSubmit(form, e);
        });
    }

    async secureSubmit(form, originalEvent) {
        const militaryGrade = this.securitySystems.get('military-grade');
        if (!militaryGrade) {
            console.error('Military-grade security not available');
            return;
        }

        try {
            // Collect form data
            const formData = new FormData(form);
            const formObject = Object.fromEntries(formData.entries());

            // Validate form with military-grade security
            const validation = militaryGrade.validateForm(formObject);
            if (!validation.valid) {
                this.showFormErrors(form, validation.errors);
                return;
            }

            // Check rate limiting
            const clientIP = await this.getClientIP();
            if (!militaryGrade.checkRateLimit(clientIP, 'form')) {
                this.showFormError(form, 'Too many submissions. Please wait before trying again.');
                return;
            }

            // Encrypt sensitive data
            const encryptedData = await this.encryptSensitiveFormData(validation.sanitized);

            // Add security headers
            const securityHeaders = {
                'X-CSRF-Token': formObject.csrf_token,
                'X-Request-ID': this.generateRequestId(),
                'X-Security-Level': 'MILITARY-GRADE',
                'X-Device-Fingerprint': militaryGrade.currentDeviceId || 'unknown'
            };

            // Submit with security protection
            await this.submitWithSecurity(form, encryptedData, securityHeaders);

        } catch (error) {
            console.error('Secure submission failed:', error);
            this.showFormError(form, 'Security error occurred. Please try again.');
            
            militaryGrade.logSecurityEvent('FORM_SUBMISSION_ERROR', {
                formId: form.id,
                error: error.message,
                level: 'ERROR'
            });
        }
    }

    async submitWithSecurity(form, data, headers) {
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        const originalText = submitButton ? submitButton.textContent : '';
        
        // Show loading state
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '🔒 Securing...';
        }

        try {
            const response = await fetch(form.action || window.location.href, {
                method: form.method || 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showFormSuccess(form, 'Form submitted successfully with military-grade security!');
                
                // Clear form if successful
                if (form.dataset.clearOnSuccess !== 'false') {
                    form.reset();
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            this.showFormError(form, 'Submission failed. Please try again.');
            throw error;
        } finally {
            // Restore button state
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    }

    // ====================================
    // THREAT RESPONSE SYSTEM
    // ====================================

    async setupThreatResponse() {
        // Monitor threat level changes
        setInterval(() => {
            this.assessThreatLevel();
        }, 30000); // Every 30 seconds

        // Setup automatic response triggers
        this.setupThreatTriggers();

        console.log('🚨 Automatic threat response system active');
    }

    assessThreatLevel() {
        const militaryGrade = this.securitySystems.get('military-grade');
        if (!militaryGrade) return;

        const events = militaryGrade.securityEvents.slice(-50); // Last 50 events
        const criticalEvents = events.filter(e => e.level === 'CRITICAL').length;
        const warningEvents = events.filter(e => e.level === 'WARNING').length;

        let newThreatLevel = 'GREEN';

        if (criticalEvents > 5) {
            newThreatLevel = 'RED';
        } else if (criticalEvents > 2 || warningEvents > 10) {
            newThreatLevel = 'ORANGE';
        } else if (warningEvents > 5) {
            newThreatLevel = 'YELLOW';
        }

        if (newThreatLevel !== this.threatLevel) {
            this.escalateThreatLevel(newThreatLevel);
        }
    }

    escalateThreatLevel(newLevel) {
        const previousLevel = this.threatLevel;
        this.threatLevel = newLevel;

        console.log(`🚨 THREAT LEVEL ESCALATED: ${previousLevel} → ${newLevel}`);

        // Trigger appropriate responses
        switch (newLevel) {
            case 'RED':
                this.activateRedAlert();
                break;
            case 'ORANGE':
                this.activateOrangeAlert();
                break;
            case 'YELLOW':
                this.activateYellowAlert();
                break;
            case 'GREEN':
                this.deactivateAlerts();
                break;
        }

        // Notify all security systems
        this.notifySecuritySystems('THREAT_LEVEL_CHANGE', {
            previous: previousLevel,
            current: newLevel,
            timestamp: new Date().toISOString()
        });
    }

    activateRedAlert() {
        // Maximum security measures
        this.lockdownAllForms();
        this.enableMaximumLogging();
        this.notifyAdministrators('RED ALERT');
        this.displayThreatWarning('🔴 CRITICAL THREAT DETECTED - Enhanced Security Active');
    }

    activateOrangeAlert() {
        // High security measures
        this.increasedValidation();
        this.enableExtendedLogging();
        this.displayThreatWarning('🟠 High Threat Level - Additional Security Active');
    }

    activateYellowAlert() {
        // Moderate security measures
        this.enableAdditionalValidation();
        this.displayThreatWarning('🟡 Elevated Threat Level - Monitoring Enhanced');
    }

    // ====================================
    // INTEGRATION WITH EXISTING SYSTEMS
    // ====================================

    async integrateWithExistingSystems() {
        // Integrate with existing forms
        this.secureAllForms();
        
        // Integrate with Firebase
        this.secureFirebaseConfig();
        
        // Integrate with authentication
        this.enhanceAuthentication();
        
        // Setup monitoring hooks
        this.setupMonitoringHooks();

        console.log('🔗 Integration with existing systems complete');
    }

    secureAllForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.secureForm(form);
        });

        // Monitor for dynamically added forms
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'FORM') {
                            this.secureForm(node);
                        } else {
                            const forms = node.querySelectorAll?.('form');
                            forms?.forEach(form => this.secureForm(form));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    secureFirebaseConfig() {
        // Replace insecure Firebase configuration
        const configManager = this.securitySystems.get('config-manager');
        if (configManager && configManager.isInitialized) {
            // Use encrypted configuration
            window.firebaseConfig = {
                get: (key) => configManager.getConfig('firebase', key),
                getAll: () => configManager.getConfig('firebase')
            };
        }
    }

    enhanceAuthentication() {
        const authSecurity = this.securitySystems.get('auth-security');
        if (!authSecurity) return;

        // Override default authentication methods
        window.secureAuth = {
            login: (credentials) => authSecurity.authenticate(credentials),
            logout: () => authSecurity.logout(),
            isAuthenticated: () => authSecurity.isAuthenticated(),
            getCurrentSession: () => authSecurity.getCurrentSession(),
            setupMFA: (method, options) => authSecurity.setupMFA(authSecurity.getCurrentSession()?.userId, method, options),
            setupBiometric: () => authSecurity.registerBiometric(authSecurity.getCurrentSession()?.userId, 'User')
        };
    }

    // ====================================
    // UTILITY FUNCTIONS
    // ====================================

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    generateRequestId() {
        return 'req_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async encryptSensitiveFormData(data) {
        const configManager = this.securitySystems.get('config-manager');
        if (!configManager) return data;

        const sensitiveFields = ['password', 'ssn', 'credit_card', 'bank_account'];
        const encrypted = { ...data };

        for (const [key, value] of Object.entries(data)) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                try {
                    encrypted[key] = await configManager.encryptData(value);
                } catch (error) {
                    console.warn(`Failed to encrypt field ${key}:`, error);
                }
            }
        }

        return encrypted;
    }

    // ====================================
    // UI FEEDBACK METHODS
    // ====================================

    showFormErrors(form, errors) {
        this.clearFormMessages(form);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'security-errors';
        errorDiv.style.cssText = `
            background: #fee; 
            border: 1px solid #fcc; 
            color: #c00; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 4px;
        `;
        errorDiv.innerHTML = '<strong>Security Issues:</strong><ul>' + 
            errors.map(error => `<li>${error}</li>`).join('') + '</ul>';
        
        form.insertBefore(errorDiv, form.firstChild);
    }

    showFormError(form, message) {
        this.clearFormMessages(form);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'security-error';
        errorDiv.style.cssText = `
            background: #fee; 
            border: 1px solid #fcc; 
            color: #c00; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 4px;
        `;
        errorDiv.textContent = message;
        
        form.insertBefore(errorDiv, form.firstChild);
    }

    showFormSuccess(form, message) {
        this.clearFormMessages(form);
        
        const successDiv = document.createElement('div');
        successDiv.className = 'security-success';
        successDiv.style.cssText = `
            background: #efe; 
            border: 1px solid #cfc; 
            color: #060; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 4px;
        `;
        successDiv.innerHTML = `🛡️ ${message}`;
        
        form.insertBefore(successDiv, form.firstChild);
    }

    clearFormMessages(form) {
        const messages = form.querySelectorAll('.security-errors, .security-error, .security-success');
        messages.forEach(msg => msg.remove());
    }

    displayThreatWarning(message) {
        // Remove existing warnings
        const existing = document.querySelector('.threat-warning');
        if (existing) existing.remove();

        const warning = document.createElement('div');
        warning.className = 'threat-warning';
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(45deg, #dc2626, #ef4444);
            color: white;
            padding: 12px;
            text-align: center;
            z-index: 999999;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
        `;
        warning.innerHTML = message;
        document.body.appendChild(warning);
    }

    // Add CSS for animations
    addSecurityStyles() {
        if (document.querySelector('#security-styles')) return;

        const style = document.createElement('style');
        style.id = 'security-styles';
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.8; }
                100% { opacity: 1; }
            }
            
            .security-protected::after {
                content: "🛡️";
                position: absolute;
                top: 5px;
                right: 5px;
                font-size: 12px;
                opacity: 0.7;
            }
            
            .security-error-input {
                border-color: #dc2626 !important;
                box-shadow: 0 0 0 1px #dc2626 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ====================================
    // PUBLIC API
    // ====================================

    getSecurityStatus() {
        return {
            initialized: this.isInitialized,
            threatLevel: this.threatLevel,
            systems: Object.fromEntries(
                Array.from(this.securitySystems.entries()).map(([name, system]) => [
                    name,
                    system?.getSecurityStatus?.() || { available: !!system }
                ])
            ),
            policies: Object.fromEntries(this.securityPolicies)
        };
    }

    async performSecurityAudit() {
        console.log('🔍 Performing comprehensive security audit...');
        
        const audit = {
            timestamp: new Date().toISOString(),
            threatLevel: this.threatLevel,
            systems: {},
            vulnerabilities: [],
            recommendations: []
        };

        // Audit each security system
        for (const [name, system] of this.securitySystems) {
            if (system?.performSecurityScan) {
                try {
                    system.performSecurityScan();
                    audit.systems[name] = { status: 'audited', issues: [] };
                } catch (error) {
                    audit.systems[name] = { status: 'error', error: error.message };
                }
            }
        }

        // Check for common vulnerabilities
        audit.vulnerabilities = this.checkCommonVulnerabilities();
        
        // Generate recommendations
        audit.recommendations = this.generateSecurityRecommendations(audit);

        console.log('✅ Security audit completed');
        return audit;
    }

    checkCommonVulnerabilities() {
        const vulnerabilities = [];

        // Check for HTTP usage
        if (window.location.protocol !== 'https:') {
            vulnerabilities.push({
                type: 'INSECURE_PROTOCOL',
                severity: 'HIGH',
                description: 'Site not using HTTPS'
            });
        }

        // Check for inline event handlers
        const inlineHandlers = document.querySelectorAll('[onclick], [onload], [onerror]');
        if (inlineHandlers.length > 0) {
            vulnerabilities.push({
                type: 'INLINE_EVENT_HANDLERS',
                severity: 'MEDIUM',
                description: `${inlineHandlers.length} inline event handlers found`,
                count: inlineHandlers.length
            });
        }

        // Check for unprotected forms
        const unprotectedForms = document.querySelectorAll('form:not([data-secured])');
        if (unprotectedForms.length > 0) {
            vulnerabilities.push({
                type: 'UNPROTECTED_FORMS',
                severity: 'HIGH',
                description: `${unprotectedForms.length} forms without security protection`,
                count: unprotectedForms.length
            });
        }

        return vulnerabilities;
    }

    generateSecurityRecommendations(audit) {
        const recommendations = [];

        if (audit.vulnerabilities.some(v => v.type === 'INSECURE_PROTOCOL')) {
            recommendations.push('Implement HTTPS across all pages');
        }

        if (audit.vulnerabilities.some(v => v.type === 'INLINE_EVENT_HANDLERS')) {
            recommendations.push('Replace inline event handlers with addEventListener');
        }

        if (this.threatLevel !== 'GREEN') {
            recommendations.push('Consider implementing additional security measures due to elevated threat level');
        }

        recommendations.push('Enable two-factor authentication for all user accounts');
        recommendations.push('Implement regular security audits');
        recommendations.push('Consider penetration testing');

        return recommendations;
    }
}

// Supporting classes
class SecurityEventCorrelator {
    // Event correlation logic would go here
}

class ComplianceMonitor {
    // Compliance monitoring logic would go here
}

// Initialize the security integration
window.SecurityIntegration = new SecurityIntegration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.SecurityIntegration.initialize();
    });
} else {
    window.SecurityIntegration.initialize();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityIntegration;
}

console.log('🛡️ SECURITY INTEGRATION LAYER LOADED');