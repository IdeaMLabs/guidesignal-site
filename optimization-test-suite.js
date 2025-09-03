// Comprehensive Optimization Test Suite
// Automated testing for all performance and ML enhancements

class OptimizationTestSuite {
    constructor() {
        this.tests = [];
        this.results = new Map();
        this.startTime = performance.now();
        this.testResults = {
            performance: [],
            accessibility: [],
            seo: [],
            ai: [],
            security: [],
            functionality: []
        };
        
        this.init();
    }

    async init() {
        console.log('🧪 Initializing Optimization Test Suite...');
        this.setupTests();
        await this.runAllTests();
        this.generateReport();
    }

    setupTests() {
        // Performance Tests
        this.addTest('performance', 'Core Web Vitals', this.testCoreWebVitals.bind(this));
        this.addTest('performance', 'Resource Loading', this.testResourceLoading.bind(this));
        this.addTest('performance', 'Cache Performance', this.testCachePerformance.bind(this));
        this.addTest('performance', 'Image Optimization', this.testImageOptimization.bind(this));
        this.addTest('performance', 'JavaScript Performance', this.testJavaScriptPerformance.bind(this));
        
        // AI/ML Tests
        this.addTest('ai', 'AI Engine Availability', this.testAIEngineAvailability.bind(this));
        this.addTest('ai', 'ML Model Performance', this.testMLModelPerformance.bind(this));
        this.addTest('ai', 'Smart Search Functionality', this.testSmartSearchFunctionality.bind(this));
        this.addTest('ai', 'Real-time Matching', this.testRealTimeMatching.bind(this));
        this.addTest('ai', 'Predictive Analytics', this.testPredictiveAnalytics.bind(this));
        
        // Accessibility Tests
        this.addTest('accessibility', 'WCAG AA Compliance', this.testWCAGCompliance.bind(this));
        this.addTest('accessibility', 'Keyboard Navigation', this.testKeyboardNavigation.bind(this));
        this.addTest('accessibility', 'Screen Reader Support', this.testScreenReaderSupport.bind(this));
        this.addTest('accessibility', 'Color Contrast', this.testColorContrast.bind(this));
        
        // SEO Tests
        this.addTest('seo', 'Meta Tags', this.testMetaTags.bind(this));
        this.addTest('seo', 'Structured Data', this.testStructuredData.bind(this));
        this.addTest('seo', 'Page Speed', this.testPageSpeed.bind(this));
        this.addTest('seo', 'Mobile Responsiveness', this.testMobileResponsiveness.bind(this));
        
        // Security Tests
        this.addTest('security', 'HTTPS Enforcement', this.testHTTPSEnforcement.bind(this));
        this.addTest('security', 'Content Security Policy', this.testContentSecurityPolicy.bind(this));
        this.addTest('security', 'XSS Protection', this.testXSSProtection.bind(this));
        
        // Functionality Tests
        this.addTest('functionality', 'Service Worker', this.testServiceWorker.bind(this));
        this.addTest('functionality', 'PWA Features', this.testPWAFeatures.bind(this));
        this.addTest('functionality', 'Real-time Analytics', this.testRealTimeAnalytics.bind(this));
        this.addTest('functionality', 'Firebase Integration', this.testFirebaseIntegration.bind(this));
    }

    addTest(category, name, testFunction) {
        this.tests.push({
            category,
            name,
            function: testFunction,
            status: 'pending'
        });
    }

    async runAllTests() {
        console.log(`🏃‍♂️ Running ${this.tests.length} optimization tests...`);
        
        for (const test of this.tests) {
            try {
                console.log(`Running: ${test.category} - ${test.name}`);
                const result = await test.function();
                
                this.testResults[test.category].push({
                    name: test.name,
                    passed: result.passed,
                    score: result.score,
                    message: result.message,
                    metrics: result.metrics,
                    duration: result.duration
                });
                
                test.status = result.passed ? 'passed' : 'failed';
                
            } catch (error) {
                console.error(`Test failed: ${test.name}`, error);
                
                this.testResults[test.category].push({
                    name: test.name,
                    passed: false,
                    score: 0,
                    message: `Test error: ${error.message}`,
                    metrics: {},
                    duration: 0
                });
                
                test.status = 'error';
            }
        }
        
        console.log('✅ All tests completed');
    }

