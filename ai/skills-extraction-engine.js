/**
 * AI-POWERED SKILLS EXTRACTION ENGINE
 * ====================================
 * 
 * Advanced NLP system for extracting, analyzing, and categorizing skills from:
 * - Job descriptions
 * - Resumes and CVs
 * - LinkedIn profiles
 * - Project descriptions
 * - Educational backgrounds
 * 
 * Features:
 * - Named Entity Recognition (NER) for skills
 * - Semantic similarity matching
 * - Skill taxonomy classification
 * - Confidence scoring and validation
 * - Real-time extraction and caching
 */

class SkillsExtractionEngine {
    constructor() {
        this.initialized = false;
        this.skillsTaxonomy = new SkillsTaxonomy();
        this.nlpProcessor = new NLPProcessor();
        this.cache = new Map();
        this.confidenceThreshold = 0.7;
        
        // Pre-trained skill patterns and models
        this.skillPatterns = new Map();
        this.skillEmbeddings = new Map();
        this.contextModels = new Map();
        
        this.config = {
            // Extraction parameters
            extraction: {
                minConfidence: 0.6,
                maxSkills: 50,
                contextWindow: 5,
                semanticThreshold: 0.8,
                frequencyWeight: 0.3
            },
            
            // NLP processing
            nlp: {
                tokenization: true,
                lemmatization: true,
                posTagging: true,
                namedEntityRecognition: true,
                dependencyParsing: false
            },
            
            // Performance optimization
            performance: {
                cacheSize: 5000,
                batchSize: 20,
                parallelProcessing: true,
                precomputeEmbeddings: true
            }
        };

        this.initialize();
    }

    // ====================================
    // INITIALIZATION
    // ====================================

    async initialize() {
        console.log('🔍 Initializing AI Skills Extraction Engine');

        try {
            // Load skill taxonomy and embeddings
            await this.loadSkillsTaxonomy();
            
            // Initialize NLP models
            await this.initializeNLPModels();
            
            // Load pre-trained skill patterns
            await this.loadSkillPatterns();
            
            // Setup semantic similarity models
            await this.setupSemanticModels();
            
            // Warm up caches
            await this.warmupCaches();
            
            this.initialized = true;
            console.log('✅ Skills Extraction Engine ready');

        } catch (error) {
            console.error('❌ Skills extraction initialization failed:', error);
            throw error;
        }
    }

    async loadSkillsTaxonomy() {
        // Load comprehensive skills taxonomy
        await this.skillsTaxonomy.initialize();
        
        // Create skill embeddings for semantic matching
        const allSkills = this.skillsTaxonomy.getAllSkills();
        
        for (const skill of allSkills) {
            const embedding = await this.generateSkillEmbedding(skill.name);
            this.skillEmbeddings.set(skill.id, {
                embedding,
                skill,
                aliases: skill.aliases || []
            });
        }
        
        console.log(`📚 Loaded ${allSkills.length} skills in taxonomy`);
    }

    async initializeNLPModels() {
        this.nlpProcessor = new NLPProcessor({
            models: {
                tokenizer: true,
                posTag: true,
                lemmatizer: true,
                nerModel: true
            }
        });
        
        await this.nlpProcessor.initialize();
        console.log('🔤 NLP models initialized');
    }

    // ====================================
    // MAIN EXTRACTION METHODS
    // ====================================

