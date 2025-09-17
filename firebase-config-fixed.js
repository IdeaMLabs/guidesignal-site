// Firebase Configuration and Utilities for GuideSignal - FIXED VERSION
// Using Firebase v9 for better compatibility
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendEmailVerification, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, orderBy, limit, serverTimestamp, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Firebase configuration - FIXED
const firebaseConfig = {
  apiKey: "AIzaSyBJOVbMoHfdxHexsfqsbYsvFzFqaKBXC_s",
  authDomain: "guidesignal.firebaseapp.com",
  projectId: "guidesignal",
  storageBucket: "guidesignal.appspot.com", // FIXED: Using standard .appspot.com domain
  messagingSenderId: "120511246886",
  appId: "1:120511246886:web:5b555a77ee25420951ece7"
};

// Initialize Firebase with error handling
let app, auth, db;

try {
  console.log('🔄 Initializing Firebase with config:', firebaseConfig);
  app = initializeApp(firebaseConfig);

  // Initialize Auth with explicit project configuration
  auth = getAuth(app);

  // Initialize Firestore
  db = getFirestore(app);

  console.log('✅ Firebase initialized successfully');
  console.log('📋 Auth domain:', firebaseConfig.authDomain);
  console.log('🆔 Project ID:', firebaseConfig.projectId);

} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

// User roles
const USER_ROLES = {
  STUDENT: 'student',
  RECRUITER: 'recruiter'
};

