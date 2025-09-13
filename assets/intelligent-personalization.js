/**
 * GuideSignal Intelligent Personalization Engine
 * Advanced user experience optimization based on behavior analysis
 */

class IntelligentPersonalization {
    constructor() {
        this.userProfile = {};
        this.behaviorTracker = new BehaviorTracker();
        this.contentOptimizer = new ContentOptimizer();
        this.conversionOptimizer = new ConversionOptimizer();
        this.isInitialized = false;
        
        this.userSegments = {
            FIRST_TIME_VISITOR: 'first_time',
            RETURNING_VISITOR: 'returning',
            ACTIVE_JOB_SEEKER: 'active_seeker',
            PASSIVE_CANDIDATE: 'passive_candidate',
            EMPLOYER_PROSPECT: 'employer_prospect',
            ENGAGED_EMPLOYER: 'engaged_employer'
        };
        
        this.personalizationRules = new Map();
        this.abTestVariants = new Map();
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            await Promise.all([
                this.loadUserProfile(),
                this.behaviorTracker.initialize(),
                this.setupPersonalizationRules(),
                this.loadABTestConfiguration()
            ]);

            this.startPersonalization();
            this.isInitialized = true;

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Core personalization logic
    async personalizeExperience() {
        const userSegment = await this.determineUserSegment();
        const userIntent = await this.detectUserIntent();
        const behaviorData = this.behaviorTracker.getBehaviorData();

        // Apply personalization based on user segment
        await this.personalizeContent(userSegment, userIntent);
        await this.personalizeNavigation(userSegment);
        await this.personalizeCTA(userSegment, behaviorData);
        await this.personalizeMessaging(userSegment, userIntent);

        // Track personalization effectiveness
        this.trackPersonalizationImpact(userSegment, userIntent);
    }

    // Determine user segment based on behavior and data
    async determineUserSegment() {
        const visitCount = this.getVisitCount();
        const timeOnSite = this.behaviorTracker.getTimeOnSite();
        const pageViews = this.behaviorTracker.getPageViews();
        const interactions = this.behaviorTracker.getInteractionCount();

        // First-time visitor
        if (visitCount === 1 && timeOnSite < 30) {
            return this.userSegments.FIRST_TIME_VISITOR;
        }

        // Active job seeker patterns
        if (pageViews.includes('jobs.html') && interactions > 3) {
            return this.userSegments.ACTIVE_JOB_SEEKER;
        }

        // Employer prospect patterns
        if (pageViews.includes('post.html') || pageViews.includes('recruiter')) {
            return this.userSegments.EMPLOYER_PROSPECT;
        }

        // Passive candidate (browsing but not applying)
        if (timeOnSite > 60 && interactions < 2) {
            return this.userSegments.PASSIVE_CANDIDATE;
        }

        // Returning visitor
        if (visitCount > 1) {
            return this.userSegments.RETURNING_VISITOR;
        }

        return this.userSegments.FIRST_TIME_VISITOR;
    }

    // Detect user intent from behavior patterns
    async detectUserIntent() {
        const currentPage = window.location.pathname;
        const referrer = document.referrer;
        const scrollDepth = this.behaviorTracker.getScrollDepth();
        const clickPatterns = this.behaviorTracker.getClickPatterns();

        const intents = {
            JOB_SEEKING: 0,
            HIRING: 0,
            RESEARCHING: 0,
            COMPARING: 0
        };

        // Analyze current page for intent signals
        if (currentPage.includes('jobs') || currentPage.includes('apply')) {
            intents.JOB_SEEKING += 0.4;
        }

        if (currentPage.includes('post') || currentPage.includes('recruiter')) {
            intents.HIRING += 0.4;
        }

        // Analyze referrer for context
        if (referrer.includes('linkedin') || referrer.includes('indeed')) {
            intents.COMPARING += 0.3;
        }

        if (referrer.includes('google') && referrer.includes('job')) {
            intents.JOB_SEEKING += 0.3;
        }

        // Analyze behavior patterns
        if (scrollDepth > 75) {
            intents.RESEARCHING += 0.2;
        }

        if (clickPatterns.includes('pricing') || clickPatterns.includes('how-it-works')) {
            intents.RESEARCHING += 0.3;
        }

        // Return highest scoring intent
        return Object.keys(intents).reduce((a, b) => 
            intents[a] > intents[b] ? a : b
        );
    }

    // Personalize content based on segment and intent
    async personalizeContent(userSegment, userIntent) {
        const contentRules = this.personalizationRules.get('content');
        const rule = contentRules[userSegment]?.[userIntent];

        if (rule) {
            await this.applyContentRule(rule);
        }

        // Default personalization fallbacks
        await this.personalizeHeadline(userSegment, userIntent);
        await this.personalizeValueProposition(userSegment);
        await this.personalizeSocialProof(userSegment);
    }

    // Dynamic headline personalization
    async personalizeHeadline(userSegment, userIntent) {
        const headlines = {
            [this.userSegments.FIRST_TIME_VISITOR]: {
                JOB_SEEKING: "Skip the Black Hole - Jobs That Actually Reply",
                HIRING: "Hire Faster with Guaranteed Response Times",
                RESEARCHING: "The Job Platform That Solves the Response Problem"
            },
            [this.userSegments.ACTIVE_JOB_SEEKER]: {
                JOB_SEEKING: "Welcome Back - 12 New Fast-Reply Jobs Added",
                COMPARING: "Why GuideSignal Beats Traditional Job Boards"
            },
            [this.userSegments.EMPLOYER_PROSPECT]: {
                HIRING: "Join 247 Employers Who Reply Fast & Hire Better",
                RESEARCHING: "See How Fast Replies Improve Your Hiring Results"
            },
            [this.userSegments.PASSIVE_CANDIDATE]: {
                JOB_SEEKING: "Not Actively Looking? See Jobs Worth Your Time",
                RESEARCHING: "Discover Opportunities Without the Usual Hassle"
            }
        };

        const headline = headlines[userSegment]?.[userIntent];
        if (headline) {
            this.updateHeadline(headline);
        }
    }

    // Personalize value proposition messaging
    async personalizeValueProposition(userSegment) {
        const valueProps = {
            [this.userSegments.FIRST_TIME_VISITOR]: "Every job guarantees a response within 48 hours. No more wondering if your application was seen.",
            [this.userSegments.ACTIVE_JOB_SEEKER]: "You've applied to jobs before. Here's what makes us different: guaranteed responses, quality employers, transparent process.",
            [this.userSegments.EMPLOYER_PROSPECT]: "Reduce time-to-hire by 40% and improve candidate quality with our fast-response commitment.",
            [this.userSegments.PASSIVE_CANDIDATE]: "Browse without pressure. Only see opportunities from employers who respect your time.",
            [this.userSegments.RETURNING_VISITOR]: "Welcome back! Here's what's new since your last visit."
        };

        const valueProp = valueProps[userSegment];
        if (valueProp) {
            this.updateValueProposition(valueProp);
        }
    }

    // Dynamic social proof based on user context
    async personalizeSocialProof(userSegment) {
        const socialProofs = {
            [this.userSegments.FIRST_TIME_VISITOR]: "1,247 professionals got responses this week",
            [this.userSegments.ACTIVE_JOB_SEEKER]: "Sarah from your industry got 3 interviews last week",
            [this.userSegments.EMPLOYER_PROSPECT]: "Companies hiring through us fill roles 40% faster",
            [this.userSegments.PASSIVE_CANDIDATE]: "Top talent discovers opportunities here first"
        };

        const proof = socialProofs[userSegment];
        if (proof) {
            this.updateSocialProof(proof);
        }
    }

    // Personalize CTAs based on user behavior
    async personalizeCTA(userSegment, behaviorData) {
        const ctaVariants = {
            [this.userSegments.FIRST_TIME_VISITOR]: {
                primary: "See Fast-Reply Jobs",
                secondary: "How It Works"
            },
            [this.userSegments.ACTIVE_JOB_SEEKER]: {
                primary: "Find Your Match",
                secondary: "View New Jobs"
            },
            [this.userSegments.EMPLOYER_PROSPECT]: {
                primary: "Post a Fast-Reply Job",
                secondary: "See Success Stories"
            },
            [this.userSegments.PASSIVE_CANDIDATE]: {
                primary: "Browse Opportunities",
                secondary: "Set Job Alerts"
            },
            [this.userSegments.RETURNING_VISITOR]: {
                primary: "Continue Where You Left Off",
                secondary: "See What's New"
            }
        };

        const ctas = ctaVariants[userSegment];
        if (ctas) {
            this.updateCTAs(ctas);
        }

        // Urgency-based CTA optimization
        if (behaviorData.timeOnSite > 120) {
            this.addUrgencyToCTA("Limited spots available this week");
        }
    }

    // Smart form optimization based on user behavior
    optimizeFormExperience(formType, userSegment) {
        const optimizations = {
            signup: {
                [this.userSegments.FIRST_TIME_VISITOR]: {
                    fields: ['email', 'primary_interest'],
                    prefill: false,
                    social_proof: "Join 2,500+ job seekers getting fast replies"
                },
                [this.userSegments.RETURNING_VISITOR]: {
                    fields: ['email', 'password'],
                    prefill: true,
                    social_proof: "Welcome back! 12 new matches since your last visit"
                }
            },
            application: {
                [this.userSegments.ACTIVE_JOB_SEEKER]: {
                    auto_fill: true,
                    quick_apply: true,
                    show_match_score: true
                },
                [this.userSegments.PASSIVE_CANDIDATE]: {
                    minimal_fields: true,
                    save_for_later: true,
                    no_commitment_language: true
                }
            }
        };

        return optimizations[formType]?.[userSegment] || {};
    }

    // Real-time content adaptation
    async adaptContentInRealTime() {
        const engagement = this.behaviorTracker.getEngagementScore();
        const timeOnPage = this.behaviorTracker.getTimeOnCurrentPage();
        
        // Low engagement interventions
        if (engagement < 0.3 && timeOnPage > 30) {
            this.showEngagementBooster();
        }

        // Exit intent detection
        if (this.behaviorTracker.detectExitIntent()) {
            this.showExitIntentModal();
        }

        // High engagement rewards
        if (engagement > 0.8) {
            this.showEngagementReward();
        }
    }

    // A/B test integration
    async runPersonalizedABTest(testName, userSegment) {
        const test = this.abTestVariants.get(testName);
        if (!test) return null;

        // Get variant based on user segment and previous behavior
        const variantKey = this.getPersonalizedVariant(test, userSegment);
        const variant = test.variants[variantKey];

        // Apply variant and track
        this.applyVariant(variant);
        this.trackABTestExposure(testName, variantKey, userSegment);

        return variant;
    }

    // Conversion optimization based on user journey stage
    optimizeConversionPath(userSegment, currentPage) {
        const optimizations = {
            [this.userSegments.FIRST_TIME_VISITOR]: {
                'index.html': { action: 'education_first', next: 'how.html' },
                'jobs.html': { action: 'value_demonstration', next: 'apply_sample' },
                'auth.html': { action: 'reduce_friction', remove: ['role_selection'] }
            },
            [this.userSegments.ACTIVE_JOB_SEEKER]: {
                'index.html': { action: 'direct_to_jobs', next: 'jobs.html' },
                'jobs.html': { action: 'show_matches', highlight: 'match_score' },
                'apply.html': { action: 'quick_apply', prefill: true }
            },
            [this.userSegments.EMPLOYER_PROSPECT]: {
                'index.html': { action: 'employer_focus', next: 'post.html' },
                'post.html': { action: 'success_stories_first', reduce: 'commitment_language' },
                'auth.html': { action: 'employer_benefits', highlight: 'roi_metrics' }
            }
        };

        return optimizations[userSegment]?.[currentPage] || {};
    }

    // ML-driven content recommendations
    async generateContentRecommendations(userProfile, behaviorData) {
        const recommendations = {
            jobs: await this.recommendJobs(userProfile, behaviorData),
            content: await this.recommendContent(userProfile, behaviorData),
            actions: await this.recommendActions(userProfile, behaviorData)
        };

        return recommendations;
    }

    // Dynamic pricing and value presentation
    personalizeValuePresentation(userSegment, userIntent) {
        const presentations = {
            [this.userSegments.EMPLOYER_PROSPECT]: {
                HIRING: {
                    focus: 'time_to_hire_reduction',
                    metric: '40% faster hiring',
                    social_proof: 'quality_of_candidates',
                    risk_reduction: '48h_response_guarantee'
                },
                RESEARCHING: {
                    focus: 'market_differentiation',
                    metric: 'candidate_satisfaction_scores',
                    social_proof: 'peer_companies',
                    risk_reduction: 'trial_options'
                }
            },
            [this.userSegments.ACTIVE_JOB_SEEKER]: {
                JOB_SEEKING: {
                    focus: 'response_guarantee',
                    metric: '48_hour_replies',
                    social_proof: 'success_stories',
                    risk_reduction: 'free_to_use'
                }
            }
        };

        return presentations[userSegment]?.[userIntent] || {};
    }

    // Behavioral trigger implementation
    setupBehavioralTriggers() {
        // Scroll depth triggers
        this.behaviorTracker.onScrollDepth(50, () => {
            this.trackEngagement('scroll_50');
            this.considerPersonalizationAdjustment();
        });

        this.behaviorTracker.onScrollDepth(75, () => {
            this.showEngagementAppreciation();
        });

        // Time-based triggers
        this.behaviorTracker.onTimeThreshold(60, () => {
            this.trackEngagement('time_60s');
            this.showValueReinforcement();
        });

        this.behaviorTracker.onTimeThreshold(180, () => {
            this.showAdvancedPersonalization();
        });

        // Interaction triggers
        this.behaviorTracker.onInteractionCount(5, () => {
            this.trackEngagement('interactions_5');
            this.personalizeForActiveUser();
        });

        // Exit intent trigger
        this.behaviorTracker.onExitIntent(() => {
            this.showExitIntentPersonalization();
        });
    }

    // Utility methods for DOM manipulation
    updateHeadline(text) {
        const headline = document.querySelector('h1');
        if (headline) {
            headline.textContent = text;
            this.trackPersonalizationChange('headline', text);
        }
    }

    updateValueProposition(text) {
        const valueProp = document.querySelector('.subheadline, .value-prop');
        if (valueProp) {
            valueProp.textContent = text;
            this.trackPersonalizationChange('value_proposition', text);
        }
    }

    updateSocialProof(text) {
        const socialProof = document.querySelector('.social-proof, .founding-member');
        if (socialProof) {
            socialProof.textContent = text;
            this.trackPersonalizationChange('social_proof', text);
        }
    }

    updateCTAs(ctas) {
        const primaryCTA = document.querySelector('.cta-primary');
        const secondaryCTA = document.querySelector('.cta-secondary');

        if (primaryCTA && ctas.primary) {
            primaryCTA.textContent = ctas.primary;
        }

        if (secondaryCTA && ctas.secondary) {
            secondaryCTA.textContent = ctas.secondary;
        }

        this.trackPersonalizationChange('ctas', ctas);
    }

    // User profile and behavior tracking
    loadUserProfile() {
        try {
            const stored = localStorage.getItem('user_profile');
            this.userProfile = stored ? JSON.parse(stored) : {};
            
            // Initialize basic profile data
            if (!this.userProfile.id) {
                this.userProfile.id = this.generateUserId();
                this.userProfile.firstVisit = Date.now();
                this.userProfile.visitCount = 1;
            } else {
                this.userProfile.visitCount = (this.userProfile.visitCount || 1) + 1;
                this.userProfile.lastVisit = Date.now();
            }

            this.saveUserProfile();
        } catch (error) {
            this.userProfile = { id: this.generateUserId() };
        }
    }

    saveUserProfile() {
        try {
            localStorage.setItem('user_profile', JSON.stringify(this.userProfile));
        } catch (error) {
            // Handle storage errors gracefully
        }
    }

    getVisitCount() {
        return this.userProfile.visitCount || 1;
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Personalization rules setup
    setupPersonalizationRules() {
        // Content personalization rules
        this.personalizationRules.set('content', {
            [this.userSegments.FIRST_TIME_VISITOR]: {
                JOB_SEEKING: {
                    emphasize: ['response_guarantee', 'simplicity'],
                    hide: ['advanced_features', 'technical_details'],
                    cta_style: 'exploration'
                },
                HIRING: {
                    emphasize: ['hiring_efficiency', 'candidate_quality'],
                    hide: ['job_seeker_features'],
                    cta_style: 'trial_focused'
                }
            },
            [this.userSegments.RETURNING_VISITOR]: {
                default: {
                    emphasize: ['whats_new', 'progress_continuation'],
                    show: ['personalized_recommendations'],
                    cta_style: 'continuation'
                }
            }
        });

        // Navigation personalization rules  
        this.personalizationRules.set('navigation', {
            [this.userSegments.EMPLOYER_PROSPECT]: {
                primary_nav: ['Post Jobs', 'Success Stories', 'Pricing'],
                hide: ['Job Search', 'Application Tips']
            },
            [this.userSegments.ACTIVE_JOB_SEEKER]: {
                primary_nav: ['Browse Jobs', 'My Applications', 'Profile'],
                highlight: ['New Matches']
            }
        });
    }

    // A/B test configuration
    loadABTestConfiguration() {
        // Homepage headline test
        this.abTestVariants.set('homepage_headline', {
            variants: {
                control: { text: "Where a Job Finds You" },
                variant_a: { text: "Jobs That Actually Reply" },
                variant_b: { text: "Skip the Black Hole - Get Real Responses" },
                variant_c: { text: "48-Hour Reply Guarantee" }
            },
            traffic_split: { control: 0.25, variant_a: 0.25, variant_b: 0.25, variant_c: 0.25 },
            success_metric: 'cta_clicks',
            personalization_enabled: true
        });

        // CTA button test
        this.abTestVariants.set('cta_button', {
            variants: {
                control: { text: "Get Started Free", style: "primary" },
                variant_a: { text: "See Fast-Reply Jobs", style: "primary" },
                variant_b: { text: "Find Your Match", style: "primary" },
                variant_c: { text: "Browse Guaranteed Jobs", style: "primary" }
            },
            traffic_split: { control: 0.25, variant_a: 0.25, variant_b: 0.25, variant_c: 0.25 },
            success_metric: 'conversions'
        });
    }

    // Tracking and analytics
    trackPersonalizationChange(element, value) {
        const event = {
            type: 'personalization_applied',
            element: element,
            value: value,
            user_segment: this.userProfile.segment,
            timestamp: Date.now()
        };

        this.sendAnalyticsEvent(event);
    }

    trackPersonalizationImpact(userSegment, userIntent) {
        const impact = {
            user_segment: userSegment,
            user_intent: userIntent,
            personalization_applied: Date.now(),
            session_id: this.userProfile.sessionId || this.generateSessionId()
        };

        this.userProfile.personalization_history = this.userProfile.personalization_history || [];
        this.userProfile.personalization_history.push(impact);
        this.saveUserProfile();
    }

    sendAnalyticsEvent(event) {
        // Send to analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', event.type, {
                element: event.element,
                value: event.value,
                user_segment: event.user_segment
            });
        }

