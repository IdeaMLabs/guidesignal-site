// Real-Time Analytics Dashboard with Advanced Visualization
// Live metrics, ML insights, and predictive analytics

class RealTimeAnalyticsDashboard {
    constructor() {
        this.metricsBuffer = new Map();
        this.chartInstances = new Map();
        this.websocketConnection = null;
        this.updateInterval = null;
        this.isVisible = true;
        
        this.metrics = {
            realTime: new Map(),
            historical: new Map(),
            predictions: new Map(),
            alerts: []
        };
        
        this.init();
    }

    async init() {
        console.log('📊 Initializing Real-Time Analytics Dashboard...');
        
        // Start real-time data collection
        this.startMetricsCollection();
        this.startWebSocketConnection();
        this.initializeVisibilityAPI();
        
        // Initialize dashboard components
        this.initializeDashboard();
        
        console.log('✅ Analytics Dashboard ready');
    }

    // ==================== REAL-TIME METRICS COLLECTION ====================
    
    startMetricsCollection() {
        // Collect performance metrics every 5 seconds
        this.updateInterval = setInterval(() => {
            if (this.isVisible) {
                this.collectMetrics();
                this.updateDashboard();
            }
        }, 5000);

        // Collect user interaction metrics immediately
        this.startInteractionTracking();
        this.startPerformanceTracking();
        this.startErrorTracking();
    }

    async collectMetrics() {
        const timestamp = Date.now();
        
        try {
            // System performance metrics
            const performance = await this.collectPerformanceMetrics();
            
            // User engagement metrics
            const engagement = await this.collectEngagementMetrics();
            
            // ML/AI metrics
            const aiMetrics = await this.collectAIMetrics();
            
            // Business metrics
            const business = await this.collectBusinessMetrics();
            
            // Platform health metrics
            const health = await this.collectHealthMetrics();

            // Store in buffer
            const currentMetrics = {
                timestamp,
                performance,
                engagement,
                aiMetrics,
                business,
                health
            };

            this.metricsBuffer.set(timestamp, currentMetrics);
            this.metrics.realTime.set('current', currentMetrics);
            
            // Cleanup old metrics (keep last hour)
            this.cleanupOldMetrics(timestamp);
            
            // Generate predictions
            await this.generatePredictions(currentMetrics);
            
            // Check for alerts
            this.checkAlerts(currentMetrics);

        } catch (error) {
            console.error('Metrics collection error:', error);
        }
    }

    async collectPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        const resources = performance.getEntriesByType('resource');
        
