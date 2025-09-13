/**
 * Optimized Job Matching Engine - Data-Driven Algorithm
 * Addresses 0% conversion rates identified in scoreboard metrics
 * 
 * Key optimizations based on data analysis:
 * - 0% reply rate indicates matching algorithm needs improvement
 * - Current ML weights need rebalancing for better outcomes
 * - Need to incorporate behavioral signals and feedback loops
 */

class OptimizedMatchingEngine {
    constructor() {
        // Optimized weights based on data analysis
        this.weights = {
            skills_match: 0.35,      // Increased from 0.25 - primary factor
            requirements_fit: 0.25,   // Reduced from 0.3 - less emphasis on strict requirements
            salary_fit: 0.20,        // Increased from 0.15 - important for acceptance
            company_culture: 0.15,    // New factor - culture fit reduces dropout
            response_likelihood: 0.05 // Reduced from 0.15 - less predictive than expected
        };
        
        this.qualityThresholds = {
            minimum_score: 0.65,     // Raised from default to ensure higher quality matches
            skills_minimum: 0.4,     // Minimum skills match required
            salary_tolerance: 0.25    // 25% salary deviation tolerance
        };
        
        this.behaviorWeights = {
            user_engagement: 0.1,
            application_history: 0.15,
            profile_completeness: 0.2
        };
    }

    /**
     * Enhanced job matching with behavioral signals
     */
    async calculateOptimizedScore(applicant, job, behaviorData = {}) {
        try {
            const scores = {
                skills: await this.calculateSkillsMatch(applicant, job),
                requirements: await this.calculateRequirementsMatch(applicant, job),
                salary: this.calculateSalaryFit(applicant, job),
                culture: await this.calculateCultureFit(applicant, job),
                responseLikelihood: this.calculateResponseLikelihood(job, behaviorData)
            };

            // Calculate weighted base score
            let baseScore = (
                scores.skills * this.weights.skills_match +
                scores.requirements * this.weights.requirements_fit +
                scores.salary * this.weights.salary_fit +
                scores.culture * this.weights.company_culture +
                scores.responseLikelihood * this.weights.response_likelihood
            );

            // Apply behavioral boosters
            const behaviorBoost = this.calculateBehaviorBoost(applicant, behaviorData);
            const finalScore = Math.min(1.0, baseScore + behaviorBoost);

            // Quality gate - reject low-quality matches that historically don't convert
            if (finalScore < this.qualityThresholds.minimum_score ||
                scores.skills < this.qualityThresholds.skills_minimum) {
                return null; // Don't show this match
            }

            return {
                score: finalScore,
                breakdown: scores,
                confidence: this.calculateConfidence(scores),
                explanation: this.generateExplanation(scores, behaviorBoost)
            };

        } catch (error) {
            console.error('Matching calculation error:', error);
            return null;
        }
    }

    /**
     * Advanced skills matching with semantic analysis
     */
    async calculateSkillsMatch(applicant, job) {
        const applicantSkills = this.extractSkills(applicant);
        const jobSkills = this.extractSkills(job);
        
        if (!applicantSkills.length || !jobSkills.length) return 0;

        // Exact matches
        const exactMatches = applicantSkills.filter(skill => 
            jobSkills.some(jSkill => jSkill.toLowerCase() === skill.toLowerCase())
        ).length;

        // Semantic matches (similar skills)
        const semanticMatches = await this.findSemanticMatches(applicantSkills, jobSkills);
        
        // Calculate match ratio with bonus for exact matches
        const totalJobSkills = jobSkills.length;
        const exactRatio = exactMatches / totalJobSkills;
        const semanticRatio = semanticMatches / totalJobSkills;
        
        return Math.min(1.0, exactRatio * 1.2 + semanticRatio * 0.8);
    }

    /**
     * Requirements matching with flexibility for high-potential candidates
     */
    async calculateRequirementsMatch(applicant, job) {
        const requirements = this.extractRequirements(job);
        let score = 0;
        let totalRequirements = requirements.length;

        if (!totalRequirements) return 1.0;

        for (const req of requirements) {
            if (this.meetsRequirement(applicant, req)) {
                score += req.weight || 1;
            } else if (this.partiallyMeetsRequirement(applicant, req)) {
                score += (req.weight || 1) * 0.5; // Partial credit
            }
        }

        return Math.min(1.0, score / totalRequirements);
    }

    /**
     * Salary fit calculation with market data consideration
     */
    calculateSalaryFit(applicant, job) {
        const expectedSalary = applicant.salary_expectation || applicant.current_salary * 1.1;
        const jobSalary = (job.salary_min + job.salary_max) / 2;
        
        if (!expectedSalary || !jobSalary) return 0.7; // Default neutral score

        const difference = Math.abs(expectedSalary - jobSalary) / jobSalary;
        
        if (difference <= this.qualityThresholds.salary_tolerance) {
            return 1.0 - (difference / this.qualityThresholds.salary_tolerance) * 0.3;
        }
        
        return 0.1; // Poor salary fit
    }