        // Store locally for analysis
        const events = JSON.parse(localStorage.getItem('personalization_events') || '[]');
        events.push(event);
        localStorage.setItem('personalization_events', JSON.stringify(events.slice(-100)));
    }

    // Initialize and start personalization
    startPersonalization() {
        this.personalizeExperience();
        this.setupBehavioralTriggers();
        this.startRealtimeAdaptation();
    }

    startRealtimeAdaptation() {
        // Check for adaptation opportunities every 30 seconds
        setInterval(() => {
            this.adaptContentInRealTime();
        }, 30000);
    }

    // Public API
    async optimize() {
        return await this.initialize();
    }

    getPersonalizationData() {
        return {
            userProfile: this.userProfile,
            currentSegment: this.determineUserSegment(),
            appliedPersonalizations: this.userProfile.personalization_history || []
        };
    }
}

// Behavior tracking class
class BehaviorTracker {
    constructor() {
        this.behaviors = {
            pageViews: [],
            clicks: [],
            scrollEvents: [],
            timeEvents: [],
            interactions: 0
        };
        
        this.startTime = Date.now();
        this.currentPageStartTime = Date.now();
        this.scrollDepth = 0;
        this.exitIntentDetected = false;
    }

    async initialize() {
        this.setupEventListeners();
        this.startTimeTracking();
    }