// Enhanced authentication functions with better error handling
export const authFunctions = {
  // Enhanced user registration with email verification
  async registerUser(email, password, displayName, role, additionalData = {}) {
    console.log('🔥 registerUser called with:', { email, displayName, role, additionalData: Object.keys(additionalData) });

    try {
      // Validate Firebase is properly initialized
      if (!auth) {
        throw new Error('Firebase Auth not initialized. Please check your configuration.');
      }

      // Validate input parameters with detailed logging
      if (!email) {
        console.error('❌ Registration failed: Missing email');
        return { success: false, error: 'Email is required' };
      }
      if (!password) {
        console.error('❌ Registration failed: Missing password');
        return { success: false, error: 'Password is required' };
      }
      if (!displayName) {
        console.error('❌ Registration failed: Missing display name');
        return { success: false, error: 'Display name is required' };
      }
      if (!role) {
        console.error('❌ Registration failed: Missing role');
        return { success: false, error: 'Role is required' };
      }

      console.log('✅ Input validation passed');

      // Normalize inputs
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedName = displayName.trim();

      // Check if email already exists in our user collection
      const existingUserQuery = query(collection(db, 'users'), where('email', '==', normalizedEmail));
      const existingUsers = await getDocs(existingUserQuery);

      if (!existingUsers.empty) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;

      try {
        // Update display name
        await updateProfile(user, { displayName: normalizedName });

        // Send email verification
        let emailVerificationSent = false;
        try {
          await sendEmailVerification(user, {
            url: window.location.origin + '/confirmation.html?verified=true',
            handleCodeInApp: false
          });
          emailVerificationSent = true;
        } catch (emailError) {
          console.warn('Email verification failed to send:', emailError);
          // Continue with registration even if email fails
        }

        // Create comprehensive user document in Firestore
        const userData = {
          uid: user.uid,
          email: normalizedEmail,
          displayName: normalizedName,
          role: role,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          emailVerified: false,
          emailVerificationSent: emailVerificationSent,
          loginAttempts: 0,
          lastFailedLogin: null,
          accountStatus: 'active',
          profileCompleted: false,
          securityLevel: 'basic',
          registrationSource: 'web_form',
          preferences: {
            notifications: true,
            marketing: false,
            rememberMe: false,
            theme: 'light'
          },
          metadata: {
            userAgent: navigator.userAgent,
            registrationDate: new Date().toISOString(),
            lastActivity: serverTimestamp()
          },
          ...additionalData
        };

        await setDoc(doc(db, 'users', user.uid), userData);

        // Log successful registration
        await this.logSecurityEvent(user.uid, 'account_created', {
          method: 'email_password',
          role: role,
          emailVerificationSent: emailVerificationSent,
          timestamp: new Date().toISOString()
        });

        console.log('User registered successfully:', user.uid);
        return {
          success: true,
          user,
          userData,
          emailVerificationSent
        };

      } catch (profileError) {
        // If profile setup fails, clean up the created user
        console.error('Profile setup failed, cleaning up user:', profileError);

        try {
          await user.delete();
        } catch (deleteError) {
          console.error('Failed to delete user after profile error:', deleteError);
        }

        return {
          success: false,
          error: 'Failed to complete account setup. Please try again.'
        };
      }

    } catch (error) {
      console.error('Registration error:', error);

      // Enhanced error handling for configuration issues
      if (error.code === 'auth/configuration-not-found') {
        return {
          success: false,
          error: 'Firebase configuration error. Please contact support.'
        };
      }

      // Log failed registration attempt
      try {
        await this.logSecurityEvent(null, 'registration_failed', {
          email: email?.toLowerCase(),
          error: error.code || error.message,
          timestamp: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Failed to log registration error:', logError);
      }

      // Return user-friendly error messages
      let errorMessage = 'Registration failed. Please try again.';

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists. Please sign in or use a different email.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'auth/configuration-not-found':
            errorMessage = 'Authentication service not properly configured. Please contact support.';
            break;
          default:
            errorMessage = error.message || 'Registration failed. Please try again.';
        }
      }

      return { success: false, error: errorMessage };
    }
  },

  // Enhanced user sign-in with security tracking
  async signInUser(email, password, rememberMe = false) {
    try {
      // Validate Firebase is properly initialized
      if (!auth) {
        throw new Error('Firebase Auth not initialized. Please check your configuration.');
      }

      // Set persistence based on remember me option
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      // Attempt sign in
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      const user = userCredential.user;

      // Get current user data to check account status
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      // Check if account is locked or disabled
      if (userData?.accountStatus === 'locked') {
        await signOut(auth);
        return { success: false, error: 'Account is temporarily locked due to multiple failed login attempts.' };
      }

      if (userData?.accountStatus === 'disabled') {
        await signOut(auth);
        return { success: false, error: 'Account has been disabled. Please contact support.' };
      }

      // Update user login information
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        loginAttempts: 0, // Reset failed attempts on successful login
        lastSuccessfulLogin: serverTimestamp(),
        loginHistory: userData?.loginHistory ?
          [...(userData.loginHistory.slice(-9) || []), { // Keep last 10 logins
            timestamp: new Date().toISOString(),
            ip: 'unknown', // Could be enhanced with IP detection
            userAgent: navigator.userAgent,
            success: true
          }] : [{
            timestamp: new Date().toISOString(),
            ip: 'unknown',
            userAgent: navigator.userAgent,
            success: true
          }]
      });

      // Log successful login
      await this.logSecurityEvent(user.uid, 'login_success', {
        method: 'email_password',
        rememberMe: rememberMe,
        timestamp: new Date().toISOString()
      });

      console.log('User signed in successfully:', user.uid);
      return { success: true, user, userData };
    } catch (error) {
      console.error('Sign in error:', error);

      // Enhanced error handling for configuration issues
      if (error.code === 'auth/configuration-not-found') {
        return {
          success: false,
          error: 'Authentication service not properly configured. Please contact support.'
        };
      }

      // Handle failed login attempts
      await this.handleFailedLogin(email.toLowerCase(), error);

      return { success: false, error: error.message };
    }
  },

  // Enhanced sign out with cleanup
  async signOutUser() {
    try {
      const user = auth.currentUser;

      // Log sign out event
      if (user) {
        await this.logSecurityEvent(user.uid, 'logout', {
          timestamp: new Date().toISOString()
        });
      }

      await signOut(auth);

      // Clear any cached data
      sessionStorage.clear();

      console.log('User signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return auth?.currentUser || null;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    if (!auth) {
      console.error('Auth not initialized');
      return () => {}; // Return empty unsubscribe function
    }
    return onAuthStateChanged(auth, callback);
  },

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/auth.html?reset=true',
        handleCodeInApp: false
      });

      // Log password reset request
      await this.logSecurityEvent(null, 'password_reset_requested', {
        email: email.toLowerCase(),
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  },

  // Resend email verification
  async resendEmailVerification() {
    try {
      const user = auth?.currentUser;
      if (!user) {
        return { success: false, error: 'No user signed in' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email is already verified' };
      }

      await sendEmailVerification(user, {
        url: window.location.origin + '/confirmation.html?verified=true',
        handleCodeInApp: false
      });

      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Handle failed login attempts
  async handleFailedLogin(email, error) {
    try {
      // Try to find user by email
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const currentAttempts = (userData.loginAttempts || 0) + 1;

        const updateData = {
          loginAttempts: currentAttempts,
          lastFailedLogin: serverTimestamp(),
          loginHistory: userData?.loginHistory ?
            [...(userData.loginHistory.slice(-9) || []), {
              timestamp: new Date().toISOString(),
              ip: 'unknown',
              userAgent: navigator.userAgent,
              success: false,
              error: error.code
            }] : [{
              timestamp: new Date().toISOString(),
              ip: 'unknown',
              userAgent: navigator.userAgent,
              success: false,
              error: error.code
            }]
        };

        // Lock account after 5 failed attempts
        if (currentAttempts >= 5) {
          updateData.accountStatus = 'locked';
          updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
        }

        await updateDoc(userDoc.ref, updateData);

        // Log failed login
        await this.logSecurityEvent(userDoc.id, 'login_failed', {
          attempts: currentAttempts,
          error: error.code,
          accountLocked: currentAttempts >= 5,
          timestamp: new Date().toISOString()
        });
      }
    } catch (logError) {
      console.error('Error logging failed login:', logError);
    }
  },

  // Log security events
  async logSecurityEvent(userId, eventType, eventData) {
    try {
      if (!db) {
        console.warn('Firestore not initialized, skipping security log');
        return;
      }

      await addDoc(collection(db, 'security_logs'), {
        userId: userId,
        eventType: eventType,
        eventData: eventData,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  },

  // Check email verification status
  async checkEmailVerification(user) {
    try {
      await user.reload();

      if (user.emailVerified) {
        // Update user document
        await updateDoc(doc(db, 'users', user.uid), {
          emailVerified: true,
          emailVerifiedAt: serverTimestamp()
        });

        return { success: true, verified: true };
      }

      return { success: true, verified: false };
    } catch (error) {
      console.error('Error checking email verification:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if email is already registered
  async checkEmailExists(email) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const usersQuery = query(collection(db, 'users'), where('email', '==', normalizedEmail));
      const querySnapshot = await getDocs(usersQuery);

      return { success: true, exists: !querySnapshot.empty };
    } catch (error) {
      console.error('Error checking email existence:', error);
      return { success: false, error: error.message };
    }
  },

  // Validate registration data
  validateRegistrationData(email, password, displayName, role) {
    const errors = [];

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    const passwordRegex = {
      uppercase: /[A-Z]/,
      lowercase: /[a-z]/,
      number: /\d/,
      special: /[!@#$%^&*(),.?":{}|<>]/
    };

    if (!passwordRegex.uppercase.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!passwordRegex.lowercase.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!passwordRegex.number.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!passwordRegex.special.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Name validation
    if (!displayName || displayName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

    const nameRegex = /^[a-zA-Z\s'\-À-ÿ]{2,50}$/;
    if (displayName && !nameRegex.test(displayName.trim())) {
      errors.push('Full name contains invalid characters');
    }

    // Role validation
    const validRoles = [USER_ROLES.STUDENT, USER_ROLES.RECRUITER];
    if (!role || !validRoles.includes(role)) {
      errors.push('Please select a valid role');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
};

// Firestore functions (simplified for space)
export const dbFunctions = {
  // Get user data
  async getUserData(uid) {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user data
  async updateUserData(uid, data) {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      await updateDoc(doc(db, 'users', uid), data);
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }
};

// Utility functions
export const utils = {
  // Check if user is authenticated
  isAuthenticated() {
    return auth?.currentUser !== null;
  },

  // Get user role
  async getUserRole(uid) {
    const result = await dbFunctions.getUserData(uid);
    if (result.success) {
      return result.data.role;
    }
    return null;
  },

  // Redirect based on user role
  redirectToDashboard(role) {
    switch (role) {
      case USER_ROLES.STUDENT:
        window.location.href = '/student-dashboard.html';
        break;
      case USER_ROLES.RECRUITER:
        window.location.href = '/recruiter-dashboard.html';
        break;
      default:
        window.location.href = '/';
    }
  },

  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Show notification
  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      padding: 12px 20px; border-radius: 8px; color: white;
      font-weight: 600; max-width: 300px; word-wrap: break-word;
      transform: translateX(350px); transition: transform 0.3s ease;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    `;

    const colors = {
      info: '#4a9eff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    };

    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      notification.style.transform = 'translateX(350px)';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, duration);
  }
};

// Export constants
export { USER_ROLES, auth, db, authFunctions };

console.log('Firebase initialized successfully for GuideSignal with enhanced error handling');