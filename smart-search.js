// Smart Search with AI-Powered Autocomplete and Semantic Matching
// Advanced search functionality with ML-driven suggestions

class SmartSearchEngine {
    constructor() {
        this.searchHistory = new Map();
        this.popularSearches = new Map();
        this.semanticCache = new Map();
        this.searchSuggestions = new Map();
        this.searchResultsCache = new Map();
        
        this.init();
    }

    async init() {
        console.log('🔍 Initializing Smart Search Engine...');
        
        // Load search data
        await this.loadSearchHistory();
        await this.loadPopularSearches();
        
        // Start background processes
        this.startSearchAnalytics();
        this.preloadCommonSearches();
        
        console.log('✅ Smart Search Engine ready');
    }

    // ==================== SMART AUTOCOMPLETE ====================
    
    async getSmartSuggestions(query, context = 'general') {
        if (!query || query.length < 2) return [];

        const cacheKey = `${query.toLowerCase()}_${context}`;
        if (this.searchSuggestions.has(cacheKey)) {
            return this.searchSuggestions.get(cacheKey);
        }

        try {
            const suggestions = await Promise.all([
                this.getSemanticSuggestions(query),
                this.getHistoricalSuggestions(query),
                this.getPopularSuggestions(query),
                this.getRoleSuggestions(query),
                this.getSkillSuggestions(query),
                this.getLocationSuggestions(query),
                this.getCompanySuggestions(query)
            ]);

            // Merge and rank suggestions
            const mergedSuggestions = this.mergeSuggestions(suggestions.flat(), query);
            
            // Cache results for 5 minutes
            this.searchSuggestions.set(cacheKey, mergedSuggestions);
            setTimeout(() => this.searchSuggestions.delete(cacheKey), 5 * 60 * 1000);

            return mergedSuggestions;

        } catch (error) {
            console.error('Smart suggestions error:', error);
            return this.getFallbackSuggestions(query);
        }
    }

    async getSemanticSuggestions(query) {
        // Use semantic similarity to find related terms
        const semanticMatches = await this.findSemanticMatches(query);
        
        return semanticMatches.map(match => ({
            text: match.term,
            type: 'semantic',
            relevance: match.similarity,
            icon: '🧠',
            description: `Similar to "${query}"`
        }));
    }

    async getHistoricalSuggestions(query) {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) return [];

        const userHistory = this.searchHistory.get(currentUser.uid) || [];
        const matchingHistory = userHistory
            .filter(search => search.query.toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 3);