    setupEventListeners() {
        // Click tracking
        document.addEventListener('click', (event) => {
            this.trackClick(event);
        });

        // Scroll tracking
        window.addEventListener('scroll', () => {
            this.trackScroll();
        });

        // Mouse movement for exit intent
        document.addEventListener('mouseleave', () => {
            this.detectExitIntent();
        });

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackTimeSpent();
            }
        });
    }

    trackClick(event) {
        const clickData = {
            element: event.target.tagName,
            className: event.target.className,
            id: event.target.id,
            timestamp: Date.now(),
            page: window.location.pathname
        };

        this.behaviors.clicks.push(clickData);
        this.behaviors.interactions++;
    }

    trackScroll() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollPercent > this.scrollDepth) {
            this.scrollDepth = scrollPercent;
            
            // Trigger scroll depth callbacks
            this.triggerScrollDepthCallbacks(scrollPercent);
        }
    }

    getTimeOnSite() {
        return Date.now() - this.startTime;
    }

    getTimeOnCurrentPage() {
        return Date.now() - this.currentPageStartTime;
    }

    getScrollDepth() {
        return this.scrollDepth;
    }

    getPageViews() {
        return this.behaviors.pageViews.map(pv => pv.page);
    }

    getClickPatterns() {
        return this.behaviors.clicks.map(click => click.className).filter(Boolean);
    }

    getInteractionCount() {
        return this.behaviors.interactions;
    }

    getEngagementScore() {
        const timeScore = Math.min(this.getTimeOnSite() / 120000, 1); // Max 2 minutes
        const scrollScore = this.scrollDepth / 100;
        const interactionScore = Math.min(this.behaviors.interactions / 10, 1); // Max 10 interactions

        return (timeScore + scrollScore + interactionScore) / 3;
    }

    getBehaviorData() {
        return {
            timeOnSite: this.getTimeOnSite(),
            timeOnPage: this.getTimeOnCurrentPage(),
            scrollDepth: this.scrollDepth,
            interactions: this.behaviors.interactions,
            engagementScore: this.getEngagementScore(),
            clickPatterns: this.getClickPatterns()
        };
    }

    // Event callbacks
    onScrollDepth(depth, callback) {
        this.scrollDepthCallbacks = this.scrollDepthCallbacks || [];
        this.scrollDepthCallbacks.push({ depth, callback, triggered: false });
    }

    triggerScrollDepthCallbacks(currentDepth) {
        if (!this.scrollDepthCallbacks) return;

        this.scrollDepthCallbacks.forEach(item => {
            if (!item.triggered && currentDepth >= item.depth) {
                item.callback();
                item.triggered = true;
            }
        });
    }

    onTimeThreshold(seconds, callback) {
        setTimeout(callback, seconds * 1000);
    }

    onInteractionCount(count, callback) {
        this.interactionCallbacks = this.interactionCallbacks || [];
        this.interactionCallbacks.push({ count, callback, triggered: false });
        
        // Check if threshold reached
        this.interactionCallbacks.forEach(item => {
            if (!item.triggered && this.behaviors.interactions >= item.count) {
                item.callback();
                item.triggered = true;
            }
        });
    }

    onExitIntent(callback) {
        this.exitIntentCallback = callback;
    }

    detectExitIntent() {
        if (!this.exitIntentDetected && event.clientY <= 0) {
            this.exitIntentDetected = true;
            if (this.exitIntentCallback) {
                this.exitIntentCallback();
            }
        }
        return this.exitIntentDetected;
    }

    startTimeTracking() {
        // Track page view
        this.behaviors.pageViews.push({
            page: window.location.pathname,
            timestamp: Date.now(),
            referrer: document.referrer
        });
    }
}

// Content optimization helper
class ContentOptimizer {
    constructor() {
        this.optimizationHistory = [];
    }

    optimizeForSegment(segment, intent) {
        // Implementation for content optimization
    }
}

// Conversion optimization helper
class ConversionOptimizer {
    constructor() {
        this.conversionEvents = [];
    }

    optimizeConversionPath(userSegment, currentStep) {
        // Implementation for conversion optimization
    }
}

// Initialize and export
const intelligentPersonalization = new IntelligentPersonalization();

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        intelligentPersonalization.optimize();
    });
} else {
    intelligentPersonalization.optimize();
}

export default intelligentPersonalization;
export { IntelligentPersonalization, BehaviorTracker, ContentOptimizer, ConversionOptimizer };