    async extractSkills(text, options = {}) {
        if (!this.initialized) {
            throw new Error('Skills extraction engine not initialized');
        }

        const startTime = performance.now();
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(text, options);
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Preprocess text
            const processedText = await this.preprocessText(text);
            
            // Multiple extraction strategies
            const [
                patternBasedSkills,
                nerBasedSkills,
                semanticBasedSkills,
                contextualSkills
            ] = await Promise.all([
                this.extractWithPatterns(processedText),
                this.extractWithNER(processedText),
                this.extractWithSemanticMatching(processedText),
                this.extractWithContextAnalysis(processedText)
            ]);

            // Combine and rank skills
            const combinedSkills = this.combineExtractionResults([
                patternBasedSkills,
                nerBasedSkills,
                semanticBasedSkills,
                contextualSkills
            ]);

            // Apply confidence filtering and ranking
            const rankedSkills = this.rankAndFilterSkills(combinedSkills, options);
            
            // Add metadata and explanations
            const result = {
                skills: rankedSkills,
                metadata: {
                    textLength: text.length,
                    processingTime: performance.now() - startTime,
                    extractionMethods: 4,
                    confidence: this.calculateOverallConfidence(rankedSkills),
                    timestamp: Date.now()
                },
                statistics: this.generateExtractionStatistics(rankedSkills)
            };

            // Cache result
            this.cache.set(cacheKey, result);
            
            return result;

        } catch (error) {
            console.error('Skills extraction failed:', error);
            return {
                skills: [],
                error: error.message,
                metadata: { processingTime: performance.now() - startTime }
            };
        }
    }

    async extractSkillsFromJobDescription(jobDescription) {
        return this.extractSkills(jobDescription, {
            context: 'job_description',
            prioritizeRequirements: true,
            includeTools: true,
            includeSoftSkills: true
        });
    }

    async extractSkillsFromResume(resumeText) {
        return this.extractSkills(resumeText, {
            context: 'resume',
            prioritizeExperience: true,
            includeAchievements: true,
            includeCertifications: true
        });
    }

    async extractSkillsFromProfile(profileText) {
        return this.extractSkills(profileText, {
            context: 'profile',
            includeInterests: false,
            prioritizeProfessional: true
        });
    }

    // ====================================
    // EXTRACTION STRATEGIES
    // ====================================

    async extractWithPatterns(text) {
        const skills = [];
        const tokens = await this.nlpProcessor.tokenize(text);
        
        // Regex patterns for common skill expressions
        const skillPatterns = [
            // Programming languages
            /\b(javascript|python|java|c\+\+|c#|ruby|go|rust|swift|kotlin)\b/gi,
            // Frameworks and libraries
            /\b(react|angular|vue|django|flask|spring|express|laravel)\b/gi,
            // Databases
            /\b(mysql|postgresql|mongodb|redis|elasticsearch|cassandra)\b/gi,
            // Cloud platforms
            /\b(aws|azure|gcp|google cloud|amazon web services)\b/gi,
            // Tools
            /\b(docker|kubernetes|jenkins|git|jira|confluence|slack)\b/gi,
            // Methodologies
            /\b(agile|scrum|kanban|devops|ci\/cd|tdd|bdd)\b/gi
        ];

        for (const pattern of skillPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const skill = await this.validateAndEnrichSkill(match, text);
                    if (skill) {
                        skills.push(skill);
                    }
                }
            }
        }

        // Context-aware pattern matching
        const contextPatterns = [
            /experienced?\s+(?:with|in)\s+([a-zA-Z\s,&+#-]+?)(?:\s+for|\s+to|\.|,)/gi,
            /proficient\s+(?:with|in)\s+([a-zA-Z\s,&+#-]+?)(?:\s+for|\s+to|\.|,)/gi,
            /skilled?\s+(?:with|in)\s+([a-zA-Z\s,&+#-]+?)(?:\s+for|\s+to|\.|,)/gi,
            /knowledge\s+(?:of|in)\s+([a-zA-Z\s,&+#-]+?)(?:\s+for|\s+to|\.|,)/gi
        ];

        for (const pattern of contextPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const skillText = match[1].trim();
                const extractedSkills = await this.parseSkillList(skillText, text);
                skills.push(...extractedSkills);
            }
        }

        return skills.map(skill => ({
            ...skill,
            extractionMethod: 'pattern',
            confidence: Math.min(skill.confidence * 1.1, 1.0) // Slight boost for pattern matches
        }));
    }

    async extractWithNER(text) {
        const skills = [];
        const entities = await this.nlpProcessor.extractNamedEntities(text);
        
        for (const entity of entities) {
            if (entity.label === 'SKILL' || entity.label === 'TECH') {
                const skill = await this.validateAndEnrichSkill(entity.text, text);
                if (skill) {
                    skills.push({
                        ...skill,
                        extractionMethod: 'ner',
                        nerConfidence: entity.confidence
                    });
                }
            }
        }

        return skills;
    }

    async extractWithSemanticMatching(text) {
        const skills = [];
        const sentences = this.nlpProcessor.splitIntoSentences(text);
        
        for (const sentence of sentences) {
            const sentenceEmbedding = await this.generateTextEmbedding(sentence);
            
            for (const [skillId, skillData] of this.skillEmbeddings) {
                const similarity = this.calculateCosineSimilarity(
                    sentenceEmbedding, 
                    skillData.embedding
                );
                
                if (similarity > this.config.extraction.semanticThreshold) {
                    skills.push({
                        id: skillId,
                        name: skillData.skill.name,
                        category: skillData.skill.category,
                        confidence: similarity,
                        extractionMethod: 'semantic',
                        context: sentence,
                        semanticSimilarity: similarity
                    });
                }
            }
        }

        // Remove duplicates and keep highest confidence
        return this.deduplicateSkills(skills);
    }

    async extractWithContextAnalysis(text) {
        const skills = [];
        const tokens = await this.nlpProcessor.tokenizeAndTag(text);
        
        // Analyze context windows around potential skill mentions
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // Check if token could be part of a skill name
            if (this.couldBeSkillToken(token)) {
                const contextWindow = this.extractContextWindow(tokens, i, this.config.extraction.contextWindow);
                const contextualScore = await this.analyzeSkillContext(contextWindow);
                
                if (contextualScore > this.confidenceThreshold) {
                    const skill = await this.validateAndEnrichSkill(token.text, text);
                    if (skill) {
                        skills.push({
                            ...skill,
                            extractionMethod: 'contextual',
                            contextualScore,
                            context: contextWindow.map(t => t.text).join(' ')
                        });
                    }
                }
            }
        }

        return skills;
    }

    // ====================================
    // SKILL VALIDATION AND ENRICHMENT
    // ====================================

    async validateAndEnrichSkill(skillText, fullText) {
        const normalizedSkill = this.normalizeSkillText(skillText);
        
        // Check against known skills taxonomy
        const taxonomyMatch = this.skillsTaxonomy.findSkill(normalizedSkill);
        if (taxonomyMatch) {
            return {
                id: taxonomyMatch.id,
                name: taxonomyMatch.name,
                category: taxonomyMatch.category,
                subcategory: taxonomyMatch.subcategory,
                confidence: taxonomyMatch.confidence,
                aliases: taxonomyMatch.aliases,
                description: taxonomyMatch.description,
                frequency: this.calculateSkillFrequency(skillText, fullText),
                contextRelevance: await this.calculateContextRelevance(skillText, fullText)
            };
        }

        // Fuzzy matching for potential new skills
        const fuzzyMatch = await this.findFuzzyMatch(normalizedSkill);
        if (fuzzyMatch && fuzzyMatch.confidence > 0.8) {
            return {
                ...fuzzyMatch,
                originalText: skillText,
                matchType: 'fuzzy'
            };
        }

        // Validate as new skill candidate
        const isValidSkill = await this.validateNewSkill(normalizedSkill, fullText);
        if (isValidSkill.valid) {
            return {
                name: normalizedSkill,
                category: isValidSkill.category,
                confidence: isValidSkill.confidence,
                isNew: true,
                originalText: skillText
            };
        }

        return null;
    }

    normalizeSkillText(skillText) {
        return skillText
            .toLowerCase()
            .trim()
            .replace(/[^\w\s+#.-]/g, '')
            .replace(/\s+/g, ' ');
    }

    async findFuzzyMatch(skillText) {
        let bestMatch = null;
        let bestScore = 0;

        for (const [skillId, skillData] of this.skillEmbeddings) {
            const skill = skillData.skill;
            
            // Check exact name match
            const nameScore = this.calculateStringSimilarity(skillText, skill.name);
            
            // Check alias matches
            let aliasScore = 0;
            for (const alias of skill.aliases || []) {
                aliasScore = Math.max(aliasScore, this.calculateStringSimilarity(skillText, alias));
            }
            
            const maxScore = Math.max(nameScore, aliasScore);
            
            if (maxScore > bestScore && maxScore > 0.7) {
                bestScore = maxScore;
                bestMatch = {
                    id: skillId,
                    name: skill.name,
                    category: skill.category,
                    confidence: maxScore,
                    matchedText: nameScore > aliasScore ? skill.name : skill.aliases?.find(a => 
                        this.calculateStringSimilarity(skillText, a) === aliasScore
                    )
                };
            }
        }

        return bestMatch;
    }

    async validateNewSkill(skillText, context) {
        // Simple validation rules for new skills
        const validationRules = [
            // Length check
            skillText.length >= 2 && skillText.length <= 50,
            // Not a common word
            !this.isCommonWord(skillText),
            // Contains alphanumeric characters
            /[a-zA-Z0-9]/.test(skillText),
            // Not purely numeric
            !/^\d+$/.test(skillText),
            // Has skill-like context
            this.hasSkillContext(skillText, context)
        ];

        const validCount = validationRules.filter(rule => rule).length;
        const confidence = validCount / validationRules.length;

        return {
            valid: confidence > 0.6,
            confidence,
            category: this.predictSkillCategory(skillText, context)
        };
    }

    // ====================================
    // RANKING AND FILTERING
    // ====================================

    combineExtractionResults(results) {
        const skillMap = new Map();

        for (const skillSet of results) {
            for (const skill of skillSet) {
                const key = skill.name.toLowerCase();
                
                if (skillMap.has(key)) {
                    const existing = skillMap.get(key);
                    
                    // Combine confidence scores
                    existing.confidence = Math.max(existing.confidence, skill.confidence);
                    existing.extractionMethods = [...(existing.extractionMethods || [existing.extractionMethod]), skill.extractionMethod];
                    existing.evidence = [...(existing.evidence || []), skill];
                } else {
                    skillMap.set(key, {
                        ...skill,
                        extractionMethods: [skill.extractionMethod]
                    });
                }
            }
        }

        return Array.from(skillMap.values());
    }

    rankAndFilterSkills(skills, options = {}) {
        // Apply filters
        let filteredSkills = skills.filter(skill => 
            skill.confidence >= (options.minConfidence || this.config.extraction.minConfidence)
        );

        // Sort by confidence and relevance
        filteredSkills.sort((a, b) => {
            // Primary: confidence
            const confidenceDiff = b.confidence - a.confidence;
            if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
            
            // Secondary: frequency in text
            const frequencyDiff = (b.frequency || 0) - (a.frequency || 0);
            if (Math.abs(frequencyDiff) > 0) return frequencyDiff;
            
            // Tertiary: number of extraction methods
            return (b.extractionMethods?.length || 1) - (a.extractionMethods?.length || 1);
        });

        // Limit results
        const maxSkills = options.maxSkills || this.config.extraction.maxSkills;
        filteredSkills = filteredSkills.slice(0, maxSkills);

        // Add rankings and additional metadata
        return filteredSkills.map((skill, index) => ({
            ...skill,
            rank: index + 1,
            percentile: ((filteredSkills.length - index) / filteredSkills.length) * 100,
            strengthLevel: this.categorizeStrength(skill.confidence),
            recommendations: this.generateSkillRecommendations(skill)
        }));
    }

    categorizeStrength(confidence) {
        if (confidence >= 0.9) return 'Expert';
        if (confidence >= 0.8) return 'Advanced';
        if (confidence >= 0.7) return 'Intermediate';
        if (confidence >= 0.6) return 'Beginner';
        return 'Mentioned';
    }

    generateSkillRecommendations(skill) {
        const recommendations = [];
        
        // Related skills
        const relatedSkills = this.skillsTaxonomy.getRelatedSkills(skill.id);
        if (relatedSkills.length > 0) {
            recommendations.push({
                type: 'related_skills',
                message: `Consider learning ${relatedSkills.slice(0, 3).map(s => s.name).join(', ')}`,
                skills: relatedSkills.slice(0, 5)
            });
        }

        // Certification suggestions
        const certifications = this.skillsTaxonomy.getCertifications(skill.id);
        if (certifications.length > 0) {
            recommendations.push({
                type: 'certifications',
                message: 'Strengthen this skill with certifications',
                certifications: certifications
            });
        }

        return recommendations;
    }

    // ====================================
    // UTILITY FUNCTIONS
    // ====================================

    calculateStringSimilarity(str1, str2) {
        // Levenshtein distance based similarity
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;
        
        const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));
        
        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[j][i] = matrix[j - 1][i - 1];
                } else {
                    matrix[j][i] = Math.min(
                        matrix[j - 1][i - 1] + 1,
                        matrix[j][i - 1] + 1,
                        matrix[j - 1][i] + 1
                    );
                }
            }
        }
        
        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);
        
        return 1 - (distance / maxLen);
    }

    calculateCosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    calculateSkillFrequency(skill, text) {
        const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = text.match(skillRegex);
        return matches ? matches.length : 0;
    }

    async calculateContextRelevance(skill, text) {
        // Simplified context relevance calculation
        const contextWords = ['experience', 'proficient', 'expert', 'skilled', 'knowledge', 'familiar'];
        const skillIndex = text.toLowerCase().indexOf(skill.toLowerCase());
        
        if (skillIndex === -1) return 0;
        
        const contextWindow = text.substr(Math.max(0, skillIndex - 50), 100).toLowerCase();
        const contextMatches = contextWords.filter(word => contextWindow.includes(word));
        
        return Math.min(contextMatches.length * 0.2, 1.0);
    }

    generateCacheKey(text, options) {
        const textHash = this.hashString(text);
        const optionsHash = this.hashString(JSON.stringify(options));
        return `${textHash}_${optionsHash}`;
    }

    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return Math.abs(hash).toString(36);
    }

    deduplicateSkills(skills) {
        const seen = new Set();
        return skills.filter(skill => {
            const key = skill.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    calculateOverallConfidence(skills) {
        if (skills.length === 0) return 0;
        const avgConfidence = skills.reduce((sum, skill) => sum + skill.confidence, 0) / skills.length;
        const countBonus = Math.min(skills.length * 0.05, 0.2);
        return Math.min(avgConfidence + countBonus, 1.0);
    }

    generateExtractionStatistics(skills) {
        const categories = {};
        const methods = {};
        
        skills.forEach(skill => {
            // Count by category
            categories[skill.category] = (categories[skill.category] || 0) + 1;
            
            // Count by extraction method
            if (skill.extractionMethods) {
                skill.extractionMethods.forEach(method => {
                    methods[method] = (methods[method] || 0) + 1;
                });
            } else {
                methods[skill.extractionMethod] = (methods[skill.extractionMethod] || 0) + 1;
            }
        });
        
        return {
            totalSkills: skills.length,
            averageConfidence: skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length,
            categoriesBreakdown: categories,
            extractionMethodsBreakdown: methods,
            highConfidenceCount: skills.filter(s => s.confidence > 0.8).length,
            newSkillsCount: skills.filter(s => s.isNew).length
        };
    }

    // ====================================
    // PUBLIC API
    // ====================================

    async analyzeText(text, options = {}) {
        if (!this.initialized) {
            throw new Error('Skills extraction engine not initialized');
        }

        return this.extractSkills(text, options);
    }

    async analyzeJobPosting(jobDescription) {
        return this.extractSkillsFromJobDescription(jobDescription);
    }

    async analyzeCandidate(resumeOrProfile) {
        return this.extractSkillsFromResume(resumeOrProfile);
    }

    async compareSkills(candidateSkills, jobSkills) {
        const matching = [];
        const missing = [];
        const additional = [];

        for (const jobSkill of jobSkills) {
            const match = candidateSkills.find(cs => 
                this.calculateStringSimilarity(cs.name, jobSkill.name) > 0.8
            );
            
            if (match) {
                matching.push({
                    jobSkill,
                    candidateSkill: match,
                    similarity: this.calculateStringSimilarity(match.name, jobSkill.name),
                    strengthComparison: this.compareSkillStrengths(match, jobSkill)
                });
            } else {
                missing.push(jobSkill);
            }
        }

        for (const candidateSkill of candidateSkills) {
            const hasMatch = jobSkills.some(js => 
                this.calculateStringSimilarity(candidateSkill.name, js.name) > 0.8
            );
            
            if (!hasMatch) {
                additional.push(candidateSkill);
            }
        }

        return {
            matching,
            missing,
            additional,
            matchPercentage: (matching.length / jobSkills.length) * 100,
            overallFit: this.calculateOverallSkillsFit(matching, missing, additional)
        };
    }

    getSkillsTaxonomy() {
        return this.skillsTaxonomy.getTaxonomy();
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            hitRate: this.cacheHitRate || 0,
            maxSize: this.config.performance.cacheSize
        };
    }

    clearCache() {
        this.cache.clear();
        console.log('🗑️ Skills extraction cache cleared');
    }
}

// ====================================
// SUPPORTING CLASSES
// ====================================

class SkillsTaxonomy {
    constructor() {
        this.taxonomy = new Map();
        this.categories = new Map();
        this.aliases = new Map();
    }

    async initialize() {
        // Load comprehensive skills taxonomy
        const skillsData = await this.loadSkillsData();
        
        for (const skill of skillsData) {
            this.taxonomy.set(skill.id, skill);
            
            // Index by category
            if (!this.categories.has(skill.category)) {
                this.categories.set(skill.category, []);
            }
            this.categories.get(skill.category).push(skill);
            
            // Index aliases
            for (const alias of skill.aliases || []) {
                this.aliases.set(alias.toLowerCase(), skill.id);
            }
        }
        
        console.log(`📖 Skills taxonomy loaded: ${this.taxonomy.size} skills`);
    }

    async loadSkillsData() {
        // In production, this would load from a comprehensive database
        return [
            // Programming Languages
            { id: 'js', name: 'JavaScript', category: 'Programming', subcategory: 'Web Development', aliases: ['js', 'nodejs', 'node.js'], confidence: 0.95 },
            { id: 'python', name: 'Python', category: 'Programming', subcategory: 'General Purpose', aliases: ['py'], confidence: 0.95 },
            { id: 'java', name: 'Java', category: 'Programming', subcategory: 'Enterprise', aliases: [], confidence: 0.95 },
            { id: 'csharp', name: 'C#', category: 'Programming', subcategory: 'Microsoft', aliases: ['c-sharp', 'csharp'], confidence: 0.95 },
            
            // Web Technologies
            { id: 'react', name: 'React', category: 'Framework', subcategory: 'Frontend', aliases: ['reactjs', 'react.js'], confidence: 0.9 },
            { id: 'angular', name: 'Angular', category: 'Framework', subcategory: 'Frontend', aliases: ['angularjs'], confidence: 0.9 },
            { id: 'vue', name: 'Vue.js', category: 'Framework', subcategory: 'Frontend', aliases: ['vuejs', 'vue'], confidence: 0.9 },
            
            // Databases
            { id: 'mysql', name: 'MySQL', category: 'Database', subcategory: 'Relational', aliases: ['my-sql'], confidence: 0.9 },
            { id: 'postgresql', name: 'PostgreSQL', category: 'Database', subcategory: 'Relational', aliases: ['postgres', 'psql'], confidence: 0.9 },
            { id: 'mongodb', name: 'MongoDB', category: 'Database', subcategory: 'NoSQL', aliases: ['mongo'], confidence: 0.9 },
            
            // Cloud Platforms
            { id: 'aws', name: 'Amazon Web Services', category: 'Cloud', subcategory: 'Platform', aliases: ['aws', 'amazon web services'], confidence: 0.95 },
            { id: 'azure', name: 'Microsoft Azure', category: 'Cloud', subcategory: 'Platform', aliases: ['azure'], confidence: 0.95 },
            { id: 'gcp', name: 'Google Cloud Platform', category: 'Cloud', subcategory: 'Platform', aliases: ['gcp', 'google cloud'], confidence: 0.95 },
            
            // More skills would be added here...
        ];
    }

    findSkill(skillName) {
        const normalized = skillName.toLowerCase();
        
        // Direct alias lookup
        if (this.aliases.has(normalized)) {
            const skillId = this.aliases.get(normalized);
            return this.taxonomy.get(skillId);
        }
        
        // Direct name lookup
        for (const skill of this.taxonomy.values()) {
            if (skill.name.toLowerCase() === normalized) {
                return skill;
            }
        }
        
        return null;
    }

    getAllSkills() {
        return Array.from(this.taxonomy.values());
    }

    getRelatedSkills(skillId) {
        const skill = this.taxonomy.get(skillId);
        if (!skill) return [];
        
        // Find skills in same category/subcategory
        return this.categories.get(skill.category)?.filter(s => s.id !== skillId) || [];
    }

    getCertifications(skillId) {
        // Placeholder for certification data
        return [];
    }

    getTaxonomy() {
        return {
            skills: Array.from(this.taxonomy.values()),
            categories: Array.from(this.categories.keys()),
            totalSkills: this.taxonomy.size
        };
    }
}

class NLPProcessor {
    constructor(config = {}) {
        this.config = config;
        this.models = new Map();
    }

    async initialize() {
        // Initialize NLP models (simplified for demo)
        console.log('🔤 NLP processor initialized');
    }

    async tokenize(text) {
        // Simple tokenization
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 0)
            .map(token => ({ text: token, pos: 'UNKNOWN' }));
    }

    async tokenizeAndTag(text) {
        // Tokenize and POS tag (simplified)
        return this.tokenize(text);
    }

    splitIntoSentences(text) {
        return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    }

    async extractNamedEntities(text) {
        // Simplified NER (would use actual NER models in production)
        const entities = [];
        const skillPatterns = /\b(javascript|python|java|react|angular|vue|mysql|aws|azure)\b/gi;
        
        let match;
        while ((match = skillPatterns.exec(text)) !== null) {
            entities.push({
                text: match[0],
                label: 'SKILL',
                start: match.index,
                end: match.index + match[0].length,
                confidence: 0.8
            });
        }
        
        return entities;
    }
}

// Export and initialize
export { SkillsExtractionEngine };
window.SkillsExtractionEngine = new SkillsExtractionEngine();

console.log('🔍 AI-POWERED SKILLS EXTRACTION ENGINE LOADED');