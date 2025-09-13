/**
 * GuideSignal Smart Onboarding System
 * Intelligent user onboarding that reduces friction and increases conversions
 */

class SmartOnboarding {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 5;
        this.userContext = {};
        this.onboardingData = {};
        this.completionRate = 0;
        
        this.onboardingFlows = {
            JOB_SEEKER: 'job_seeker_flow',
            EMPLOYER: 'employer_flow',
            UNKNOWN: 'discovery_flow'
        };
        
        this.isActive = false;
        this.userIntent = null;
        this.personalizationEngine = null;
    }

    async initialize() {
        try {
            // Check if user needs onboarding
            if (this.shouldShowOnboarding()) {
                await this.setupOnboardingEnvironment();
                await this.detectUserIntent();
                await this.startOnboardingFlow();
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Determine if user needs onboarding
    shouldShowOnboarding() {
        const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
        const visitCount = parseInt(localStorage.getItem('visit_count') || '1');
        const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        
        // Show onboarding for new users
        if (!hasCompletedOnboarding && visitCount <= 2) {
            return true;
        }
        
        // Show onboarding for users who haven't taken core actions
        if (!userProfile.hasApplied && !userProfile.hasPostedJob && visitCount <= 5) {
            return true;
        }
        
        return false;
    }

    // Detect user intent from behavior and context
    async detectUserIntent() {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = window.location.pathname;
        const referrer = document.referrer;
        
        // URL parameter hints
        if (urlParams.get('role') === 'jobseeker') {
            this.userIntent = 'JOB_SEEKER';
            return;
        }
        if (urlParams.get('role') === 'recruiter') {
            this.userIntent = 'EMPLOYER';
            return;
        }
        
        // Page-based intent detection
        if (currentPage.includes('jobs') || currentPage.includes('apply')) {
            this.userIntent = 'JOB_SEEKER';
            return;
        }
        if (currentPage.includes('post') || currentPage.includes('recruiter')) {
            this.userIntent = 'EMPLOYER';
            return;
        }
        
        // Referrer-based intent detection
        if (referrer.includes('linkedin') || referrer.includes('indeed')) {
            this.userIntent = 'JOB_SEEKER';
            return;
        }
        
        // Default to discovery flow
        this.userIntent = 'UNKNOWN';
    }

    // Start the appropriate onboarding flow
    async startOnboardingFlow() {
        this.isActive = true;
        
        switch (this.userIntent) {
            case 'JOB_SEEKER':
                await this.startJobSeekerOnboarding();
                break;
            case 'EMPLOYER':
                await this.startEmployerOnboarding();
                break;
            default:
                await this.startDiscoveryOnboarding();
        }
    }

    // Job seeker onboarding flow
    async startJobSeekerOnboarding() {
        this.maxSteps = 4;
        
        const steps = [
            {
                step: 1,
                title: "Welcome to GuideSignal!",
                content: "We're different from other job boards. Here's why...",
                action: "show_value_proposition",
                data: {
                    headline: "Every job here guarantees a response within 48 hours",
                    bullets: [
                        "No more black hole applications",
                        "Quality employers who value your time", 
                        "Real feedback on every application"
                    ],
                    social_proof: "1,247 professionals got responses this week"
                }
            },
            {
                step: 2,
                title: "What type of opportunities interest you?",
                content: "This helps us show you the most relevant jobs",
                action: "collect_job_preferences",
                data: {
                    quick_options: [
                        "Remote tech jobs",
                        "Local opportunities", 
                        "Specific companies",
                        "Career advancement",
                        "Side projects",
                        "I'm just exploring"
                    ]
                }
            },
            {
                step: 3,
                title: "See how it works",
                content: "Let's show you a sample job match",
                action: "demonstrate_matching",
                data: {
                    sample_job: {
                        title: "Frontend Developer",
                        company: "TechCorp",
                        match_score: 87,
                        response_time: "12 hours avg",
                        explanation: "Strong match based on your interests"
                    }
                }
            },
            {
                step: 4,
                title: "Ready to start?",
                content: "Create your profile to see personalized matches",
                action: "minimal_signup",
                data: {
                    fields: ["email", "name"],
                    skip_options: ["Browse jobs first", "Set up later"],
                    value_reinforcement: "Start getting responses in 48 hours or less"
                }
            }
        ];
        
        await this.executeOnboardingSteps(steps);
    }

    // Employer onboarding flow  
    async startEmployerOnboarding() {
        this.maxSteps = 4;
        
        const steps = [
            {
                step: 1,
                title: "Hire faster with guaranteed responses",
                content: "Join employers who are transforming their hiring process",
                action: "show_employer_value",
                data: {
                    headline: "Reduce time-to-hire by 40% with our response commitment",
                    benefits: [
                        "Better candidate experience = higher acceptance rates",
                        "Quality candidates who know you're serious",
                        "Built-in accountability for faster decisions"
                    ],
                    social_proof: "247 employers have improved their hiring through GuideSignal"
                }
            },
            {
                step: 2,
                title: "What's your biggest hiring challenge?",
                content: "We'll customize GuideSignal to help you most",
                action: "collect_hiring_challenges",
                data: {
                    challenges: [
                        "Too many unqualified applicants",
                        "Good candidates don't respond",
                        "Hiring process takes too long",
                        "Hard to compete with big companies",
                        "Need better candidate experience",
                        "Looking to try something new"
                    ]
                }
            },
            {
                step: 3,
                title: "See what fast responses deliver",
                content: "Real results from employers using GuideSignal",
                action: "show_success_metrics",
                data: {
                    case_studies: [
                        {
                            company: "TechStartup Inc",
                            result: "Reduced time-to-hire from 6 weeks to 3 weeks",
                            metric: "50% improvement"
                        },
                        {
                            company: "Growing Agency",
                            result: "90% candidate response rate vs 30% before",
                            metric: "3x better engagement"
                        }
                    ]
                }
            },
            {
                step: 4,
                title: "Try the 48-hour challenge",
                content: "Post one job and see the difference fast responses make",
                action: "soft_commitment_signup",
                data: {
                    commitment: "Try responding to applications within 48 hours for one week",
                    support: "We'll help you maintain the commitment with reminders and tools",
                    risk_reduction: "No long-term commitment required"
                }
            }
        ];
        
        await this.executeOnboardingSteps(steps);
    }

    // Discovery onboarding flow for uncertain users
    async startDiscoveryOnboarding() {
        this.maxSteps = 3;
        
        const steps = [
            {
                step: 1,
                title: "What brings you to GuideSignal?",
                content: "Help us show you the most relevant information",
                action: "intent_discovery",
                data: {
                    options: [
                        {
                            id: "looking_for_job",
                            title: "Looking for a job",
                            description: "I want to find new opportunities",
                            icon: "👀",
                            next_flow: "JOB_SEEKER"
                        },
                        {
                            id: "hiring",
                            title: "Looking to hire",
                            description: "I need to find good candidates",
                            icon: "🎯",
                            next_flow: "EMPLOYER"
                        },
                        {
                            id: "exploring",
                            title: "Just exploring",
                            description: "Want to understand what this is about",
                            icon: "🔍",
                            next_flow: "EXPLORATION"
                        }
                    ]
                }
            },
            {
                step: 2,
                title: "Here's what makes us different",
                content: "The job search problem we're solving",
                action: "explain_problem_solution",
                data: {
                    problem: "85% of job applications never get a response. That's broken.",
                    solution: "We require every employer to respond within 48 hours.",
                    benefit: "Your time is respected. Always."
                }
            },
            {
                step: 3,
                title: "Want to see how it works?",
                content: "Choose your path to learn more",
                action: "choose_exploration_path", 
                data: {
                    paths: [
                        {
                            title: "Browse sample jobs",
                            description: "See what fast-reply jobs look like",
                            action: "browse_jobs"
                        },
                        {
                            title: "See employer success stories", 
                            description: "How companies benefit from fast responses",
                            action: "view_case_studies"
                        },
                        {
                            title: "Take a quick tour",
                            description: "5-minute walkthrough of key features",
                            action: "feature_tour"
                        }
                    ]
                }
            }
        ];
        
        await this.executeOnboardingSteps(steps);
    }

    // Execute onboarding steps
    async executeOnboardingSteps(steps) {
        for (const step of steps) {
            await this.showOnboardingStep(step);
            
            // Wait for user interaction
            const result = await this.waitForStepCompletion(step);
            
            // Process step result
            await this.processStepResult(step, result);
            
            // Update progress
            this.updateProgress();
            
            // Check if user wants to skip
            if (result.action === 'skip_onboarding') {
                break;
            }
        }
        
        await this.completeOnboarding();
    }

    // Show individual onboarding step
    async showOnboardingStep(step) {
        this.currentStep = step.step;
        
        // Create onboarding overlay
        const overlay = this.createOnboardingOverlay(step);
        document.body.appendChild(overlay);
        
        // Apply step-specific styling and interactions
        await this.applyStepActions(step);
        
        // Track step view
        this.trackOnboardingStep(step.step, 'viewed');
    }

    // Create onboarding overlay UI
    createOnboardingOverlay(step) {
        const overlay = document.createElement('div');
        overlay.id = 'smart-onboarding-overlay';
        overlay.className = 'onboarding-overlay';
        
        overlay.innerHTML = `
            <div class="onboarding-modal">
                <div class="onboarding-header">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(step.step / this.maxSteps) * 100}%"></div>
                    </div>
                    <button class="close-onboarding" aria-label="Close onboarding">×</button>
                </div>
                
                <div class="onboarding-content">
                    <h2>${step.title}</h2>
                    <p>${step.content}</p>
                    
                    <div class="step-content" id="step-content-${step.step}">
                        ${this.generateStepContent(step)}
                    </div>
                </div>
                
                <div class="onboarding-footer">
                    ${this.generateStepFooter(step)}
                </div>
            </div>
        `;
        
        // Add event listeners
        this.addOverlayEventListeners(overlay, step);
        
        return overlay;
    }

    // Generate step-specific content
    generateStepContent(step) {
        switch (step.action) {
            case 'show_value_proposition':
                return `
                    <div class="value-proposition">
                        <h3>${step.data.headline}</h3>
                        <ul class="benefit-list">
                            ${step.data.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                        </ul>
                        <div class="social-proof">${step.data.social_proof}</div>
                    </div>
                `;
                
            case 'collect_job_preferences':
                return `
                    <div class="preference-selector">
                        <div class="quick-options">
                            ${step.data.quick_options.map(option => 
                                `<button class="preference-option" data-preference="${option}">${option}</button>`
                            ).join('')}
                        </div>
                    </div>
                `;
                
            case 'demonstrate_matching':
                const job = step.data.sample_job;
                return `
                    <div class="job-match-demo">
                        <div class="sample-job-card">
                            <div class="job-header">
                                <h4>${job.title}</h4>
                                <span class="company">${job.company}</span>
                            </div>
                            <div class="match-score">
                                <div class="score-circle" data-score="${job.match_score}">
                                    <span class="score-number">${job.match_score}</span>
                                    <span class="score-label">Match</span>
                                </div>
                            </div>
                            <div class="response-time">
                                <span class="time-badge">${job.response_time}</span>
                                <span class="guarantee">Response guaranteed</span>
                            </div>
                        </div>
                        <div class="match-explanation">
                            <p>${job.explanation}</p>
                        </div>
                    </div>
                `;
                
            case 'intent_discovery':
                return `
                    <div class="intent-options">
                        ${step.data.options.map(option => `
                            <button class="intent-option" data-intent="${option.id}" data-flow="${option.next_flow}">
                                <span class="option-icon">${option.icon}</span>
                                <h4>${option.title}</h4>
                                <p>${option.description}</p>
                            </button>
                        `).join('')}
                    </div>
                `;
                
            case 'show_success_metrics':
                return `
                    <div class="success-metrics">
                        ${step.data.case_studies.map(study => `
                            <div class="case-study">
                                <h4>${study.company}</h4>
                                <p>${study.result}</p>
                                <span class="metric-highlight">${study.metric}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                
            default:
                return `<div class="default-content">${step.content}</div>`;
        }
    }

    // Generate step footer with appropriate CTAs
    generateStepFooter(step) {
        const isLastStep = step.step === this.maxSteps;
        
        let primaryCTA = isLastStep ? 'Get Started' : 'Continue';
        let secondaryCTA = step.step === 1 ? 'Skip Tour' : 'Back';
        
        // Customize CTAs based on step type
        if (step.action === 'minimal_signup') {
            primaryCTA = 'Create Profile';
            secondaryCTA = 'Browse Jobs First';
        }
        
        if (step.action === 'soft_commitment_signup') {
            primaryCTA = 'Try the Challenge';
            secondaryCTA = 'Learn More First';
        }
        
        return `
            <div class="onboarding-actions">
                <button class="btn-secondary onboarding-back" ${step.step === 1 ? 'style="visibility:hidden"' : ''}">
                    ${secondaryCTA}
                </button>
                <button class="btn-primary onboarding-continue">
                    ${primaryCTA}
                </button>
            </div>
            <div class="step-indicator">
                Step ${step.step} of ${this.maxSteps}
            </div>
        `;
    }

    // Add event listeners to overlay
    addOverlayEventListeners(overlay, step) {
        // Close button
        const closeBtn = overlay.querySelector('.close-onboarding');
        closeBtn.addEventListener('click', () => {
            this.skipOnboarding();
        });
        
        // Continue button
        const continueBtn = overlay.querySelector('.onboarding-continue');
        continueBtn.addEventListener('click', () => {
            this.completeStep(step);
        });
        
        // Back button
        const backBtn = overlay.querySelector('.onboarding-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.goBackStep();
            });
        }
        
        // Step-specific interactions
        this.addStepSpecificListeners(overlay, step);
        
        // Keyboard navigation
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.skipOnboarding();
            }
        });
    }

    // Add step-specific event listeners
    addStepSpecificListeners(overlay, step) {
        switch (step.action) {
            case 'collect_job_preferences':
                const preferenceOptions = overlay.querySelectorAll('.preference-option');
                preferenceOptions.forEach(option => {
                    option.addEventListener('click', (e) => {
                        // Toggle selection
                        e.target.classList.toggle('selected');
                        this.onboardingData.preferences = this.onboardingData.preferences || [];
                        
                        const preference = e.target.dataset.preference;
                        if (e.target.classList.contains('selected')) {
                            this.onboardingData.preferences.push(preference);
                        } else {
                            this.onboardingData.preferences = this.onboardingData.preferences.filter(p => p !== preference);
                        }
                        
                        // Enable continue button if selections made
                        const continueBtn = overlay.querySelector('.onboarding-continue');
                        continueBtn.disabled = this.onboardingData.preferences.length === 0;
                    });
                });
                break;
                
            case 'intent_discovery':
                const intentOptions = overlay.querySelectorAll('.intent-option');
                intentOptions.forEach(option => {
                    option.addEventListener('click', (e) => {
                        const intent = e.currentTarget.dataset.intent;
                        const flow = e.currentTarget.dataset.flow;
                        
                        this.onboardingData.detectedIntent = intent;
                        this.onboardingData.selectedFlow = flow;
                        
                        // Auto-advance for intent selection
                        setTimeout(() => {
                            this.completeStep(step);
                        }, 300);
                    });
                });
                break;
                
            case 'demonstrate_matching':
                // Animate the match score
                setTimeout(() => {
                    const scoreCircle = overlay.querySelector('.score-circle');
                    if (scoreCircle) {
                        scoreCircle.classList.add('animate-score');
                    }
                }, 500);
                break;
        }
    }

    // Wait for step completion
    waitForStepCompletion(step) {
        return new Promise((resolve) => {
            this.currentStepResolver = resolve;
        });
    }

    // Complete current step
    completeStep(step) {
        // Collect step data
        const stepData = this.collectStepData(step);
        this.onboardingData[`step_${step.step}`] = stepData;
        
        // Track completion
        this.trackOnboardingStep(step.step, 'completed', stepData);
        
        // Remove current overlay
        const overlay = document.getElementById('smart-onboarding-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Resolve step completion
        if (this.currentStepResolver) {
            this.currentStepResolver({ action: 'continue', data: stepData });
        }
    }

    // Collect data from current step
    collectStepData(step) {
        const overlay = document.getElementById('smart-onboarding-overlay');
        if (!overlay) return {};
        
        const stepData = {};
        
        switch (step.action) {
            case 'collect_job_preferences':
                stepData.preferences = this.onboardingData.preferences || [];
                break;
                
            case 'intent_discovery':
                stepData.intent = this.onboardingData.detectedIntent;
                stepData.flow = this.onboardingData.selectedFlow;
                break;
                
            case 'minimal_signup':
                const emailInput = overlay.querySelector('input[type="email"]');
                const nameInput = overlay.querySelector('input[name="name"]');
                stepData.email = emailInput?.value;
                stepData.name = nameInput?.value;
                break;
                
            case 'collect_hiring_challenges':
                const selectedChallenges = overlay.querySelectorAll('.challenge-option.selected');
                stepData.challenges = Array.from(selectedChallenges).map(el => el.dataset.challenge);
                break;
        }
        
        return stepData;
    }

    // Process step result and adapt next steps
    async processStepResult(step, result) {
        // Adapt onboarding based on user choices
        if (step.action === 'intent_discovery' && result.data.flow) {
            // Switch to appropriate flow based on discovered intent
            if (result.data.flow === 'JOB_SEEKER' && this.userIntent === 'UNKNOWN') {
                this.userIntent = 'JOB_SEEKER';
                // Restart with job seeker flow
                await this.startJobSeekerOnboarding();
                return;
            }
            
            if (result.data.flow === 'EMPLOYER' && this.userIntent === 'UNKNOWN') {
                this.userIntent = 'EMPLOYER';
                // Restart with employer flow
                await this.startEmployerOnboarding();
                return;
            }
        }
        
        // Personalization based on preferences
        if (step.action === 'collect_job_preferences' && result.data.preferences) {
            this.personalizeBasedOnPreferences(result.data.preferences);
        }
        
        // Update user profile with collected data
        this.updateUserProfile(result.data);
    }

    // Update progress indicator
    updateProgress() {
        this.completionRate = (this.currentStep / this.maxSteps) * 100;
        
        // Update progress bar if visible
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${this.completionRate}%`;
        }
    }

    // Complete entire onboarding process
    async completeOnboarding() {
        this.isActive = false;
        
        // Save completion status
        localStorage.setItem('onboarding_completed', 'true');
        localStorage.setItem('onboarding_completion_date', new Date().toISOString());
        
        // Save collected data
        localStorage.setItem('onboarding_data', JSON.stringify(this.onboardingData));
        
        // Track completion
        this.trackOnboardingStep('completed', 'full_completion', this.onboardingData);
        
        // Apply personalization based on collected data
        await this.applyOnboardingPersonalization();
        
        // Show completion message
        this.showOnboardingCompletion();
        
        // Redirect or continue to main experience
        setTimeout(() => {
            this.continueToMainExperience();
        }, 2000);
    }

    // Skip onboarding
    skipOnboarding() {
        this.isActive = false;
        
        // Track skip
        this.trackOnboardingStep('skipped', 'user_skip', { step: this.currentStep });
        
        // Remove overlay
        const overlay = document.getElementById('smart-onboarding-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Set minimal completion to avoid showing again soon
        localStorage.setItem('onboarding_skipped', 'true');
        localStorage.setItem('onboarding_skip_date', new Date().toISOString());
    }

    // Show onboarding completion
    showOnboardingCompletion() {
        const completionMessage = document.createElement('div');
        completionMessage.className = 'onboarding-completion';
        completionMessage.innerHTML = `
            <div class="completion-content">
                <div class="completion-icon">✨</div>
                <h3>You're all set!</h3>
                <p>Welcome to GuideSignal. Let's find you some opportunities that actually respond.</p>
            </div>
        `;
        
        document.body.appendChild(completionMessage);
        
        setTimeout(() => {
            completionMessage.remove();
        }, 3000);
    }

    // Continue to main experience after onboarding
    continueToMainExperience() {
        // Redirect based on user intent and collected data
        if (this.userIntent === 'JOB_SEEKER') {
            window.location.href = '/jobs.html';
        } else if (this.userIntent === 'EMPLOYER') {
            window.location.href = '/post.html';
        } else {
            // Stay on current page with personalized experience
            window.location.reload();
        }
    }

    // Apply personalization based on onboarding data
    async applyOnboardingPersonalization() {
        const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        
        // Update user profile with onboarding insights
        userProfile.onboardingCompleted = true;
        userProfile.detectedIntent = this.userIntent;
        userProfile.preferences = this.onboardingData.preferences || [];
        userProfile.challenges = this.onboardingData.challenges || [];
        
        // Set user segment based on onboarding
        if (this.userIntent === 'JOB_SEEKER') {
            userProfile.segment = 'active_job_seeker';
        } else if (this.userIntent === 'EMPLOYER') {
            userProfile.segment = 'employer_prospect';
        }
        
        localStorage.setItem('user_profile', JSON.stringify(userProfile));
        
        // Initialize personalization if available
        if (window.intelligentPersonalization) {
            await window.intelligentPersonalization.personalizeExperience();
        }
    }

    // Personalize based on preferences
    personalizeBasedOnPreferences(preferences) {
        // Update page content based on preferences
        if (preferences.includes('Remote tech jobs')) {
            this.emphasizeRemoteOpportunities();
        }
        
        if (preferences.includes('Local opportunities')) {
            this.emphasizeLocationBasedJobs();
        }
        
        if (preferences.includes('I\'m just exploring')) {
            this.reduceCommitmentLanguage();
        }
    }

    // Utility methods for personalization
    emphasizeRemoteOpportunities() {
        const headlines = document.querySelectorAll('h1, h2');
        headlines.forEach(h => {
            if (h.textContent.includes('job')) {
                h.textContent = h.textContent.replace('jobs', 'remote jobs');
            }
        });
    }

    emphasizeLocationBasedJobs() {
        // Add location-based messaging
        const ctaButtons = document.querySelectorAll('.cta-primary');
        ctaButtons.forEach(btn => {
            if (btn.textContent.includes('jobs')) {
                btn.textContent = 'Find Local Jobs';
            }
        });
    }

    reduceCommitmentLanguage() {
        // Make language less committal for explorers
        const strongCTAs = document.querySelectorAll('.cta-primary');
        strongCTAs.forEach(btn => {
            if (btn.textContent.includes('Get Started')) {
                btn.textContent = 'Explore Options';
            }
        });
    }

    // Update user profile with onboarding data
    updateUserProfile(data) {
        const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        
        Object.assign(userProfile, data);
        userProfile.lastOnboardingUpdate = Date.now();
        
        localStorage.setItem('user_profile', JSON.stringify(userProfile));
    }

    // Setup onboarding environment
    async setupOnboardingEnvironment() {
        // Add onboarding CSS
        this.addOnboardingStyles();
        
        // Initialize tracking
        this.initializeOnboardingTracking();
        
        // Setup keyboard shortcuts
        this.setupKeyboardNavigation();
    }

    // Add onboarding styles
    addOnboardingStyles() {
        const styles = `
            .onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .onboarding-modal {
                background: white;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80%;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }
            
            .onboarding-header {
                padding: 20px 24px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .progress-bar {
                flex: 1;
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                margin-right: 20px;
            }
            
            .progress-fill {
                height: 100%;
                background: #1a365d;
                border-radius: 2px;
                transition: width 0.3s ease;
            }
            
            .close-onboarding {
                background: none;
                border: none;
                font-size: 24px;
                color: #6b7280;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .onboarding-content {
                padding: 24px;
            }
            
            .onboarding-content h2 {
                margin: 0 0 12px 0;
                color: #1a365d;
                font-size: 24px;
                font-weight: 600;
            }
            
            .onboarding-content > p {
                margin: 0 0 20px 0;
                color: #6b7280;
                line-height: 1.5;
            }
            
            .onboarding-footer {
                padding: 0 24px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .onboarding-actions {
                display: flex;
                gap: 12px;
            }
            
            .btn-primary, .btn-secondary {
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .btn-primary {
                background: #1a365d;
                color: white;
                border: none;
            }
            
            .btn-primary:hover {
                background: #2d4a6b;
            }
            
            .btn-secondary {
                background: transparent;
                color: #6b7280;
                border: 1px solid #d1d5db;
            }
            
            .btn-secondary:hover {
                background: #f9fafb;
            }
            
            .preference-option, .intent-option {
                display: block;
                width: 100%;
                padding: 12px;
                margin: 8px 0;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }
            
            .preference-option:hover, .intent-option:hover {
                border-color: #1a365d;
            }
            
            .preference-option.selected {
                border-color: #1a365d;
                background: #f0f9ff;
            }
            
            .intent-option {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .option-icon {
                font-size: 24px;
            }
            
            .job-match-demo {
                text-align: center;
            }
            
            .sample-job-card {
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }
            
            .score-circle {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: 4px solid #10b981;
                margin: 16px 0;
            }
            
            .score-number {
                font-size: 24px;
                font-weight: bold;
                color: #10b981;
            }
            
            .score-label {
                font-size: 12px;
                color: #6b7280;
            }
            
            .time-badge {
                background: #fef3c7;
                color: #92400e;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .step-indicator {
                font-size: 14px;
                color: #6b7280;
            }
            
            .onboarding-completion {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                z-index: 10001;
                animation: slideUp 0.3s ease;
            }
            
            .completion-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .animate-score {
                animation: pulse 0.6s ease;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Initialize tracking
    initializeOnboardingTracking() {
        this.onboardingStartTime = Date.now();
        this.stepTimings = {};
    }

    // Track onboarding steps
    trackOnboardingStep(step, action, data = {}) {
        const event = {
            type: 'onboarding_step',
            step: step,
            action: action,
            data: data,
            timestamp: Date.now(),
            user_intent: this.userIntent,
            session_id: this.getSessionId()
        };
        
        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'onboarding_step', {
                step: step,
                action: action,
                user_intent: this.userIntent
            });
        }
        
        // Store locally
        const events = JSON.parse(localStorage.getItem('onboarding_events') || '[]');
        events.push(event);
        localStorage.setItem('onboarding_events', JSON.stringify(events.slice(-50)));
    }

    // Setup keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            if (e.key === 'Enter') {
                const continueBtn = document.querySelector('.onboarding-continue');
                if (continueBtn && !continueBtn.disabled) {
                    continueBtn.click();
                }
            }
            
            if (e.key === 'Escape') {
                this.skipOnboarding();
            }
        });
    }

    // Get session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('onboarding_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('onboarding_session_id', sessionId);
        }
        return sessionId;
    }

    // Public API
    async start() {
        return await this.initialize();
    }

    getOnboardingData() {
        return {
            isActive: this.isActive,
            currentStep: this.currentStep,
            maxSteps: this.maxSteps,
            userIntent: this.userIntent,
            completionRate: this.completionRate,
            onboardingData: this.onboardingData
        };
    }

    isOnboardingCompleted() {
        return localStorage.getItem('onboarding_completed') === 'true';
    }
}

// Initialize smart onboarding
const smartOnboarding = new SmartOnboarding();

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        smartOnboarding.start();
    });
} else {
    smartOnboarding.start();
}

// Export for use in other modules
export default smartOnboarding;
export { SmartOnboarding };