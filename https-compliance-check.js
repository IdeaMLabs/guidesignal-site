// HTTPS Compliance and Security Check
// Ensures all protocols work properly and won't be blocked

class HTTPSComplianceChecker {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.fixes = [];
        
        this.init();
    }

    async init() {
        console.log('🔒 Running HTTPS Compliance Check...');
        
        await this.checkProtocol();
        await this.checkMixedContent();
        await this.checkCertificate();
        await this.checkSecurityHeaders();
        await this.checkExternalResources();
        await this.checkFormSubmissions();
        
        this.generateReport();
    }

    async checkProtocol() {
        const isHTTPS = location.protocol === 'https:';
        const isDev = this.isDevelopment();
        
        if (!isHTTPS && !isDev) {
            this.issues.push({
                type: 'protocol',
                severity: 'high',
                message: 'Site is not using HTTPS in production',
                fix: 'Enable HTTPS redirect and obtain SSL certificate'
            });
        } else if (isHTTPS) {
            console.log('✅ HTTPS Protocol: Enabled');
            this.fixes.push('HTTPS protocol is properly configured');
        }
    }

    async checkMixedContent() {
        const resources = performance.getEntriesByType('resource');
        const mixedContent = [];
        
        if (location.protocol === 'https:') {
            resources.forEach(resource => {
                if (resource.name.startsWith('http://')) {
                    mixedContent.push(resource.name);
                }
            });
            
            if (mixedContent.length > 0) {
                this.issues.push({
                    type: 'mixed-content',
                    severity: 'high',
                    message: `${mixedContent.length} mixed content resources detected`,
                    resources: mixedContent,
                    fix: 'Update all HTTP URLs to HTTPS or relative URLs'
                });
            } else {
                console.log('✅ Mixed Content: None detected');
                this.fixes.push('No mixed content issues found');
            }
        }
    }

    async checkCertificate() {
        if (location.protocol !== 'https:') {
            return;
        }

        try {
            // Test certificate by attempting secure fetch
            const response = await fetch(location.origin + '/manifest.json', {
                method: 'HEAD',
                mode: 'cors'
            });
            
            if (response.ok) {
                console.log('✅ SSL Certificate: Valid');
                this.fixes.push('SSL certificate is working properly');
            } else {
                this.warnings.push({
                    type: 'certificate',
                    severity: 'medium',
                    message: 'Certificate validation inconclusive',
                    fix: 'Manual certificate verification recommended'
                });
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('certificate')) {
                this.issues.push({
                    type: 'certificate',
                    severity: 'high',
                    message: 'SSL certificate error detected',
                    error: error.message,
                    fix: 'Check SSL certificate configuration'
                });
            }
        }
    }

    async checkSecurityHeaders() {
        const requiredHeaders = [
            'Content-Security-Policy',
            'Strict-Transport-Security',
            'X-Content-Type-Options',
            'X-Frame-Options'
        ];

        const presentHeaders = [];
        const missingHeaders = [];

        requiredHeaders.forEach(header => {
            const metaTag = document.querySelector(`meta[http-equiv="${header}"]`);
            if (metaTag) {
                presentHeaders.push(header);
            } else {
                missingHeaders.push(header);
            }
        });

        if (missingHeaders.length > 0) {
            this.warnings.push({
                type: 'security-headers',
                severity: 'medium',
                message: `Missing security headers: ${missingHeaders.join(', ')}`,
                fix: 'Add missing security headers via meta tags or server configuration'
            });
        }

        console.log(`✅ Security Headers: ${presentHeaders.length}/${requiredHeaders.length} present`);
    }

    async checkExternalResources() {
        const externalResources = [];
        const resources = performance.getEntriesByType('resource');
        
        resources.forEach(resource => {
            const url = new URL(resource.name);
            if (url.origin !== location.origin) {
                externalResources.push({
                    url: resource.name,
                    secure: url.protocol === 'https:'
                });
            }
        });

        const insecureExternal = externalResources.filter(r => !r.secure);
        
        if (insecureExternal.length > 0) {
            this.issues.push({
                type: 'external-resources',
                severity: 'high',
                message: `${insecureExternal.length} insecure external resources`,
                resources: insecureExternal.map(r => r.url),
                fix: 'Update external resource URLs to use HTTPS'
            });
        } else {
            console.log(`✅ External Resources: ${externalResources.length} all secure`);
        }
    }

    async checkFormSubmissions() {
        const forms = document.querySelectorAll('form');
        const insecureForms = [];

        forms.forEach(form => {
            const action = form.action || location.href;
            const actionUrl = new URL(action, location.origin);
            
            if (actionUrl.protocol === 'http:' && !this.isDevelopment()) {
                insecureForms.push({
                    form: form,
                    action: action
                });
            }
        });

        if (insecureForms.length > 0) {
            this.issues.push({
                type: 'form-submissions',
                severity: 'high',
                message: `${insecureForms.length} forms submitting over HTTP`,
                fix: 'Update form actions to use HTTPS URLs'
            });
        } else {
            console.log(`✅ Form Submissions: ${forms.length} forms secure`);
        }
    }

    isDevelopment() {
        return location.hostname === 'localhost' ||
               location.hostname === '127.0.0.1' ||
               location.hostname.startsWith('192.168.') ||
               location.hostname.endsWith('.local');
    }

    generateReport() {
        const totalIssues = this.issues.length;
        const totalWarnings = this.warnings.length;
        const totalFixes = this.fixes.length;

        console.group('🔒 HTTPS Compliance Report');
        
        if (totalIssues === 0 && totalWarnings === 0) {
            console.log('🎉 All checks passed! Site is HTTPS compliant.');
        } else {
            console.log(`📊 Summary: ${totalIssues} issues, ${totalWarnings} warnings, ${totalFixes} fixes applied`);
        }

        if (this.issues.length > 0) {
            console.group('❌ Issues (Action Required)');
            this.issues.forEach(issue => {
                console.error(`${issue.type}: ${issue.message}`);
                console.log(`   Fix: ${issue.fix}`);
                if (issue.resources) {
                    console.log('   Resources:', issue.resources);
                }
            });
            console.groupEnd();
        }

        if (this.warnings.length > 0) {
            console.group('⚠️ Warnings (Recommended)');
            this.warnings.forEach(warning => {
                console.warn(`${warning.type}: ${warning.message}`);
                console.log(`   Fix: ${warning.fix}`);
            });
            console.groupEnd();
        }

        if (this.fixes.length > 0) {
            console.group('✅ Applied Fixes');
            this.fixes.forEach(fix => console.log(`   ${fix}`));
            console.groupEnd();
        }

        console.groupEnd();

        // Store report for external access
        window.httpsComplianceReport = {
            timestamp: new Date().toISOString(),
            url: location.href,
            issues: this.issues,
            warnings: this.warnings,
            fixes: this.fixes,
            compliant: totalIssues === 0,
            score: this.calculateScore()
        };

        // Show user-friendly notification if there are critical issues
        if (totalIssues > 0) {
            this.showComplianceNotification();
        }
    }

    calculateScore() {
        const totalChecks = 6; // Number of check categories
        const criticalIssues = this.issues.filter(i => i.severity === 'high').length;
        const warnings = this.warnings.length;
        
        let score = 100;
        score -= (criticalIssues * 20); // -20 points per critical issue
        score -= (warnings * 5); // -5 points per warning
        
        return Math.max(0, score);
    }

    showComplianceNotification() {
        // Only show in development or with specific query parameter
        if (!this.isDevelopment() && !location.search.includes('show-compliance=true')) {
            return;
        }

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 4px solid #ef4444;
            color: #991b1b;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 9999;
            max-width: 300px;
            font-size: 13px;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: start; gap: 8px;">
                <span style="font-size: 16px;">🔒</span>
                <div>
                    <strong>HTTPS Issues Detected</strong><br>
                    ${this.issues.length} security issues found.<br>
                    <small>Check console for details.</small>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none; border: none; color: #991b1b; cursor: pointer; 
                    padding: 2px; margin-left: auto; font-size: 16px;
                ">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);
    }

    // Public method to get compliance status
    getComplianceStatus() {
        return {
            compliant: this.issues.length === 0,
            score: this.calculateScore(),
            issues: this.issues.length,
            warnings: this.warnings.length,
            report: window.httpsComplianceReport
        };
    }
}

// Auto-run compliance check
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let other scripts load
    setTimeout(() => {
        window.httpsChecker = new HTTPSComplianceChecker();
    }, 1000);
});

// Export for manual checking
window.checkHTTPSCompliance = () => {
    return new HTTPSComplianceChecker();
};

console.log('🔒 HTTPS Compliance Checker loaded');