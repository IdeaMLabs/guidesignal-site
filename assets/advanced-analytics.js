/**
 * Advanced Analytics and Optimization System
 * Comprehensive tracking and optimization for GuideSignal
 * 
 * Features:
 * - User behavior tracking and analysis
 * - A/B test management
 * - Conversion funnel optimization
 * - Performance monitoring
 * - Real-time optimization recommendations
 * - ROI tracking for implemented features
 */

class AdvancedAnalytics {
    constructor() {
        this.sessionData = {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: [],
            interactions: [],
            conversionEvents: [],
            errors: []
        };
        
        this.experiments = new Map();
        this.metrics = new Map();
        this.optimizations = new Map();
        
        // Performance thresholds
        this.thresholds = {
            pageLoadTime: 3000,
            firstContentfulPaint: 1500,
            largestContentfulPaint: 2500,
            cumulativeLayoutShift: 0.1,
            firstInputDelay: 100
        };
        
        this.init();
    }

    async init() {
        try {
            // Initialize core analytics
            this.initCoreTracking();
            
            // Setup performance monitoring
            this.initPerformanceMonitoring();
            
            // Initialize A/B testing
            this.initABTesting();
            
            // Setup conversion tracking
            this.initConversionTracking();
            
            // Initialize optimization engine
            this.initOptimizationEngine();
            
            // Setup real-time dashboard
            this.createAnalyticsDashboard();
            
            console.log('Advanced Analytics initialized');
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
        }
    }

    /**
     * Core tracking initialization
     */
    initCoreTracking() {
        // Page view tracking
        this.trackPageView();
        
        // User interaction tracking
        this.setupInteractionTracking();
        
        // Error tracking
        this.setupErrorTracking();
        
        // Session tracking
        this.setupSessionTracking();
    }

    /**
     * Track page views with enhanced context
     */
    trackPageView() {
        const pageData = {
            url: window.location.href,
            pathname: window.location.pathname,
            referrer: document.referrer,
            timestamp: Date.now(),
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            deviceType: this.detectDeviceType(),
            connectionType: this.detectConnectionType()
        };
        
        this.sessionData.pageViews.push(pageData);
        this.sendEvent('page_view', pageData);
        
        // Track time on page
        this.startPageTimer();
    }

    /**
     * Setup comprehensive interaction tracking
     */
    setupInteractionTracking() {
        // Click tracking
        document.addEventListener('click', (event) => {
            this.trackInteraction('click', {
                element: this.getElementSelector(event.target),
                text: event.target.textContent?.substring(0, 100) || '',
                coordinates: { x: event.clientX, y: event.clientY },
                timestamp: Date.now()
            });
        });
        
        // Form interaction tracking
        this.setupFormTracking();
        
        // Scroll tracking
        this.setupScrollTracking();
        
        // Tab visibility tracking
        this.setupVisibilityTracking();
    }

    /**
     * Form tracking for conversion optimization
     */
    setupFormTracking() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Form start tracking
            form.addEventListener('focusin', () => {
                this.trackInteraction('form_start', {
                    formId: form.id || 'unknown',
                    timestamp: Date.now()
                });
            });
            