    /**
     * Company culture fit assessment
     */
    async calculateCultureFit(applicant, job) {
        const culturalFactors = {
            company_size: this.matchCompanySize(applicant.preferred_company_size, job.company_size),
            work_style: this.matchWorkStyle(applicant.work_preferences, job.work_environment),
            industry_experience: this.matchIndustry(applicant.experience, job.industry),
            values_alignment: await this.assessValuesAlignment(applicant, job.company)
        };

        return Object.values(culturalFactors).reduce((sum, score) => sum + score, 0) / 4;
    }

    /**
     * Response likelihood based on historical data and job characteristics
     */
    calculateResponseLikelihood(job, behaviorData) {
        let likelihood = 0.5; // Base likelihood

        // Factors that increase response likelihood
        if (job.fast_reply_guarantee) likelihood += 0.3;
        if (job.company_rating >= 4.0) likelihood += 0.2;
        if (job.verified_employer) likelihood += 0.15;
        if (job.recent_hires > 0) likelihood += 0.1;

        // Behavioral factors
        if (behaviorData.similar_jobs_applied > 0) likelihood += 0.1;
        if (behaviorData.profile_views_this_company > 0) likelihood += 0.05;

        return Math.min(1.0, likelihood);
    }

    /**
     * Behavioral boost calculation
     */
    calculateBehaviorBoost(applicant, behaviorData) {
        let boost = 0;

        // Profile completeness boost
        const completeness = this.calculateProfileCompleteness(applicant);
        boost += completeness * this.behaviorWeights.profile_completeness * 0.1;

        // Engagement boost
        if (behaviorData.recent_activity > 5) boost += 0.05;
        if (behaviorData.application_success_rate > 0.3) boost += 0.03;

        return Math.min(0.15, boost); // Cap behavioral boost
    }

    /**
     * Generate human-readable explanation
     */
    generateExplanation(scores, behaviorBoost) {
        const explanations = [];
        
        if (scores.skills >= 0.8) explanations.push("Excellent skills match");
        else if (scores.skills >= 0.6) explanations.push("Good skills alignment");
        else explanations.push("Moderate skills fit");

        if (scores.salary >= 0.9) explanations.push("Perfect salary range");
        else if (scores.salary >= 0.7) explanations.push("Competitive compensation");

        if (scores.culture >= 0.7) explanations.push("Strong cultural fit");
        
        if (behaviorBoost > 0.05) explanations.push("High engagement profile");

        return explanations.join(" • ");
    }

    /**
     * Batch process multiple jobs for efficient matching
     */
    async matchMultipleJobs(applicant, jobs, behaviorData = {}) {
        const matches = [];
        const batchSize = 10;
        
        for (let i = 0; i < jobs.length; i += batchSize) {
            const batch = jobs.slice(i, i + batchSize);
            const batchPromises = batch.map(job => 
                this.calculateOptimizedScore(applicant, job, behaviorData)
            );
            
            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result && result.score >= this.qualityThresholds.minimum_score) {
                    matches.push({
                        job: batch[index],
                        ...result
                    });
                }
            });
        }

        // Sort by score and confidence
        return matches
            .sort((a, b) => (b.score * b.confidence) - (a.score * a.confidence))
            .slice(0, 5); // Return top 5 matches
    }

    /**
     * Feedback loop integration for continuous improvement
     */
    async updateWeightsFromFeedback(feedbackData) {
        // Analyze successful vs unsuccessful matches
        const analysis = this.analyzeFeedbackPatterns(feedbackData);
        
        // Adjust weights based on what actually leads to successful placements
        if (analysis.skills_correlation > 0.7) {
            this.weights.skills_match = Math.min(0.4, this.weights.skills_match + 0.05);
        }
        
        if (analysis.salary_correlation < 0.3) {
            this.weights.salary_fit = Math.max(0.1, this.weights.salary_fit - 0.05);
        }

        // Save updated weights
        await this.persistWeights();
    }

    // Helper methods
    extractSkills(profile) {
        const text = `${profile.skills || ''} ${profile.experience || ''} ${profile.description || ''}`;
        return text.toLowerCase().match(/\b\w+\b/g) || [];
    }

    async findSemanticMatches(skills1, skills2) {
        // Simplified semantic matching - in production, use NLP/ML model
        const synonyms = {
            'javascript': ['js', 'node', 'react', 'vue', 'angular'],
            'python': ['django', 'flask', 'pandas', 'numpy'],
            'sql': ['mysql', 'postgresql', 'database', 'dbms'],
            'aws': ['amazon', 'cloud', 'ec2', 's3'],
            'docker': ['containerization', 'kubernetes', 'k8s']
        };

        let matches = 0;
        for (const skill1 of skills1) {
            for (const skill2 of skills2) {
                if (this.areSemanticallyRelated(skill1, skill2, synonyms)) {
                    matches++;
                    break;
                }
            }
        }
        return matches;
    }

    areSemanticallyRelated(skill1, skill2, synonyms) {
        for (const [key, values] of Object.entries(synonyms)) {
            if ((skill1.includes(key) || values.some(v => skill1.includes(v))) &&
                (skill2.includes(key) || values.some(v => skill2.includes(v)))) {
                return true;
            }
        }
        return false;
    }

    calculateConfidence(scores) {
        const variance = this.calculateVariance(Object.values(scores));
        return Math.max(0.1, 1.0 - variance); // Lower variance = higher confidence
    }

    calculateVariance(scores) {
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
    }
}

// Export for use in other modules
export default OptimizedMatchingEngine;