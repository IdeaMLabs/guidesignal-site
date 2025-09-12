// Optimized Secure Firebase Configuration and Utilities for GuideSignal
// Production-optimized version with debug logging removed

class FirebaseConfigManager {
    constructor() {
        this.isInitialized = false;
        this.app = null;
        this.auth = null;
        this.db = null;
        this.config = null;
    }

    // Initialize Firebase with secure configuration
    async initialize() {
        if (this.isInitialized) {
            return { success: true, message: 'Firebase already initialized' };
        }

        try {
            // Import Firebase modules dynamically for better performance
            const [
                { initializeApp },
                { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail },
                { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs }
            ] = await Promise.all([
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'),
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'),
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')
            ]);

            this.firebaseMethods = {
                initializeApp,
                getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
                signOut, onAuthStateChanged, sendPasswordResetEmail,
                getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs
            };

            this.config = await this.getSecureConfig();
            
            if (!this.config) {
                throw new Error('Failed to load Firebase configuration');
            }

            this.app = initializeApp(this.config);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);

            this.isInitialized = true;
            return { success: true, message: 'Firebase initialized successfully' };

        } catch (error) {
            return { 
                success: false, 
                message: 'Firebase initialization failed', 
                error: error.message 
            };
        }
    }

    // Get secure configuration from encrypted source
    async getSecureConfig() {
        try {
            // Try to get configuration from encrypted config file
            const response = await fetch('config/encrypted-firebase-config.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const encryptedConfig = await response.json();
            
            // Decrypt the configuration
            const decryptedConfig = await this.decryptConfig(encryptedConfig);
            
            return decryptedConfig;
        } catch (error) {
            // Fallback to environment variables or default config
            return this.getFallbackConfig();
        }
    }

    // Decrypt encrypted configuration
    async decryptConfig(encryptedData) {
        if (!encryptedData.data || !encryptedData.iv) {
            throw new Error('Invalid encrypted configuration format');
        }

        try {
            // Convert array to Uint8Array for decryption
            const data = new Uint8Array(encryptedData.data);
            const iv = new Uint8Array(encryptedData.iv);
            
            // Get encryption key from environment or secure storage
            const key = await this.getDecryptionKey();
            
            // Decrypt the data using AES-GCM
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                data
            );
            
            // Convert decrypted data to string and parse as JSON
            const configString = new TextDecoder().decode(decrypted);
            return JSON.parse(configString);
            
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    // Get decryption key (in production, this should be from secure key management)
    async getDecryptionKey() {
        const keyString = window.location.hostname + 'guidesignal-secret-key';
        const keyData = new TextEncoder().encode(keyString);
        
        return await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
    }

    // Fallback configuration for development
    getFallbackConfig() {
        const hostname = window.location.hostname.toLowerCase();
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168')) {
            // Development configuration (should be replaced with actual values)
            return {
                apiKey: process.env.FIREBASE_API_KEY || "your-dev-api-key",
                authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
                projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
                appId: process.env.FIREBASE_APP_ID || "your-app-id"
            };
        }
        
        // Production fallback (minimal config)
        return null;
    }
}

// User roles enum
const USER_ROLES = {
    STUDENT: 'student',
    JOB_SEEKER: 'job-seeker', 
    RECRUITER: 'recruiter',
    ADMIN: 'admin'
};

// Initialize the Firebase configuration manager
const firebaseManager = new FirebaseConfigManager();

// Authentication functions
class AuthFunctions {
    constructor(manager) {
        this.manager = manager;
    }

    // Initialize authentication
    async initialize() {
        const result = await this.manager.initialize();
        if (!result.success) {
            throw new Error(result.message);
        }
        return result;
    }

    // Register a new user
    async registerUser(email, password, name, role, additionalData = {}) {
        try {
            await this.initialize();
            
            const { createUserWithEmailAndPassword, doc, setDoc } = this.manager.firebaseMethods;
            
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(this.manager.auth, email, password);
            const user = userCredential.user;
            
            // Prepare user data
            const userData = {
                uid: user.uid,
                email: email,
                name: name,
                role: role,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                ...additionalData
            };
            
            // Save user data to Firestore
            const userDocRef = doc(this.manager.db, 'users', user.uid);
            await setDoc(userDocRef, userData);
            
            return {
                success: true,
                user: user,
                userData: userData,
                emailVerificationSent: false
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.code || error.message,
                message: this.getErrorMessage(error)
            };
        }
    }