            // Field interaction tracking
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.trackInteraction('field_exit', {
                        formId: form.id || 'unknown',
                        fieldName: input.name || input.type,
                        fieldType: input.type,
                        hasValue: input.value.length > 0,
                        timestamp: Date.now()
                    });
                });
            });
            
            // Form submission tracking
            form.addEventListener('submit', () => {
                this.trackConversion('form_submit', {
                    formId: form.id || 'unknown',
                    timestamp: Date.now()
                });
            });
        });
    }

    /**
     * Performance monitoring
     */
    initPerformanceMonitoring() {
        // Web Vitals tracking
        this.trackWebVitals();
        
        // Resource loading tracking
        this.trackResourcePerformance();
        
        // API response time tracking
        this.setupAPIMonitoring();
        
        // Memory usage monitoring
        this.setupMemoryMonitoring();
    }

    /**
     * Track Core Web Vitals
     */
    trackWebVitals() {
        // First Contentful Paint
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    this.trackMetric('fcp', entry.value, {
                        threshold: this.thresholds.firstContentfulPaint,
                        good: entry.value < 1800,
                        timestamp: Date.now()
                    });
                }
            });
        }).observe({ entryTypes: ['paint'] });
        
        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.trackMetric('lcp', lastEntry.value, {
                threshold: this.thresholds.largestContentfulPaint,
                good: lastEntry.value < 2500,
                timestamp: Date.now()
            });
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.trackMetric('fid', entry.processingStart - entry.startTime, {
                    threshold: this.thresholds.firstInputDelay,
                    good: (entry.processingStart - entry.startTime) < 100,
                    timestamp: Date.now()
                });
            });
        }).observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift
        let cls = 0;
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    cls += entry.value;
                }
            });
            
            this.trackMetric('cls', cls, {
                threshold: this.thresholds.cumulativeLayoutShift,
                good: cls < 0.1,
                timestamp: Date.now()
            });
        }).observe({ entryTypes: ['layout-shift'] });
    }

    /**
     * A/B Testing initialization
     */
    initABTesting() {
        // Define current experiments
        this.setupExperiments();
        
        // Assign user to experiment groups
        this.assignExperimentGroups();
        
        // Track experiment performance
        this.trackExperimentMetrics();
    }

    /**
     * Setup active experiments
     */
    setupExperiments() {
        const experiments = [
            {
                id: 'auth_flow_optimization',
                name: 'Authentication Flow Optimization',
                variants: ['control', 'simplified_signup', 'social_first'],
                traffic: 0.3, // 30% of users
                metrics: ['conversion_rate', 'time_to_complete', 'abandonment_rate']
            },
            {
                id: 'job_matching_algorithm',
                name: 'Job Matching Algorithm Test',
                variants: ['original', 'optimized_v1', 'optimized_v2'],
                traffic: 0.5, // 50% of users
                metrics: ['match_quality', 'application_rate', 'response_rate']
            },
            {
                id: 'onboarding_flow',
                name: 'Smart Onboarding Test',
                variants: ['standard', 'intelligent', 'progressive'],
                traffic: 0.4, // 40% of users
                metrics: ['completion_rate', 'engagement', 'satisfaction']
            }
        ];
        
        experiments.forEach(exp => this.experiments.set(exp.id, exp));
    }

    /**
     * Assign user to experiment groups
     */
    assignExperimentGroups() {
        const userId = this.getUserId();
        const userHash = this.hashUserId(userId);
        
        this.experiments.forEach((experiment, experimentId) => {
            // Determine if user should be in this experiment
            if ((userHash % 100) < (experiment.traffic * 100)) {
                // Assign variant based on hash
                const variantIndex = userHash % experiment.variants.length;
                const assignedVariant = experiment.variants[variantIndex];
                
                // Store assignment
                this.sessionData.experiments = this.sessionData.experiments || {};
                this.sessionData.experiments[experimentId] = assignedVariant;
                
                // Apply variant changes
                this.applyExperimentVariant(experimentId, assignedVariant);
                
                // Track assignment
                this.trackEvent('experiment_assignment', {
                    experimentId,
                    variant: assignedVariant,
                    userId,
                    timestamp: Date.now()
                });
            }
        });
    }

    /**
     * Apply experiment variant changes
     */
    applyExperimentVariant(experimentId, variant) {
        switch (experimentId) {
            case 'auth_flow_optimization':
                this.applyAuthFlowVariant(variant);
                break;
            case 'job_matching_algorithm':
                this.applyMatchingVariant(variant);
                break;
            case 'onboarding_flow':
                this.applyOnboardingVariant(variant);
                break;
        }
    }

    /**
     * Conversion tracking
     */
    initConversionTracking() {
        // Setup conversion funnels
        this.setupConversionFunnels();
        
        // Track key conversion events
        this.setupConversionEvents();
        
        // Calculate conversion rates
        this.calculateConversionRates();
    }

    /**
     * Setup conversion funnels
     */
    setupConversionFunnels() {
        this.funnels = {
            signup: [
                'landing_page_view',
                'auth_page_view', 
                'signup_form_start',
                'signup_form_submit',
                'email_verification',
                'profile_completion'
            ],
            job_application: [
                'job_search',
                'job_view',
                'application_start',
                'application_submit',
                'employer_response'
            ],
            onboarding: [
                'welcome_screen',
                'role_selection',
                'skills_input',
                'preferences_setup',
                'onboarding_complete'
            ]
        };
    }

    /**
     * Optimization engine
     */
    initOptimizationEngine() {
        // Real-time optimization recommendations
        setInterval(() => {
            this.generateOptimizations();
        }, 60000); // Every minute
        
        // Performance optimization alerts
        this.setupPerformanceAlerts();
        
        // Conversion optimization suggestions
        this.setupConversionOptimization();
    }

    /**
     * Generate optimization recommendations
     */
    generateOptimizations() {
        const recommendations = [];
        
        // Performance optimizations
        const performanceIssues = this.analyzePerformanceMetrics();
        recommendations.push(...this.generatePerformanceRecommendations(performanceIssues));
        
        // Conversion optimizations
        const conversionIssues = this.analyzeConversionFunnels();
        recommendations.push(...this.generateConversionRecommendations(conversionIssues));
        
        // User experience optimizations
        const uxIssues = this.analyzeUserExperience();
        recommendations.push(...this.generateUXRecommendations(uxIssues));
        
        // Store and potentially act on recommendations
        this.processOptimizationRecommendations(recommendations);
    }

    /**
     * Analyze performance metrics
     */
    analyzePerformanceMetrics() {
        const issues = [];
        
        this.metrics.forEach((metric, key) => {
            if (key === 'lcp' && metric.value > this.thresholds.largestContentfulPaint) {
                issues.push({
                    type: 'performance',
                    metric: 'lcp',
                    current: metric.value,
                    threshold: this.thresholds.largestContentfulPaint,
                    severity: 'high'
                });
            }
            
            if (key === 'fcp' && metric.value > this.thresholds.firstContentfulPaint) {
                issues.push({
                    type: 'performance',
                    metric: 'fcp',
                    current: metric.value,
                    threshold: this.thresholds.firstContentfulPaint,
                    severity: 'medium'
                });
            }
            
            if (key === 'cls' && metric.value > this.thresholds.cumulativeLayoutShift) {
                issues.push({
                    type: 'performance',
                    metric: 'cls',
                    current: metric.value,
                    threshold: this.thresholds.cumulativeLayoutShift,
                    severity: 'high'
                });
            }
        });
        
        return issues;
    }

    /**
     * Create analytics dashboard
     */
    createAnalyticsDashboard() {
        // Only create dashboard for admin users or in development
        if (!this.shouldShowDashboard()) return;
        
        const dashboard = document.createElement('div');
        dashboard.id = 'analytics-dashboard';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <h3>GuideSignal Analytics</h3>
                <button onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
            </div>
            <div class="dashboard-content">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h4>Performance</h4>
                        <div id="performance-metrics"></div>
                    </div>
                    <div class="metric-card">
                        <h4>Conversions</h4>
                        <div id="conversion-metrics"></div>
                    </div>
                    <div class="metric-card">
                        <h4>Experiments</h4>
                        <div id="experiment-metrics"></div>
                    </div>
                    <div class="metric-card">
                        <h4>Optimizations</h4>
                        <div id="optimization-suggestions"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add dashboard styles
        this.addDashboardStyles();
        
        // Position dashboard
        Object.assign(dashboard.style, {
            position: 'fixed',
            top: '10px',
            left: '10px',
            width: '400px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px'
        });
        
        document.body.appendChild(dashboard);
        
        // Update dashboard every 5 seconds
        setInterval(() => {
            this.updateDashboard();
        }, 5000);
    }

    /**
     * Update analytics dashboard
     */
    updateDashboard() {
        const performanceEl = document.getElementById('performance-metrics');
        const conversionEl = document.getElementById('conversion-metrics');
        const experimentEl = document.getElementById('experiment-metrics');
        const optimizationEl = document.getElementById('optimization-suggestions');
        
        if (performanceEl) {
            performanceEl.innerHTML = this.formatPerformanceMetrics();
        }
        
        if (conversionEl) {
            conversionEl.innerHTML = this.formatConversionMetrics();
        }
        
        if (experimentEl) {
            experimentEl.innerHTML = this.formatExperimentMetrics();
        }
        
        if (optimizationEl) {
            optimizationEl.innerHTML = this.formatOptimizationSuggestions();
        }
    }

    /**
     * Send analytics data to server
     */
    async sendEvent(eventType, data) {
        const eventData = {
            type: eventType,
            sessionId: this.sessionData.sessionId,
            timestamp: Date.now(),
            url: window.location.href,
            userId: this.getUserId(),
            ...data
        };
        
        try {
            // Send to server
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(eventData)
            });
        } catch (error) {
            // Store locally for retry
            this.storeEventLocally(eventData);
        }
    }

    /**
     * Utility functions
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        return localStorage.getItem('userId') || 
               sessionStorage.getItem('userId') || 
               'anonymous_' + Date.now();
    }

    async getAuthToken() {
        return localStorage.getItem('authToken') || 
               sessionStorage.getItem('authToken') || 
               null;
    }

    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    detectDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    detectConnectionType() {
        return navigator.connection?.effectiveType || 'unknown';
    }

    getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }

    shouldShowDashboard() {
        // Show dashboard in development or for admin users
        return window.location.hostname === 'localhost' || 
               localStorage.getItem('showAnalyticsDashboard') === 'true' ||
               this.getUserId().includes('admin');
    }

    trackInteraction(type, data) {
        this.sessionData.interactions.push({ type, ...data });
        this.sendEvent('interaction', { type, ...data });
    }

    trackConversion(type, data) {
        this.sessionData.conversionEvents.push({ type, ...data });
        this.sendEvent('conversion', { type, ...data });
    }

    trackMetric(name, value, metadata = {}) {
        this.metrics.set(name, { value, ...metadata });
        this.sendEvent('metric', { name, value, ...metadata });
    }

    trackEvent(eventType, data) {
        this.sendEvent(eventType, data);
    }
}

// Initialize analytics system
const analytics = new AdvancedAnalytics();

// Global analytics interface
window.GuideSignalAnalytics = analytics;

export default AdvancedAnalytics;