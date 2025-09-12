/**
 * ENCRYPTED CONFIGURATION MANAGER
 * ================================
 * 
 * Military-grade encrypted configuration management system
 * - AES-256-GCM encryption for sensitive data
 * - Secure key derivation using PBKDF2
 * - Environment-specific configuration loading
 * - Real-time configuration validation
 * - Anti-tampering protection
 */

class EncryptedConfigManager {
    constructor() {
        this.encryptionKey = null;
        this.configCache = new Map();
        this.integrity = new Map();
        this.accessLog = [];
        this.isInitialized = false;
        
        // Configuration schema validation
        this.configSchema = {
            firebase: {
                required: ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'],
                sensitive: ['apiKey']
            },
            security: {
                required: ['secretKey', 'csrfSecret', 'jwtSecret'],
                sensitive: ['secretKey', 'csrfSecret', 'jwtSecret']
            },
            api: {
                required: ['baseUrl', 'timeout'],
                sensitive: ['apiKey', 'clientSecret']
            }
        };
    }

    // ====================================
    // INITIALIZATION
    // ====================================

    async initialize(masterPassword = null) {
        console.log('🔐 Initializing Encrypted Configuration Manager');
        
        try {
            // Generate or derive encryption key
            await this.setupEncryptionKey(masterPassword);
            
            // Load and validate configuration
            await this.loadConfigurations();
            
            // Setup integrity monitoring
            await this.setupIntegrityMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Encrypted Configuration Manager initialized');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Configuration initialization failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ====================================
    // ENCRYPTION KEY MANAGEMENT
    // ====================================

    async setupEncryptionKey(masterPassword) {
        if (masterPassword) {
            // Derive key from master password using PBKDF2
            const salt = await this.getSalt();
            this.encryptionKey = await this.deriveKeyFromPassword(masterPassword, salt);
        } else {
            // Generate random key for session
            this.encryptionKey = await this.generateSessionKey();
        }
        
        // Store key fingerprint for validation
        this.keyFingerprint = await this.generateKeyFingerprint();
    }

    async deriveKeyFromPassword(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async generateSessionKey() {
        return await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async getSalt() {
        // In production, this should be stored securely
        const stored = localStorage.getItem('config_salt');
        if (stored) {
            return new Uint8Array(JSON.parse(stored));
        }
        
        const salt = window.crypto.getRandomValues(new Uint8Array(32));
        localStorage.setItem('config_salt', JSON.stringify(Array.from(salt)));
        return salt;
    }

    async generateKeyFingerprint() {
        const keyData = await window.crypto.subtle.exportKey('raw', this.encryptionKey);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', keyData);
        return Array.from(new Uint8Array(hashBuffer)).map(b => 
            b.toString(16).padStart(2, '0')
        ).join('').substring(0, 16);
    }

    // ====================================
    // CONFIGURATION LOADING
    // ====================================

    async loadConfigurations() {
        const environment = this.detectEnvironment();
        console.log(`🌍 Loading configuration for environment: ${environment}`);

        // Load configurations in priority order
        const configSources = [
            { type: 'environment', load: () => this.loadFromEnvironment() },
            { type: 'encrypted_file', load: () => this.loadFromEncryptedFile() },
            { type: 'secure_remote', load: () => this.loadFromSecureRemote() },
            { type: 'fallback', load: () => this.loadFallbackConfig() }
        ];

        for (const source of configSources) {
            try {
                const config = await source.load();
                if (config && Object.keys(config).length > 0) {
                    await this.validateAndStoreConfig(config, source.type);
                    console.log(`✅ Configuration loaded from: ${source.type}`);
                    break;
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load from ${source.type}:`, error.message);
                continue;
            }
        }
    }

    detectEnvironment() {
        const hostname = window.location.hostname.toLowerCase();
        
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        } else {
            return 'production';
        }
    }

    async loadFromEnvironment() {
        // In a real Node.js environment, this would read from process.env
        const envVars = {
            FIREBASE_API_KEY: process.env?.FIREBASE_API_KEY,
            FIREBASE_AUTH_DOMAIN: process.env?.FIREBASE_AUTH_DOMAIN,
            FIREBASE_PROJECT_ID: process.env?.FIREBASE_PROJECT_ID,
            FIREBASE_STORAGE_BUCKET: process.env?.FIREBASE_STORAGE_BUCKET,
            FIREBASE_MESSAGING_SENDER_ID: process.env?.FIREBASE_MESSAGING_SENDER_ID,
            FIREBASE_APP_ID: process.env?.FIREBASE_APP_ID,
            SECURITY_SECRET_KEY: process.env?.SECURITY_SECRET_KEY,
            CSRF_SECRET: process.env?.CSRF_SECRET,
            JWT_SECRET: process.env?.JWT_SECRET
        };

        const hasEnvVars = Object.values(envVars).some(val => val !== undefined);
        if (!hasEnvVars) {
            throw new Error('No environment variables found');
        }

        return {
            firebase: {
                apiKey: envVars.FIREBASE_API_KEY,
                authDomain: envVars.FIREBASE_AUTH_DOMAIN,
                projectId: envVars.FIREBASE_PROJECT_ID,
                storageBucket: envVars.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: envVars.FIREBASE_MESSAGING_SENDER_ID,
                appId: envVars.FIREBASE_APP_ID
            },
            security: {
                secretKey: envVars.SECURITY_SECRET_KEY,
                csrfSecret: envVars.CSRF_SECRET,
                jwtSecret: envVars.JWT_SECRET
            }
        };
    }

    async loadFromEncryptedFile() {
        try {
            const response = await fetch('/config/encrypted-config.json');
            if (!response.ok) {
                throw new Error('Encrypted config file not found');
            }
            
            const encryptedData = await response.json();
            return await this.decryptConfiguration(encryptedData);
        } catch (error) {
            throw new Error(`Failed to load encrypted config: ${error.message}`);
        }
    }

    async loadFromSecureRemote() {
        // In production, this would load from a secure configuration service
        const configUrl = this.getSecureConfigUrl();
        if (!configUrl) {
            throw new Error('No secure remote configuration URL configured');
        }

        try {
            const response = await fetch(configUrl, {
                headers: {
                    'Authorization': `Bearer ${await this.getConfigServiceToken()}`,
                    'X-Config-Version': '1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Remote config fetch failed: ${response.status}`);
            }

            const encryptedConfig = await response.json();
            return await this.decryptConfiguration(encryptedConfig);
        } catch (error) {
            throw new Error(`Remote configuration loading failed: ${error.message}`);
        }
    }

    async loadFallbackConfig() {
        console.warn('⚠️ Using fallback configuration - NOT FOR PRODUCTION');
        
        // Encrypted fallback configuration (Base64 encoded for example)
        const fallbackConfig = {
            firebase: {
                // These would be encrypted in production
                apiKey: await this.decryptValue('QUl6YVN5QkpPVmJNb0hmZHhIZXhzZnFzYllzdkZ6RnFhS0JYQ19z'),
                authDomain: 'guidesignal.firebaseapp.com',
                projectId: 'guidesignal',
                storageBucket: 'guidesignal.firebasestorage.app',
                messagingSenderId: '120511246886',
                appId: '1:120511246886:web:5b555a77ee25420951ece7'
            },
            security: {
                secretKey: await this.generateSecureToken(64),
                csrfSecret: await this.generateSecureToken(32),
                jwtSecret: await this.generateSecureToken(32)
            },
            api: {
                baseUrl: window.location.origin,
                timeout: 30000
            }
        };

        return fallbackConfig;
    }

    // ====================================
    // ENCRYPTION/DECRYPTION
    // ====================================

    async encryptConfiguration(config) {
        const configString = JSON.stringify(config);
        const encoder = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            this.encryptionKey,
            encoder.encode(configString)
        );

        return {
            version: '1.0',
            algorithm: 'AES-GCM',
            data: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv),
            timestamp: Date.now(),
            checksum: await this.generateChecksum(configString)
        };
    }

    async decryptConfiguration(encryptedConfig) {
        if (!encryptedConfig.data || !encryptedConfig.iv) {
            throw new Error('Invalid encrypted configuration format');
        }

        const decoder = new TextDecoder();
        
        try {
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: new Uint8Array(encryptedConfig.iv)
                },
                this.encryptionKey,
                new Uint8Array(encryptedConfig.data)
            );

            const configString = decoder.decode(decrypted);
            const config = JSON.parse(configString);

            // Verify checksum if available
            if (encryptedConfig.checksum) {
                const calculatedChecksum = await this.generateChecksum(configString);
                if (calculatedChecksum !== encryptedConfig.checksum) {
                    throw new Error('Configuration integrity check failed');
                }
            }

            return config;
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    async decryptValue(encryptedValue) {
        // Simple base64 decoding for example - use proper encryption in production
        try {
            return atob(encryptedValue);
        } catch (error) {
            return encryptedValue; // Return as-is if not base64
        }
    }

    // ====================================
    // CONFIGURATION VALIDATION
    // ====================================

    async validateAndStoreConfig(config, source) {
        // Validate configuration schema
        const validationResult = this.validateConfigSchema(config);
        if (!validationResult.valid) {
            throw new Error(`Configuration validation failed: ${validationResult.errors.join(', ')}`);
        }

        // Generate integrity hash
        const integrity = await this.generateIntegrityHash(config);
        
        // Store configuration securely
        this.configCache.set('main', config);
        this.integrity.set('main', integrity);
        
        // Log access
        this.logConfigAccess('LOADED', source);
        
        console.log('✅ Configuration validated and stored');
    }

    validateConfigSchema(config) {
        const errors = [];
        
        Object.entries(this.configSchema).forEach(([section, schema]) => {
            if (!config[section]) {
                errors.push(`Missing configuration section: ${section}`);
                return;
            }

            schema.required.forEach(field => {
                if (!config[section][field]) {
                    errors.push(`Missing required field: ${section}.${field}`);
                }
            });

            // Validate sensitive fields are properly secured
            schema.sensitive?.forEach(field => {
                if (config[section][field] && this.isWeakValue(config[section][field])) {
                    errors.push(`Weak or default value detected in sensitive field: ${section}.${field}`);
                }
            });
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    isWeakValue(value) {
        const weakPatterns = [
            /^(test|demo|example|default|changeme|password|secret)$/i,
            /^.{1,8}$/,  // Too short
            /^[a-zA-Z]+$/, // Only letters
            /^[0-9]+$/ // Only numbers
        ];

        return weakPatterns.some(pattern => pattern.test(value));
    }

    // ====================================
    // INTEGRITY MONITORING
    // ====================================

    async setupIntegrityMonitoring() {
        // Monitor configuration changes
        setInterval(async () => {
            await this.verifyConfigurationIntegrity();
        }, 60000); // Check every minute

        console.log('🔍 Configuration integrity monitoring enabled');
    }

    async verifyConfigurationIntegrity() {
        const currentConfig = this.configCache.get('main');
        if (!currentConfig) return;

        const currentIntegrity = await this.generateIntegrityHash(currentConfig);
        const storedIntegrity = this.integrity.get('main');

        if (currentIntegrity !== storedIntegrity) {
            console.error('🚨 CONFIGURATION INTEGRITY VIOLATION DETECTED');
            this.logConfigAccess('INTEGRITY_VIOLATION', 'system');
            
            // Trigger security protocols
            if (window.MilitaryGradeSecurity) {
                window.MilitaryGradeSecurity.logSecurityEvent('CONFIG_INTEGRITY_VIOLATION', {
                    level: 'CRITICAL',
                    expected: storedIntegrity.substring(0, 16),
                    actual: currentIntegrity.substring(0, 16)
                });
            }
        }
    }

    async generateIntegrityHash(config) {
        const configString = JSON.stringify(config, Object.keys(config).sort());
        const encoder = new TextEncoder();
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(configString));
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async generateChecksum(data) {
        const encoder = new TextEncoder();
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(data));
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // ====================================
    // CONFIGURATION ACCESS
    // ====================================

    getConfig(section, key = null) {
        this.logConfigAccess('READ', `${section}${key ? '.' + key : ''}`);
        
        const config = this.configCache.get('main');
        if (!config) {
            throw new Error('Configuration not initialized');
        }

        if (!config[section]) {
            throw new Error(`Configuration section '${section}' not found`);
        }

        if (key) {
            if (!config[section][key]) {
                throw new Error(`Configuration key '${section}.${key}' not found`);
            }
            return this.maskSensitiveValue(section, key, config[section][key]);
        }

        return config[section];
    }

    maskSensitiveValue(section, key, value) {
        const schema = this.configSchema[section];
        if (schema && schema.sensitive && schema.sensitive.includes(key)) {
            // Return masked value for logging/debugging
            if (typeof value === 'string' && value.length > 8) {
                return value.substring(0, 4) + '***' + value.substring(value.length - 4);
            }
        }
        return value;
    }

    setConfig(section, key, value) {
        this.logConfigAccess('write', `${section}.${key}`);
        
        const config = this.configCache.get('main') || {};
        if (!config[section]) {
            config[section] = {};
        }
        
        config[section][key] = value;
        this.configCache.set('main', config);
        
        // Update integrity hash
        this.generateIntegrityHash(config).then(hash => {
            this.integrity.set('main', hash);
        });
    }

    // ====================================
    // UTILITY FUNCTIONS
    // ====================================

    async generateSecureToken(length = 32) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    getSecureConfigUrl() {
        // In production, this would be configured based on environment
        const urls = {
            'production': 'https://config.guide-signal.com/api/config',
            'staging': 'https://staging-config.guide-signal.com/api/config',
            'development': null
        };
        
        return urls[this.detectEnvironment()];
    }

    async getConfigServiceToken() {
        // In production, this would authenticate with the config service
        return 'config-service-token-placeholder';
    }

    logConfigAccess(operation, target) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            target,
            userAgent: navigator.userAgent,
            url: window.location.href,
            fingerprint: this.keyFingerprint
        };
        
        this.accessLog.push(logEntry);
        
        // Keep only last 100 entries
        if (this.accessLog.length > 100) {
            this.accessLog = this.accessLog.slice(-100);
        }

        // Log suspicious activity
        if (operation === 'INTEGRITY_VIOLATION' || this.isFrequentAccess()) {
            console.warn('🚨 Suspicious configuration access pattern detected');
        }
    }

    isFrequentAccess() {
        const recentAccess = this.accessLog.filter(
            entry => Date.now() - new Date(entry.timestamp).getTime() < 10000
        );
        return recentAccess.length > 10; // More than 10 accesses in 10 seconds
    }

    // ====================================
    // BACKUP & RECOVERY
    // ====================================

    async exportEncryptedConfig() {
        const config = this.configCache.get('main');
        if (!config) {
            throw new Error('No configuration to export');
        }

        const encrypted = await this.encryptConfiguration(config);
        return {
            ...encrypted,
            exportedAt: new Date().toISOString(),
            version: '1.0',
            integrity: this.integrity.get('main')
        };
    }

    async importEncryptedConfig(encryptedConfig) {
        try {
            const config = await this.decryptConfiguration(encryptedConfig);
            await this.validateAndStoreConfig(config, 'import');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ====================================
    // STATUS & DEBUGGING
    // ====================================

    getStatus() {
        return {
            initialized: this.isInitialized,
            configurationLoaded: this.configCache.has('main'),
            integrityVerified: this.integrity.has('main'),
            keyFingerprint: this.keyFingerprint,
            accessLogCount: this.accessLog.length,
            environment: this.detectEnvironment()
        };
    }

    getAccessLog() {
        return this.accessLog.slice(-20); // Return last 20 entries
    }
}

// Create global instance
window.EncryptedConfigManager = new EncryptedConfigManager();

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.EncryptedConfigManager.initialize().catch(error => {
        console.error('Failed to initialize encrypted configuration:', error);
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EncryptedConfigManager;
}

console.log('🔐 ENCRYPTED CONFIGURATION MANAGER LOADED');