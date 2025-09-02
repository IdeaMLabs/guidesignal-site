// Firebase Configuration and Utilities for GuideSignal
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJOVbMoHfdxHexsfqsbYsvFzFqaKBXC_s",
  authDomain: "guidesignal.firebaseapp.com",
  projectId: "guidesignal",
  storageBucket: "guidesignal.firebasestorage.app",
  messagingSenderId: "120511246886",
  appId: "1:120511246886:web:5b555a77ee25420951ece7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// User roles
const USER_ROLES = {
  STUDENT: 'student',
  RECRUITER: 'recruiter'
};

// Authentication functions
export const authFunctions = {
  // Register new user
  async registerUser(email, password, displayName, role, additionalData = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        role: role,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        ...additionalData
      });
      
      console.log('User registered successfully:', user.uid);
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in user
  async signInUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login time
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: new Date().toISOString()
      });
      
      console.log('User signed in successfully:', user.uid);
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  async signOutUser() {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

// Firestore functions
export const dbFunctions = {
  // Get user data
  async getUserData(uid) {
    try {
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
      await updateDoc(doc(db, 'users', uid), data);
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      return { success: false, error: error.message };
    }
  },

  // Job-related functions
  async createJob(jobData) {
    try {
      const docRef = await addDoc(collection(db, 'jobs'), {
        ...jobData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        featured: false,
        applications: 0
      });
      
      console.log('Job created with ID:', docRef.id);
      return { success: true, jobId: docRef.id };
    } catch (error) {
      console.error('Error creating job:', error);
      return { success: false, error: error.message };
    }
  },

  async getJobs(filters = {}) {
    try {
      let q = collection(db, 'jobs');
      
      // Apply filters
      if (filters.employerId) {
        q = query(q, where('employerId', '==', filters.employerId));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.featured !== undefined) {
        q = query(q, where('featured', '==', filters.featured));
      }
      
      // Order by creation date
      q = query(q, orderBy('createdAt', 'desc'));
      
      // Limit results if specified
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const jobs = [];
      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, jobs };
    } catch (error) {
      console.error('Error getting jobs:', error);
      return { success: false, error: error.message };
    }
  },

  async updateJob(jobId, updates) {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating job:', error);
      return { success: false, error: error.message };
    }
  },

  // Application functions
  async submitApplication(applicationData) {
    try {
      const docRef = await addDoc(collection(db, 'applications'), {
        ...applicationData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      
      // Increment application count for the job
      const jobRef = doc(db, 'jobs', applicationData.jobId);
      const jobSnap = await getDoc(jobRef);
      if (jobSnap.exists()) {
        const currentApps = jobSnap.data().applications || 0;
        await updateDoc(jobRef, { applications: currentApps + 1 });
      }
      
      console.log('Application submitted with ID:', docRef.id);
      return { success: true, applicationId: docRef.id };
    } catch (error) {
      console.error('Error submitting application:', error);
      return { success: false, error: error.message };
    }
  },

  async getApplications(filters = {}) {
    try {
      let q = collection(db, 'applications');
      
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.employerId) {
        q = query(q, where('employerId', '==', filters.employerId));
      }
      if (filters.jobId) {
        q = query(q, where('jobId', '==', filters.jobId));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const applications = [];
      querySnapshot.forEach((doc) => {
        applications.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, applications };
    } catch (error) {
      console.error('Error getting applications:', error);
      return { success: false, error: error.message };
    }
  }
};

// Utility functions
export const utils = {
  // Check if user is authenticated
  isAuthenticated() {
    return auth.currentUser !== null;
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

// Enhanced ML/AI functions for intelligent matching
export const aiMlFunctions = {
  // Get AI-powered job recommendations for a user
  async getAIRecommendations(userId, options = {}) {
    try {
      const { aiEngine } = await import('./ai-ml-engine.js');
      const userData = await dbFunctions.getUserData(userId);
      
      if (!userData.success) {
        return { success: false, error: 'User data not found' };
      }
      
      const recommendations = await aiEngine.generateRecommendations(userData.data, options);
      
      return { success: true, recommendations };
    } catch (error) {
      console.error('AI recommendations error:', error);
      return { success: false, error: error.message, recommendations: [] };
    }
  },

  // Calculate job match score with AI
  async calculateJobMatchScore(userId, jobId) {
    try {
      const { aiEngine } = await import('./ai-ml-engine.js');
      const userData = await dbFunctions.getUserData(userId);
      const jobData = await getDoc(doc(db, 'jobs', jobId));
      
      if (!userData.success || !jobData.exists()) {
        return { success: false, error: 'Data not found' };
      }
      
      const matchResult = await aiEngine.calculateJobMatch(
        userData.data, 
        { id: jobId, ...jobData.data() }
      );
      
      return { success: true, matchResult };
    } catch (error) {
      console.error('Job match calculation error:', error);
      return { success: false, error: error.message };
    }
  },

  // Rank applications intelligently for recruiters
  async rankApplicationsAI(jobId, applications) {
    try {
      const { aiEngine } = await import('./ai-ml-engine.js');
      const rankedApps = await aiEngine.rankApplications(jobId, applications);
      
      return { success: true, applications: rankedApps };
    } catch (error) {
      console.error('Application ranking error:', error);
      return { success: false, applications, error: error.message };
    }
  },

  // Get job success predictions
  async predictJobSuccess(jobId) {
    try {
      const { aiEngine } = await import('./ai-ml-engine.js');
      const jobData = await getDoc(doc(db, 'jobs', jobId));
      
      if (!jobData.exists()) {
        return { success: false, error: 'Job not found' };
      }
      
      const prediction = await aiEngine.predictJobSuccess({ id: jobId, ...jobData.data() });
      
      return { success: true, prediction };
    } catch (error) {
      console.error('Job success prediction error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update ML model with user feedback
  async updateMLModel(feedback) {
    try {
      const { aiEngine } = await import('./ai-ml-engine.js');
      const updated = await aiEngine.updateModelWeights(feedback);
      
      return { success: updated };
    } catch (error) {
      console.error('ML model update error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get ML model performance metrics
  async getMLMetrics() {
    try {
      const { aiEngine } = await import('./ai-ml-engine.js');
      
      return {
        success: true,
        metrics: {
          accuracy: aiEngine.getModelAccuracy(),
          totalPredictions: aiEngine.performanceMetrics.totalPredictions,
          lastTraining: aiEngine.performanceMetrics.lastTraining,
          modelWeights: aiEngine.modelWeights,
          isTraining: aiEngine.isTraining
        }
      };
    } catch (error) {
      console.error('ML metrics error:', error);
      return { success: false, error: error.message };
    }
  },

  // Enhanced job search with AI ranking
  async searchJobsAI(searchQuery, userId, filters = {}) {
    try {
      let q = collection(db, 'jobs');
      
      // Apply basic filters
      q = query(q, where('status', '==', 'active'));
      
      if (filters.location) {
        q = query(q, where('location', '==', filters.location));
      }
      
      if (filters.featured !== undefined) {
        q = query(q, where('featured', '==', filters.featured));
      }
      
      q = query(q, orderBy('createdAt', 'desc'), limit(50));
      
      const querySnapshot = await getDocs(q);
      const jobs = [];
      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() });
      });
      
      // If user is provided, rank jobs by AI match score
      if (userId) {
        const { aiEngine } = await import('./ai-ml-engine.js');
        const userData = await dbFunctions.getUserData(userId);
        
        if (userData.success) {
          const scoredJobs = await Promise.all(
            jobs.map(async (job) => {
              const matchResult = await aiEngine.calculateJobMatch(userData.data, job);
              return {
                ...job,
                matchScore: matchResult.matchScore,
                confidence: matchResult.confidence,
                reasoning: matchResult.reasoning,
                aiRecommended: matchResult.matchScore > 0.7
              };
            })
          );
          
          // Sort by match score
          scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
          
          return { success: true, jobs: scoredJobs };
        }
      }
      
      return { success: true, jobs };
    } catch (error) {
      console.error('AI job search error:', error);
      return { success: false, error: error.message, jobs: [] };
    }
  },

  // Smart skills extraction from job descriptions
  async extractSkillsAI(jobDescription) {
    try {
      const { aiEngine } = await import('./ai-ml-engine.js');
      const skills = aiEngine.extractSkills(jobDescription);
      
      return { success: true, skills };
    } catch (error) {
      console.error('Skills extraction error:', error);
      return { success: false, skills: [], error: error.message };
    }
  }
};

// Export constants
export { USER_ROLES, auth, db };

console.log('Firebase initialized successfully for GuideSignal with AI/ML capabilities');