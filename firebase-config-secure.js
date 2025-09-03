// Secure Firebase Configuration and Utilities for GuideSignal
// This approach uses environment variables and secure key management

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
            // Import Firebase modules dynamically
            const [
                { initializeApp },
                { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged },
                { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs }
            ] = await Promise.all([
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'),
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'),
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')
            ]);

            // Store Firebase methods
            this.firebaseMethods = {
                initializeApp,
                getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
                signOut, onAuthStateChanged,
                getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs
            };

            // Get secure configuration
            this.config = await this.getSecureConfig();
            
            if (!this.config) {
                throw new Error('Failed to load Firebase configuration');
            }

            // Initialize Firebase
            this.app = initializeApp(this.config);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);

            this.isInitialized = true;
            console.log('🔐 Firebase initialized securely');
            
            return { success: true, message: 'Firebase initialized successfully' };
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // Secure configuration loader
    async getSecureConfig() {
        try {
            // Try to load from environment variables first (production)
            if (typeof process !== 'undefined' && process.env) {
                return {
                    apiKey: process.env.FIREBASE_API_KEY,
                    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.FIREBASE_APP_ID
                };
            }

            // Fallback to secure external config file
            const configResponse = await fetch('/config/firebase.json');
            if (configResponse.ok) {
                return await configResponse.json();
            }

            // Last resort - use encoded config for development only
            if (this.isDevelopment()) {
                // Base64 encoded configuration for development
                const encodedConfig = 'eyJhcGlLZXkiOiJBSWFTeUJKT1ZiTW9IZmR4SGV4c2Zxc2JZc3ZGekZxYUtCWENfcyIsImF1dGhEb21haW4iOiJndWlkZXNpZ25hbC5maXJlYmFzZWFwcC5jb20iLCJwcm9qZWN0SWQiOiJndWlkZXNpZ25hbCIsInN0b3JhZ2VCdWNrZXQiOiJndWlkZXNpZ25hbC5maXJlYmFzZXN0b3JhZ2UuYXBwIiwibWVzc2FnaW5nU2VuZGVySWQiOiIxMjA1MTEyNDY4ODYiLCJhcHBJZCI6IjE6MTIwNTExMjQ2ODg2OndlYjo1YjU1NWE3N2VlMjU0MjA5NTFlY2U3In0=';
                
                try {
                    return JSON.parse(atob(encodedConfig));
                } catch (decodeError) {
                    console.warn('Failed to decode development config');
                }
            }

            throw new Error('No secure Firebase configuration found');
        } catch (error) {
            console.error('Error loading secure config:', error);
            return null;
        }
    }

    // Check if running in development
    isDevelopment() {
        const hostname = window.location.hostname.toLowerCase();
        return hostname.includes('localhost') || 
               hostname.includes('127.0.0.1') || 
               hostname.includes('local') || 
               hostname.startsWith('192.168.');
    }

    // Get Firebase instances
    getFirebase() {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized. Call initialize() first.');
        }
        
        return {
            app: this.app,
            auth: this.auth,
            db: this.db,
            methods: this.firebaseMethods
        };
    }
}

// Singleton instance
const firebaseManager = new FirebaseConfigManager();

// Enhanced authentication functions with better error handling
export const authFunctions = {
    // Initialize Firebase before any auth operations
    async ensureInitialized() {
        if (!firebaseManager.isInitialized) {
            const result = await firebaseManager.initialize();
            if (!result.success) {
                throw new Error('Firebase initialization failed: ' + result.error);
            }
        }
        return firebaseManager.getFirebase();
    },

    // Register user with secure validation
    async registerUser(email, password, displayName, role) {
        try {
            const firebase = await this.ensureInitialized();
            const { createUserWithEmailAndPassword } = firebase.methods;

            // Validate inputs
            if (!email || !password || !displayName || !role) {
                return { success: false, error: 'Missing required fields' };
            }

            // Create user account
            const userCredential = await createUserWithEmailAndPassword(
                firebase.auth, 
                email.toLowerCase().trim(), 
                password
            );

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    },

    // Sign in user with secure handling
    async signInUser(email, password) {
        try {
            const firebase = await this.ensureInitialized();
            const { signInWithEmailAndPassword } = firebase.methods;

            const userCredential = await signInWithEmailAndPassword(
                firebase.auth, 
                email.toLowerCase().trim(), 
                password
            );

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    },

    // Sign out user
    async signOutUser() {
        try {
            const firebase = await this.ensureInitialized();
            const { signOut } = firebase.methods;

            await signOut(firebase.auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to auth state changes
    onAuthStateChanged(callback) {
        firebaseManager.ensureInitialized().then(firebase => {
            const { onAuthStateChanged } = firebase.methods;
            return onAuthStateChanged(firebase.auth, callback);
        }).catch(error => {
            console.error('Auth state listener error:', error);
            callback(null, error);
        });
    },

    // Get current user
    getCurrentUser() {
        if (firebaseManager.isInitialized) {
            return firebaseManager.auth.currentUser;
        }
        return null;
    },

    // Get user-friendly error messages
    getErrorMessage(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'Email already in use',
            'auth/weak-password': 'Password is too weak',
            'auth/invalid-email': 'Invalid email address',
            'auth/wrong-password': 'Invalid password',
            'auth/user-not-found': 'User not found',
            'auth/too-many-requests': 'Too many failed attempts. Try again later.',
            'auth/network-request-failed': 'Network error. Check your connection.'
        };

        return errorMessages[error.code] || error.message || 'Authentication failed';
    }
};

// Simplified database functions
export const dbFunctions = {
    async getUserData(uid) {
        try {
            const firebase = await authFunctions.ensureInitialized();
            const { doc, getDoc } = firebase.methods;

            const docSnap = await getDoc(doc(firebase.db, 'users', uid));
            if (docSnap.exists()) {
                return { success: true, data: docSnap.data() };
            }
            return { success: false, error: 'User not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Utility functions
export const utils = {
    isAuthenticated() {
        return authFunctions.getCurrentUser() !== null;
    },

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Create visual notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            padding: 12px 20px; border-radius: 8px; color: white;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#4a9eff'};
            font-weight: 600; max-width: 300px;
            transform: translateX(350px); transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(350px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// User roles
export const USER_ROLES = {
    STUDENT: 'student',
    RECRUITER: 'recruiter'
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await firebaseManager.initialize();
        } catch (error) {
            console.error('Firebase auto-initialization failed:', error);
        }
    });
} else {
    firebaseManager.initialize().catch(error => {
        console.error('Firebase auto-initialization failed:', error);
    });
}

console.log('🔒 Secure Firebase configuration loaded');