    // Sign in user
    async signInUser(email, password, rememberMe = false) {
        try {
            await this.initialize();
            
            const { signInWithEmailAndPassword, doc, setDoc } = this.manager.firebaseMethods;
            
            const userCredential = await signInWithEmailAndPassword(this.manager.auth, email, password);
            const user = userCredential.user;
            
            // Update last login
            const userDocRef = doc(this.manager.db, 'users', user.uid);
            await setDoc(userDocRef, {
                lastLogin: new Date().toISOString(),
                rememberMe: rememberMe
            }, { merge: true });
            
            return {
                success: true,
                user: user
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.code || error.message,
                message: this.getErrorMessage(error)
            };
        }
    }

    // Sign out user
    async signOutUser() {
        try {
            await this.initialize();
            await this.manager.firebaseMethods.signOut(this.manager.auth);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.code || error.message
            };
        }
    }

    // Send password reset email
    async sendPasswordReset(email) {
        try {
            await this.initialize();
            await this.manager.firebaseMethods.sendPasswordResetEmail(this.manager.auth, email);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.code || error.message
            };
        }
    }

    // Check if email exists
    async checkEmailExists(email) {
        try {
            await this.initialize();
            
            const { collection, query, where, getDocs } = this.manager.firebaseMethods;
            
            const q = query(collection(this.manager.db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            return {
                success: true,
                exists: !querySnapshot.empty
            };
        } catch (error) {
            return {
                success: false,
                error: error.code || error.message
            };
        }
    }

    // Listen to auth state changes
    onAuthStateChanged(callback) {
        if (this.manager.auth) {
            return this.manager.firebaseMethods.onAuthStateChanged(this.manager.auth, callback);
        }
        return null;
    }

    // Get user-friendly error messages
    getErrorMessage(error) {
        const errorMappings = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Please choose a stronger password.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };
        
        const errorCode = error.code || error.message;
        return errorMappings[errorCode] || 'An error occurred. Please try again.';
    }
}

// Utility functions
class Utils {
    constructor(manager) {
        this.manager = manager;
    }

    // Get user role from database
    async getUserRole(uid) {
        try {
            await this.manager.initialize();
            
            const { doc, getDoc } = this.manager.firebaseMethods;
            const userDocRef = doc(this.manager.db, 'users', uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                return userDoc.data().role;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    // Redirect to appropriate dashboard based on role
    redirectToDashboard(role) {
        const dashboards = {
            [USER_ROLES.STUDENT]: '/student-dashboard.html',
            [USER_ROLES.JOB_SEEKER]: '/dashboard.html',
            [USER_ROLES.RECRUITER]: '/recruiter-dashboard.html',
            [USER_ROLES.ADMIN]: '/admin-dashboard.html'
        };
        
        const dashboard = dashboards[role] || '/dashboard.html';
        window.location.href = dashboard;
    }

    // Validate user permissions
    async validatePermissions(uid, requiredRole) {
        const userRole = await this.getUserRole(uid);
        return userRole === requiredRole || userRole === USER_ROLES.ADMIN;
    }

    // Log security events (in production, send to monitoring service)
    logSecurityEvent(event, details = {}) {
        if (process.env.NODE_ENV === 'development') {
            return;
        }
        
        // In production, send to logging service
        const logData = {
            event,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Send to monitoring service (implementation depends on your monitoring setup)
        this.sendToMonitoringService(logData);
    }

    // Send data to monitoring service
    async sendToMonitoringService(data) {
        try {
            // Replace with your actual monitoring service endpoint
            await fetch('/api/security-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            // Silently fail in production
        }
    }
}

// Create instances
const authFunctions = new AuthFunctions(firebaseManager);
const utils = new Utils(firebaseManager);

// Export for use in other modules
export { authFunctions, utils, USER_ROLES, firebaseManager };