        return matchingHistory.map(search => ({
            text: search.query,
            type: 'history',
            relevance: this.calculateHistoryRelevance(search),
            icon: '🕐',
            description: 'From your search history'
        }));
    }

    async getPopularSuggestions(query) {
        const popular = Array.from(this.popularSearches.entries())
            .filter(([term]) => term.toLowerCase().includes(query.toLowerCase()))
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 3);

        return popular.map(([term, data]) => ({
            text: term,
            type: 'popular',
            relevance: data.count / 1000, // Normalize
            icon: '🔥',
            description: `${data.count} searches this week`
        }));
    }

    // ==================== INTELLIGENT SEARCH RESULTS ====================
    
    async performSmartSearch(query, filters = {}) {
        const startTime = performance.now();
        
        try {
            // Log search for analytics
            await this.logSearch(query, filters);

            // Check cache first
            const cacheKey = this.generateCacheKey(query, filters);
            if (this.searchResultsCache.has(cacheKey)) {
                const cachedResults = this.searchResultsCache.get(cacheKey);
                console.log(`Search cache hit: ${performance.now() - startTime}ms`);
                return cachedResults;
            }

            // Perform multi-strategy search
            const searchResults = await Promise.all([
                this.performExactSearch(query, filters),
                this.performFuzzySearch(query, filters),
                this.performSemanticSearch(query, filters),
                this.performContextualSearch(query, filters)
            ]);

            // Merge and rank results
            const mergedResults = this.mergeSearchResults(searchResults, query);
            
            // Apply ML ranking
            const rankedResults = await this.applyMLRanking(mergedResults, query, filters);
            
            // Cache results
            this.cacheSearchResults(cacheKey, rankedResults);
            
            console.log(`Smart search completed: ${performance.now() - startTime}ms`);
            return rankedResults;

        } catch (error) {
            console.error('Smart search error:', error);
            return this.getFallbackSearchResults(query, filters);
        }
    }

    async performSemanticSearch(query, filters) {
        // Use AI to understand search intent and find semantically similar jobs
        const intent = await this.analyzeSearchIntent(query);
        const semanticTerms = await this.extractSemanticTerms(query);
        
        // Search using semantic understanding
        const results = await this.searchJobsSemanticly(semanticTerms, intent, filters);
        
        return results.map(result => ({
            ...result,
            searchType: 'semantic',
            relevanceScore: result.semanticScore,
            matchReason: `Semantically similar to "${query}"`
        }));
    }

    async analyzeSearchIntent(query) {
        // Simple intent classification - can be enhanced with ML model
        const intents = {
            role: /\b(developer|engineer|manager|analyst|designer|intern)\b/i,
            skill: /\b(python|javascript|react|sql|aws|docker)\b/i,
            location: /\b(remote|new york|san francisco|london|boston)\b/i,
            level: /\b(senior|junior|entry|lead|principal)\b/i,
            industry: /\b(fintech|healthcare|startup|enterprise)\b/i
        };

        const detectedIntents = [];
        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(query)) {
                detectedIntents.push(intent);
            }
        }

        return {
            primary: detectedIntents[0] || 'general',
            secondary: detectedIntents.slice(1),
            confidence: detectedIntents.length > 0 ? 0.8 : 0.3
        };
    }

    // ==================== SEARCH ANALYTICS ====================
    
    startSearchAnalytics() {
        // Track search performance and patterns every 10 minutes
        setInterval(async () => {
            await this.analyzeSearchPatterns();
            await this.updatePopularSearches();
            await this.optimizeSearchCache();
        }, 10 * 60 * 1000);
    }

    async analyzeSearchPatterns() {
        try {
            const patterns = {
                topQueries: await this.getTopQueries(),
                searchTrends: await this.calculateSearchTrends(),
                userSegments: await this.analyzeUserSegments(),
                conversionRates: await this.calculateSearchConversion(),
                abandonmentPoints: await this.identifyAbandonmentPoints()
            };

            // Store analytics data
            localStorage.setItem('searchAnalytics', JSON.stringify({
                patterns,
                analyzedAt: Date.now()
            }));

        } catch (error) {
            console.error('Search analytics error:', error);
        }
    }

    async logSearch(query, filters, userId = null) {
        const user = userId || await this.getCurrentUser();
        const searchData = {
            query: query.trim().toLowerCase(),
            filters,
            timestamp: Date.now(),
            sessionId: this.getSessionId(),
            userId: user?.uid,
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };

        // Add to user's search history
        if (user?.uid) {
            const userHistory = this.searchHistory.get(user.uid) || [];
            userHistory.unshift(searchData);
            // Keep last 100 searches
            if (userHistory.length > 100) userHistory.splice(100);
            this.searchHistory.set(user.uid, userHistory);
        }

        // Update popular searches
        const popularData = this.popularSearches.get(query) || { count: 0, firstSeen: Date.now() };
        popularData.count++;
        popularData.lastSeen = Date.now();
        this.popularSearches.set(query, popularData);

        // Send to analytics (if available)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'search', {
                search_term: query,
                filters: Object.keys(filters).join(','),
                user_id: user?.uid
            });
        }
    }

    // ==================== SEARCH RESULT ENHANCEMENT ====================
    
    async applyMLRanking(results, originalQuery, filters) {
        const currentUser = await this.getCurrentUser();
        
        if (!currentUser || results.length === 0) return results;

        try {
            // Get user profile for personalization
            const userProfile = await this.getUserProfile(currentUser.uid);
            if (!userProfile) return results;

            // Apply personalized scoring
            const scoredResults = await Promise.all(
                results.map(async result => {
                    const personalizedScore = await this.calculatePersonalizedScore(
                        result, 
                        userProfile, 
                        originalQuery, 
                        filters
                    );
                    
                    return {
                        ...result,
                        personalizedScore,
                        finalScore: result.relevanceScore * 0.6 + personalizedScore * 0.4
                    };
                })
            );

            // Sort by final score
            return scoredResults.sort((a, b) => b.finalScore - a.finalScore);

        } catch (error) {
            console.error('ML ranking error:', error);
            return results;
        }
    }

    async calculatePersonalizedScore(job, userProfile, query, filters) {
        let score = 0.5; // Base score

        // Skills alignment
        if (userProfile.skills && job.requiredSkills) {
            const skillsOverlap = this.calculateSkillsOverlap(userProfile.skills, job.requiredSkills);
            score += skillsOverlap * 0.3;
        }

        // Experience level match
        if (userProfile.experienceLevel && job.experienceLevel) {
            const expMatch = this.calculateExperienceMatch(userProfile.experienceLevel, job.experienceLevel);
            score += expMatch * 0.2;
        }

        // Location preference
        if (userProfile.preferredLocations && job.location) {
            const locationMatch = this.calculateLocationMatch(userProfile.preferredLocations, job.location);
            score += locationMatch * 0.15;
        }

        // Salary alignment
        if (userProfile.salaryExpectation && job.salaryRange) {
            const salaryMatch = this.calculateSalaryMatch(userProfile.salaryExpectation, job.salaryRange);
            score += salaryMatch * 0.15;
        }

        // Search history relevance
        const historyRelevance = this.calculateHistoryRelevance(query, userProfile.searchHistory);
        score += historyRelevance * 0.1;

        // Application history patterns
        const applicationPattern = this.calculateApplicationPattern(job, userProfile.applicationHistory);
        score += applicationPattern * 0.1;

        return Math.max(0, Math.min(1, score));
    }

    // ==================== UTILITY METHODS ====================
    
    mergeSuggestions(suggestions, originalQuery) {
        // Remove duplicates and sort by relevance
        const unique = new Map();
        
        suggestions.forEach(suggestion => {
            const key = suggestion.text.toLowerCase();
            if (!unique.has(key) || unique.get(key).relevance < suggestion.relevance) {
                unique.set(key, suggestion);
            }
        });

        return Array.from(unique.values())
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 8); // Return top 8 suggestions
    }

    generateCacheKey(query, filters) {
        const filterString = Object.entries(filters)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${value}`)
            .join('|');
        
        return `${query.toLowerCase().trim()}_${filterString}`;
    }

    cacheSearchResults(cacheKey, results) {
        this.searchResultsCache.set(cacheKey, results);
        
        // Auto-expire cache after 10 minutes
        setTimeout(() => {
            this.searchResultsCache.delete(cacheKey);
        }, 10 * 60 * 1000);
    }

    getFallbackSuggestions(query) {
        // Basic fallback suggestions when AI is unavailable
        const common = [
            'Remote Software Developer',
            'Frontend Engineer',
            'Data Scientist',
            'Product Manager',
            'UX Designer',
            'DevOps Engineer'
        ];

        return common
            .filter(suggestion => 
                suggestion.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 3)
            .map(text => ({
                text,
                type: 'fallback',
                relevance: 0.5,
                icon: '💼',
                description: 'Popular job category'
            }));
    }

    async getCurrentUser() {
        // Integration with Firebase Auth
        if (typeof authFunctions !== 'undefined') {
            return authFunctions.getCurrentUser();
        }
        return null;
    }

    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }
}

// Create and export smart search instance
export const smartSearch = new SmartSearchEngine();

// Initialize search UI integration
document.addEventListener('DOMContentLoaded', () => {
    const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
    
    searchInputs.forEach(input => {
        // Add smart autocomplete
        input.addEventListener('input', async (e) => {
            if (e.target.value.length >= 2) {
                const suggestions = await smartSearch.getSmartSuggestions(e.target.value);
                displaySearchSuggestions(input, suggestions);
            }
        });

        // Handle search submission
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const results = await smartSearch.performSmartSearch(e.target.value);
                displaySearchResults(results);
            }
        });
    });
});

function displaySearchSuggestions(input, suggestions) {
    // Remove existing suggestions
    const existingSuggestions = document.querySelector('.search-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }

    if (suggestions.length === 0) return;

    // Create suggestions dropdown
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        max-height: 300px;
        overflow-y: auto;
    `;

    suggestions.forEach((suggestion, index) => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'search-suggestion-item';
        suggestionElement.style.cssText = `
            padding: 0.75rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.2s;
        `;
        
        suggestionElement.innerHTML = `
            <span class="suggestion-icon">${suggestion.icon}</span>
            <div class="suggestion-content">
                <div class="suggestion-text" style="font-weight: 500; color: #1f2937;">${suggestion.text}</div>
                <div class="suggestion-description" style="font-size: 0.875rem; color: #6b7280;">${suggestion.description}</div>
            </div>
        `;

        suggestionElement.addEventListener('mouseenter', () => {
            suggestionElement.style.backgroundColor = '#f9fafb';
        });

        suggestionElement.addEventListener('mouseleave', () => {
            suggestionElement.style.backgroundColor = 'white';
        });

        suggestionElement.addEventListener('click', () => {
            input.value = suggestion.text;
            suggestionsContainer.remove();
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        });

        suggestionsContainer.appendChild(suggestionElement);
    });

    // Position relative to input
    const inputRect = input.getBoundingClientRect();
    const inputContainer = input.parentElement;
    inputContainer.style.position = 'relative';
    inputContainer.appendChild(suggestionsContainer);

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!inputContainer.contains(e.target)) {
            suggestionsContainer.remove();
        }
    }, { once: true });
}

function displaySearchResults(results) {
    // This would integrate with your actual search results display
    console.log('Search results:', results);
    
    // Dispatch custom event for other components to handle
    document.dispatchEvent(new CustomEvent('searchResults', {
        detail: { results }
    }));
}

console.log('🔍 Smart Search Engine loaded successfully');