        return {
            // Core Web Vitals
            fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            lcp: this.getLargestContentfulPaint(),
            fid: this.getFirstInputDelay(),
            cls: this.getCumulativeLayoutShift(),
            
            // Page performance
            domLoad: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
            pageLoad: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
            ttfb: navigation?.responseStart - navigation?.requestStart || 0,
            
            // Resource metrics
            totalResources: resources.length,
            failedResources: resources.filter(r => r.responseStart === 0).length,
            slowResources: resources.filter(r => r.duration > 3000).length,
            
            // Memory usage (if available)
            memoryUsage: this.getMemoryUsage(),
            
            // Connection info
            connectionType: this.getConnectionType(),
            effectiveType: this.getEffectiveConnectionType()
        };
    }

    async collectEngagementMetrics() {
        return {
            // Time metrics
            sessionDuration: Date.now() - (this.sessionStartTime || Date.now()),
            activeTime: this.getActiveTime(),
            timeOnPage: this.getTimeOnCurrentPage(),
            
            // Interaction metrics
            clicks: this.getTotalClicks(),
            scrollDepth: this.getMaxScrollDepth(),
            formInteractions: this.getFormInteractions(),
            
            // Navigation metrics
            pageViews: this.getSessionPageViews(),
            bounceRate: this.calculateBounceRate(),
            exitRate: this.calculateExitRate(),
            
            // Search metrics
            searchQueries: this.getSearchQueries(),
            searchResults: this.getSearchResults(),
            searchConversions: this.getSearchConversions()
        };
    }

    async collectAIMetrics() {
        const aiEngine = window.aiEngine || null;
        
        if (!aiEngine) {
            return {
                available: false,
                predictions: 0,
                accuracy: 0,
                processingTime: 0
            };
        }

        return {
            available: true,
            predictions: aiEngine.performanceMetrics?.totalPredictions || 0,
            accuracy: aiEngine.getModelAccuracy() || 0,
            processingTime: this.getAverageProcessingTime(),
            cacheHitRate: this.getCacheHitRate(),
            
            // Model performance
            matchQuality: this.getAverageMatchQuality(),
            userSatisfaction: this.getUserSatisfactionScore(),
            
            // Learning metrics
            trainingEvents: this.getTrainingEvents(),
            modelVersion: aiEngine.modelVersion || '1.0',
            lastTraining: aiEngine.performanceMetrics?.lastTraining
        };
    }

    async collectBusinessMetrics() {
        return {
            // Job metrics
            activeJobs: await this.getActiveJobCount(),
            newJobs: await this.getNewJobsToday(),
            applicationRate: await this.getApplicationRate(),
            
            // User metrics
            activeUsers: await this.getActiveUserCount(),
            newSignups: await this.getNewSignupsToday(),
            userRetention: await this.getUserRetentionRate(),
            
            // Matching metrics
            matchesGenerated: await this.getMatchesGenerated(),
            successfulMatches: await this.getSuccessfulMatches(),
            interviewRate: await this.getInterviewRate(),
            
            // Revenue metrics
            revenueToday: await this.getRevenueToday(),
            conversionRate: await this.getConversionRate(),
            averageOrderValue: await this.getAverageOrderValue()
        };
    }

    // ==================== REAL-TIME VISUALIZATION ====================
    
    initializeDashboard() {
        this.createDashboardContainer();
        this.createMetricsCards();
        this.createCharts();
        this.createAlertSystem();
    }

    createDashboardContainer() {
        // Check if dashboard already exists
        if (document.getElementById('analytics-dashboard')) return;

        const dashboard = document.createElement('div');
        dashboard.id = 'analytics-dashboard';
        dashboard.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 600px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            overflow: hidden;
            transform: translateX(420px);
            transition: transform 0.3s ease;
        `;

        // Dashboard header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #1e3a5f, #4a9eff);
            color: white;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        header.innerHTML = `
            <div>
                <div style="font-weight: 600;">📊 Live Analytics</div>
                <div style="font-size: 12px; opacity: 0.8;">Real-time metrics</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="toggle-dashboard" style="background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; padding: 4px 8px; cursor: pointer;">↔</button>
                <button id="close-dashboard" style="background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; padding: 4px 8px; cursor: pointer;">✕</button>
            </div>
        `;

        // Dashboard content
        const content = document.createElement('div');
        content.id = 'dashboard-content';
        content.style.cssText = `
            max-height: 540px;
            overflow-y: auto;
            padding: 16px;
        `;

        dashboard.appendChild(header);
        dashboard.appendChild(content);
        document.body.appendChild(dashboard);

        // Add event listeners
        document.getElementById('toggle-dashboard').addEventListener('click', () => {
            const isVisible = dashboard.style.transform === 'translateX(0px)';
            dashboard.style.transform = isVisible ? 'translateX(320px)' : 'translateX(0px)';
        });

        document.getElementById('close-dashboard').addEventListener('click', () => {
            dashboard.style.transform = 'translateX(420px)';
            setTimeout(() => dashboard.remove(), 300);
        });

        // Show dashboard
        setTimeout(() => {
            dashboard.style.transform = 'translateX(0px)';
        }, 100);
    }

    createMetricsCards() {
        const content = document.getElementById('dashboard-content');
        if (!content) return;

        // Create metrics grid
        const metricsGrid = document.createElement('div');
        metricsGrid.id = 'metrics-grid';
        metricsGrid.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        `;

        const metrics = [
            { id: 'performance', label: 'Performance', icon: '⚡', color: '#10b981' },
            { id: 'users', label: 'Users', icon: '👥', color: '#3b82f6' },
            { id: 'ai-accuracy', label: 'AI Accuracy', icon: '🧠', color: '#8b5cf6' },
            { id: 'matches', label: 'Matches', icon: '🎯', color: '#f59e0b' }
        ];

        metrics.forEach(metric => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: ${metric.color}15;
                border: 1px solid ${metric.color}30;
                border-radius: 8px;
                padding: 12px;
                text-align: center;
            `;

            card.innerHTML = `
                <div style="font-size: 20px; margin-bottom: 4px;">${metric.icon}</div>
                <div id="${metric.id}-value" style="font-size: 18px; font-weight: 600; color: ${metric.color};">--</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${metric.label}</div>
            `;

            metricsGrid.appendChild(card);
        });

        content.appendChild(metricsGrid);
    }

    createCharts() {
        const content = document.getElementById('dashboard-content');
        if (!content) return;

        // Performance chart
        const chartContainer = document.createElement('div');
        chartContainer.style.cssText = `
            background: #f9fafb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        `;

        chartContainer.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                📈 Performance Trends
                <select id="chart-timeframe" style="margin-left: auto; padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24h</option>
                    <option value="7d">Last 7 Days</option>
                </select>
            </div>
            <canvas id="performance-chart" width="350" height="150"></canvas>
        `;

        content.appendChild(chartContainer);

        // Initialize chart
        this.initializePerformanceChart();
    }

    initializePerformanceChart() {
        const canvas = document.getElementById('performance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Simple line chart implementation (can be replaced with Chart.js)
        this.drawChart(ctx, {
            type: 'line',
            data: this.getChartData('performance'),
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // ==================== DASHBOARD UPDATES ====================
    
    updateDashboard() {
        this.updateMetricsCards();
        this.updateCharts();
        this.updateAlerts();
    }

    updateMetricsCards() {
        const current = this.metrics.realTime.get('current');
        if (!current) return;

        // Performance score (FCP + LCP weighted)
        const performanceScore = this.calculatePerformanceScore(current.performance);
        this.updateMetricCard('performance', `${performanceScore}%`);

        // Active users
        this.updateMetricCard('users', current.engagement?.activeTime > 30000 ? '🟢' : '🟡');

        // AI accuracy
        this.updateMetricCard('ai-accuracy', `${current.aiMetrics?.accuracy?.toFixed(1) || 0}%`);

        // Matches generated
        this.updateMetricCard('matches', current.business?.matchesGenerated || 0);
    }

    updateMetricCard(metricId, value) {
        const element = document.getElementById(`${metricId}-value`);
        if (element) {
            element.textContent = value;
            
            // Add update animation
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // ==================== PREDICTIVE ANALYTICS ====================
    
    async generatePredictions(currentMetrics) {
        try {
            const predictions = {
                performance: this.predictPerformanceTrends(currentMetrics.performance),
                userGrowth: this.predictUserGrowth(currentMetrics.engagement),
                systemLoad: this.predictSystemLoad(currentMetrics.health),
                businessMetrics: this.predictBusinessMetrics(currentMetrics.business)
            };

            this.metrics.predictions.set(Date.now(), predictions);

        } catch (error) {
            console.error('Predictions generation error:', error);
        }
    }

    predictPerformanceTrends(performanceData) {
        // Simple trend analysis - can be enhanced with ML
        const historical = Array.from(this.metricsBuffer.values())
            .map(m => m.performance)
            .filter(Boolean)
            .slice(-10); // Last 10 data points

        if (historical.length < 3) return null;

        const fcpTrend = this.calculateTrend(historical.map(h => h.fcp));
        const lcpTrend = this.calculateTrend(historical.map(h => h.lcp));
        
        return {
            fcp: {
                trend: fcpTrend,
                nextValue: this.extrapolateValue(historical.map(h => h.fcp)),
                confidence: this.calculateConfidence(fcpTrend)
            },
            lcp: {
                trend: lcpTrend,
                nextValue: this.extrapolateValue(historical.map(h => h.lcp)),
                confidence: this.calculateConfidence(lcpTrend)
            }
        };
    }

    // ==================== ALERT SYSTEM ====================
    
    checkAlerts(currentMetrics) {
        const alerts = [];

        // Performance alerts
        if (currentMetrics.performance?.fcp > 3000) {
            alerts.push({
                type: 'warning',
                category: 'performance',
                message: 'First Contentful Paint is slow (>3s)',
                value: currentMetrics.performance.fcp,
                threshold: 3000,
                timestamp: Date.now()
            });
        }

        // Memory alerts
        if (currentMetrics.performance?.memoryUsage > 0.8) {
            alerts.push({
                type: 'error',
                category: 'memory',
                message: 'High memory usage detected',
                value: (currentMetrics.performance.memoryUsage * 100).toFixed(1) + '%',
                threshold: '80%',
                timestamp: Date.now()
            });
        }

        // AI accuracy alerts
        if (currentMetrics.aiMetrics?.accuracy < 85) {
            alerts.push({
                type: 'warning',
                category: 'ai',
                message: 'AI accuracy below threshold',
                value: currentMetrics.aiMetrics.accuracy?.toFixed(1) + '%',
                threshold: '85%',
                timestamp: Date.now()
            });
        }

        // Update alerts
        this.metrics.alerts = [...this.metrics.alerts, ...alerts].slice(-20); // Keep last 20 alerts
        
        // Display new alerts
        alerts.forEach(alert => this.displayAlert(alert));
    }

    displayAlert(alert) {
        const alertContainer = document.getElementById('alerts-container') || this.createAlertsContainer();
        
        const alertElement = document.createElement('div');
        alertElement.style.cssText = `
            background: ${alert.type === 'error' ? '#fef2f2' : '#fefce8'};
            border: 1px solid ${alert.type === 'error' ? '#fecaca' : '#fde047'};
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 8px;
            font-size: 12px;
            animation: slideIn 0.3s ease;
        `;

        alertElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${alert.type === 'error' ? '🚨' : '⚠️'}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: ${alert.type === 'error' ? '#dc2626' : '#d97706'};">
                        ${alert.message}
                    </div>
                    <div style="color: #6b7280;">
                        Current: ${alert.value} | Threshold: ${alert.threshold}
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: #6b7280;">✕</button>
            </div>
        `;

        alertContainer.appendChild(alertElement);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, 10000);
    }

    createAlertsContainer() {
        const content = document.getElementById('dashboard-content');
        if (!content) return null;

        const alertsSection = document.createElement('div');
        alertsSection.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                🔔 Alerts
            </div>
            <div id="alerts-container"></div>
        `;

        content.appendChild(alertsSection);
        return document.getElementById('alerts-container');
    }

    // ==================== UTILITY METHODS ====================
    
    calculatePerformanceScore(performance) {
        if (!performance) return 0;
        
        // Weighted performance score
        let score = 100;
        
        // FCP penalty (good: <1.8s, poor: >3s)
        if (performance.fcp > 3000) score -= 30;
        else if (performance.fcp > 1800) score -= 15;
        
        // LCP penalty (good: <2.5s, poor: >4s)
        if (performance.lcp > 4000) score -= 30;
        else if (performance.lcp > 2500) score -= 15;
        
        // FID penalty (good: <100ms, poor: >300ms)
        if (performance.fid > 300) score -= 20;
        else if (performance.fid > 100) score -= 10;
        
        // CLS penalty (good: <0.1, poor: >0.25)
        if (performance.cls > 0.25) score -= 20;
        else if (performance.cls > 0.1) score -= 10;
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        
        const recent = values.slice(-3);
        const previous = values.slice(-6, -3);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
        
        const change = (recentAvg - previousAvg) / previousAvg;
        
        if (change > 0.1) return 'improving';
        if (change < -0.1) return 'declining';
        return 'stable';
    }

    getMemoryUsage() {
        if ('memory' in performance) {
            return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        }
        return 0;
    }

    getConnectionType() {
        return navigator.connection?.type || 'unknown';
    }

    getEffectiveConnectionType() {
        return navigator.connection?.effectiveType || 'unknown';
    }

    cleanupOldMetrics(currentTimestamp) {
        const oneHourAgo = currentTimestamp - (60 * 60 * 1000);
        
        for (const [timestamp] of this.metricsBuffer) {
            if (timestamp < oneHourAgo) {
                this.metricsBuffer.delete(timestamp);
            }
        }
    }

    initializeVisibilityAPI() {
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            
            if (this.isVisible) {
                // Restart metrics collection when page becomes visible
                this.collectMetrics();
            }
        });
    }

    // Cleanup method
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.websocketConnection) {
            this.websocketConnection.close();
        }
        
        const dashboard = document.getElementById('analytics-dashboard');
        if (dashboard) {
            dashboard.remove();
        }
    }
}

// Initialize analytics dashboard
let analyticsInstance = null;

// Auto-initialize for admin users or when in development
if (window.location.hostname === 'localhost' || 
    window.location.search.includes('analytics=true') ||
    localStorage.getItem('showAnalytics') === 'true') {
    
    document.addEventListener('DOMContentLoaded', () => {
        analyticsInstance = new RealTimeAnalyticsDashboard();
    });
}

// Export for manual initialization
window.initializeAnalytics = () => {
    if (!analyticsInstance) {
        analyticsInstance = new RealTimeAnalyticsDashboard();
    }
    return analyticsInstance;
};

window.destroyAnalytics = () => {
    if (analyticsInstance) {
        analyticsInstance.destroy();
        analyticsInstance = null;
    }
};

console.log('📊 Real-Time Analytics Dashboard loaded successfully');