    // ==================== PERFORMANCE TESTS ====================
    
    async testCoreWebVitals() {
        const startTime = performance.now();
        
        return new Promise((resolve) => {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                let fcp = null, lcp = null, cls = 0, fid = null;
                
                entries.forEach(entry => {
                    switch (entry.entryType) {
                        case 'paint':
                            if (entry.name === 'first-contentful-paint') fcp = entry.startTime;
                            break;
                        case 'largest-contentful-paint':
                            lcp = entry.startTime;
                            break;
                        case 'layout-shift':
                            if (!entry.hadRecentInput) cls += entry.value;
                            break;
                        case 'first-input':
                            fid = entry.processingStart - entry.startTime;
                            break;
                    }
                });
                
                // Fallback values if metrics not available
                if (fcp === null) fcp = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
                if (lcp === null) lcp = performance.timing.loadEventEnd - performance.timing.navigationStart;
                
                const scores = {
                    fcp: fcp < 1800 ? 100 : fcp < 3000 ? 75 : 50,
                    lcp: lcp < 2500 ? 100 : lcp < 4000 ? 75 : 50,
                    cls: cls < 0.1 ? 100 : cls < 0.25 ? 75 : 50,
                    fid: fid < 100 ? 100 : fid < 300 ? 75 : 50
                };
                
                const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
                
                resolve({
                    passed: avgScore >= 75,
                    score: Math.round(avgScore),
                    message: `Core Web Vitals: FCP ${fcp?.toFixed(0)}ms, LCP ${lcp?.toFixed(0)}ms, CLS ${cls?.toFixed(3)}, FID ${fid?.toFixed(0) || 'N/A'}ms`,
                    metrics: { fcp, lcp, cls, fid, avgScore },
                    duration: performance.now() - startTime
                });
            });
            
            try {
                observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
                
                // Timeout fallback
                setTimeout(() => {
                    observer.disconnect();
                    resolve({
                        passed: false,
                        score: 0,
                        message: 'Core Web Vitals measurement timed out',
                        metrics: {},
                        duration: performance.now() - startTime
                    });
                }, 5000);
            } catch (e) {
                resolve({
                    passed: false,
                    score: 0,
                    message: 'Core Web Vitals not supported',
                    metrics: {},
                    duration: performance.now() - startTime
                });
            }
        });
    }

    async testResourceLoading() {
        const startTime = performance.now();
        const resources = performance.getEntriesByType('resource');
        
        const criticalResources = resources.filter(resource => 
            resource.name.includes('.css') || 
            resource.name.includes('.js') ||
            resource.name.includes('GuideSignalLogo')
        );
        
        const slowResources = criticalResources.filter(resource => resource.duration > 1000);
        const failedResources = criticalResources.filter(resource => resource.responseStart === 0);
        
        const avgLoadTime = criticalResources.reduce((sum, resource) => sum + resource.duration, 0) / criticalResources.length;
        
        const score = Math.max(0, 100 - (slowResources.length * 20) - (failedResources.length * 30));
        
        return {
            passed: score >= 80,
            score: Math.round(score),
            message: `Resource Loading: ${criticalResources.length} critical resources, ${slowResources.length} slow, ${failedResources.length} failed, avg ${avgLoadTime.toFixed(0)}ms`,
            metrics: {
                totalResources: criticalResources.length,
                slowResources: slowResources.length,
                failedResources: failedResources.length,
                avgLoadTime
            },
            duration: performance.now() - startTime
        };
    }

    async testCachePerformance() {
        const startTime = performance.now();
        
        // Test if service worker is active
        const swRegistration = await navigator.serviceWorker?.getRegistration();
        const hasServiceWorker = swRegistration?.active !== null;
        
        // Test cache hit rate by checking resource timing
        const resources = performance.getEntriesByType('resource');
        const cachedResources = resources.filter(resource => resource.transferSize === 0 && resource.decodedBodySize > 0);
        const cacheHitRate = resources.length > 0 ? (cachedResources.length / resources.length) * 100 : 0;
        
        const score = Math.round((hasServiceWorker ? 50 : 0) + (cacheHitRate * 0.5));
        
        return {
            passed: score >= 70,
            score,
            message: `Cache Performance: Service Worker ${hasServiceWorker ? 'active' : 'inactive'}, ${cacheHitRate.toFixed(1)}% cache hit rate`,
            metrics: {
                hasServiceWorker,
                cacheHitRate,
                totalResources: resources.length,
                cachedResources: cachedResources.length
            },
            duration: performance.now() - startTime
        };
    }

    // ==================== AI/ML TESTS ====================
    
    async testAIEngineAvailability() {
        const startTime = performance.now();
        
        const hasAIEngine = typeof window.aiEngine !== 'undefined';
        const hasEnhancedAI = typeof window.enhancedAI !== 'undefined';
        const hasSmartSearch = typeof window.smartSearch !== 'undefined';
        
        const score = (hasAIEngine ? 40 : 0) + (hasEnhancedAI ? 30 : 0) + (hasSmartSearch ? 30 : 0);
        
        return {
            passed: score >= 70,
            score,
            message: `AI Engine: Base ${hasAIEngine ? '✓' : '✗'}, Enhanced ${hasEnhancedAI ? '✓' : '✗'}, Smart Search ${hasSmartSearch ? '✓' : '✗'}`,
            metrics: { hasAIEngine, hasEnhancedAI, hasSmartSearch },
            duration: performance.now() - startTime
        };
    }

    async testMLModelPerformance() {
        const startTime = performance.now();
        
        if (typeof window.aiEngine === 'undefined') {
            return {
                passed: false,
                score: 0,
                message: 'AI Engine not available',
                metrics: {},
                duration: performance.now() - startTime
            };
        }
        
        try {
            const accuracy = window.aiEngine.getModelAccuracy();
            const totalPredictions = window.aiEngine.performanceMetrics?.totalPredictions || 0;
            
            const accuracyScore = accuracy >= 85 ? 100 : accuracy >= 75 ? 80 : accuracy >= 65 ? 60 : 40;
            const predictionScore = totalPredictions > 0 ? 100 : 50;
            
            const finalScore = (accuracyScore + predictionScore) / 2;
            
            return {
                passed: finalScore >= 75,
                score: Math.round(finalScore),
                message: `ML Performance: ${accuracy.toFixed(1)}% accuracy, ${totalPredictions} predictions`,
                metrics: { accuracy, totalPredictions },
                duration: performance.now() - startTime
            };
        } catch (error) {
            return {
                passed: false,
                score: 0,
                message: `ML Performance test error: ${error.message}`,
                metrics: {},
                duration: performance.now() - startTime
            };
        }
    }

    async testSmartSearchFunctionality() {
        const startTime = performance.now();
        
        if (typeof window.smartSearch === 'undefined') {
            return {
                passed: false,
                score: 0,
                message: 'Smart Search not available',
                metrics: {},
                duration: performance.now() - startTime
            };
        }
        
        try {
            // Test search suggestions
            const suggestions = await window.smartSearch.getSmartSuggestions('developer');
            const hasValidSuggestions = suggestions && suggestions.length > 0;
            
            // Test search performance
            const searchStartTime = performance.now();
            await window.smartSearch.getSmartSuggestions('engineer');
            const searchTime = performance.now() - searchStartTime;
            
            const suggestionScore = hasValidSuggestions ? 60 : 0;
            const performanceScore = searchTime < 500 ? 40 : searchTime < 1000 ? 20 : 0;
            
            const finalScore = suggestionScore + performanceScore;
            
            return {
                passed: finalScore >= 60,
                score: finalScore,
                message: `Smart Search: ${suggestions?.length || 0} suggestions, ${searchTime.toFixed(0)}ms response time`,
                metrics: { suggestionCount: suggestions?.length || 0, searchTime },
                duration: performance.now() - startTime
            };
        } catch (error) {
            return {
                passed: false,
                score: 0,
                message: `Smart Search test error: ${error.message}`,
                metrics: {},
                duration: performance.now() - startTime
            };
        }
    }

    // ==================== ACCESSIBILITY TESTS ====================
    
    async testWCAGCompliance() {
        const startTime = performance.now();
        
        const issues = [];
        let score = 100;
        
        // Check for alt attributes on images
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
        if (imagesWithoutAlt.length > 0) {
            issues.push(`${imagesWithoutAlt.length} images missing alt text`);
            score -= 20;
        }
        
        // Check for proper heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const hasH1 = document.querySelector('h1') !== null;
        if (!hasH1) {
            issues.push('Missing h1 heading');
            score -= 15;
        }
        
        // Check for focus indicators
        const focusableElements = document.querySelectorAll('a, button, input, textarea, select');
        let hasCustomFocus = false;
        try {
            const styles = getComputedStyle(document.documentElement);
            hasCustomFocus = styles.getPropertyValue('--custom-focus') !== '';
        } catch (e) {
            // Check for focus styles in CSS
            hasCustomFocus = document.styleSheets.length > 0;
        }
        
        if (!hasCustomFocus) {
            issues.push('No custom focus indicators detected');
            score -= 10;
        }
        
        return {
            passed: score >= 80,
            score: Math.max(0, score),
            message: `WCAG Compliance: ${issues.length > 0 ? issues.join(', ') : 'All basic checks passed'}`,
            metrics: {
                imagesWithoutAlt: imagesWithoutAlt.length,
                totalImages: images.length,
                hasH1,
                totalHeadings: headings.length,
                focusableElements: focusableElements.length
            },
            duration: performance.now() - startTime
        };
    }

    // ==================== SEO TESTS ====================
    
    async testMetaTags() {
        const startTime = performance.now();
        
        const requiredTags = [
            { selector: 'title', name: 'Title' },
            { selector: 'meta[name="description"]', name: 'Description' },
            { selector: 'meta[property="og:title"]', name: 'OG Title' },
            { selector: 'meta[property="og:description"]', name: 'OG Description' },
            { selector: 'meta[name="viewport"]', name: 'Viewport' }
        ];
        
        const missingTags = [];
        let score = 100;
        
        requiredTags.forEach(tag => {
            const element = document.querySelector(tag.selector);
            if (!element || !element.content && !element.textContent) {
                missingTags.push(tag.name);
                score -= 20;
            }
        });
        
        return {
            passed: score >= 80,
            score: Math.max(0, score),
            message: `Meta Tags: ${missingTags.length > 0 ? `Missing: ${missingTags.join(', ')}` : 'All required tags present'}`,
            metrics: {
                requiredTags: requiredTags.length,
                missingTags: missingTags.length,
                presentTags: requiredTags.length - missingTags.length
            },
            duration: performance.now() - startTime
        };
    }

    async testStructuredData() {
        const startTime = performance.now();
        
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        let validStructuredData = 0;
        
        jsonLdScripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@context'] && data['@type']) {
                    validStructuredData++;
                }
            } catch (e) {
                // Invalid JSON-LD
            }
        });
        
        const score = validStructuredData > 0 ? 100 : 0;
        
        return {
            passed: score >= 50,
            score,
            message: `Structured Data: ${validStructuredData} valid JSON-LD blocks found`,
            metrics: {
                totalScripts: jsonLdScripts.length,
                validStructuredData
            },
            duration: performance.now() - startTime
        };
    }

    // ==================== FUNCTIONALITY TESTS ====================
    
    async testServiceWorker() {
        const startTime = performance.now();
        
        if (!('serviceWorker' in navigator)) {
            return {
                passed: false,
                score: 0,
                message: 'Service Worker not supported',
                metrics: {},
                duration: performance.now() - startTime
            };
        }
        
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            const isActive = registration && registration.active;
            const isControlling = navigator.serviceWorker.controller !== null;
            
            const score = (isActive ? 50 : 0) + (isControlling ? 50 : 0);
            
            return {
                passed: score >= 50,
                score,
                message: `Service Worker: ${isActive ? 'Active' : 'Inactive'}, ${isControlling ? 'Controlling' : 'Not controlling'}`,
                metrics: { isActive, isControlling },
                duration: performance.now() - startTime
            };
        } catch (error) {
            return {
                passed: false,
                score: 0,
                message: `Service Worker test error: ${error.message}`,
                metrics: {},
                duration: performance.now() - startTime
            };
        }
    }

    async testRealTimeAnalytics() {
        const startTime = performance.now();
        
        // Check if analytics dashboard is available
        const hasAnalytics = typeof window.initializeAnalytics === 'function';
        
        // Check if performance metrics are being collected
        const hasPerformanceMetrics = typeof window.performanceMetrics !== 'undefined';
        
        const score = (hasAnalytics ? 50 : 0) + (hasPerformanceMetrics ? 50 : 0);
        
        return {
            passed: score >= 50,
            score,
            message: `Real-time Analytics: Dashboard ${hasAnalytics ? 'Available' : 'Not found'}, Metrics ${hasPerformanceMetrics ? 'Active' : 'Inactive'}`,
            metrics: { hasAnalytics, hasPerformanceMetrics },
            duration: performance.now() - startTime
        };
    }

    // ==================== REPORT GENERATION ====================
    
    generateReport() {
        const totalTests = this.tests.length;
        const passedTests = this.tests.filter(test => test.status === 'passed').length;
        const failedTests = this.tests.filter(test => test.status === 'failed').length;
        const errorTests = this.tests.filter(test => test.status === 'error').length;
        
        const overallScore = this.calculateOverallScore();
        const totalDuration = performance.now() - this.startTime;
        
        const report = {
            summary: {
                totalTests,
                passedTests,
                failedTests,
                errorTests,
                overallScore,
                duration: totalDuration,
                timestamp: new Date().toISOString()
            },
            categories: this.testResults,
            recommendations: this.generateRecommendations()
        };
        
        console.log('📊 Optimization Test Report Generated');
        console.table(report.summary);
        
        // Display detailed results
        Object.entries(this.testResults).forEach(([category, tests]) => {
            if (tests.length > 0) {
                console.group(`${category.toUpperCase()} Tests`);
                tests.forEach(test => {
                    console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.score}/100 - ${test.message}`);
                });
                console.groupEnd();
            }
        });
        
        // Display recommendations
        if (report.recommendations.length > 0) {
            console.group('🔧 Recommendations');
            report.recommendations.forEach(rec => console.log(`• ${rec}`));
            console.groupEnd();
        }
        
        // Store report for external access
        window.optimizationReport = report;
        
        return report;
    }

    calculateOverallScore() {
        const allResults = Object.values(this.testResults).flat();
        if (allResults.length === 0) return 0;
        
        const totalScore = allResults.reduce((sum, test) => sum + test.score, 0);
        return Math.round(totalScore / allResults.length);
    }

    generateRecommendations() {
        const recommendations = [];
        const allResults = Object.values(this.testResults).flat();
        
        // Performance recommendations
        const performanceTests = this.testResults.performance;
        const avgPerformanceScore = this.calculateCategoryAverage('performance');
        
        if (avgPerformanceScore < 80) {
            recommendations.push('Consider implementing additional performance optimizations (lazy loading, code splitting)');
        }
        
        // AI/ML recommendations
        const aiTests = this.testResults.ai;
        const avgAIScore = this.calculateCategoryAverage('ai');
        
        if (avgAIScore < 70) {
            recommendations.push('AI/ML features need improvement - check model training and prediction accuracy');
        }
        
        // Accessibility recommendations
        const a11yScore = this.calculateCategoryAverage('accessibility');
        if (a11yScore < 80) {
            recommendations.push('Improve accessibility compliance - focus on alt text, focus indicators, and ARIA labels');
        }
        
        // SEO recommendations
        const seoScore = this.calculateCategoryAverage('seo');
        if (seoScore < 80) {
            recommendations.push('Enhance SEO optimization - add missing meta tags and structured data');
        }
        
        return recommendations;
    }

    calculateCategoryAverage(category) {
        const tests = this.testResults[category];
        if (tests.length === 0) return 0;
        
        const total = tests.reduce((sum, test) => sum + test.score, 0);
        return Math.round(total / tests.length);
    }
}

// Auto-run tests when page loads (can be disabled)
if (window.location.search.includes('test=true') || localStorage.getItem('runOptimizationTests') === 'true') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.optimizationTests = new OptimizationTestSuite();
        }, 2000); // Wait for other scripts to load
    });
}

// Manual test runner
window.runOptimizationTests = () => {
    return new OptimizationTestSuite();
};

console.log('🧪 Optimization Test Suite loaded. Run with: runOptimizationTests() or add ?test=true to URL');