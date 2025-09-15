/**
 * GuideSignal Authentication Module - Optimized for Performance
 * Extracted from auth.html for better caching and performance
 */
import { authFunctions, utils, USER_ROLES } from './firebase-config-optimized.js';
import OptimizedMatchingEngine from './optimized-matching-engine.js';

// State management
let currentTab = 'signin';
let selectedRole = null;
let formData = { signin: {}, signup: {} };
let loginAttempts = 0;
let lastAttemptTime = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Enhanced validation patterns
const validationPatterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password: {
        minLength: 8,
        requireUppercase: /[A-Z]/,
        requireLowercase: /[a-z]/,
        requireNumber: /\d/,
        requireSpecial: /[!@#$%^&*(),.?":{}|<>]/
    },
    name: /^[a-zA-Z\s]{2,50}$/
};

// Enhanced tab switching with form data preservation
window.switchTab = function(tab, clickedElement) {
    saveFormData(currentTab);
    
    const previousTab = currentTab;
    currentTab = tab;
    
    // Update tab buttons with animation
    document.querySelectorAll('.auth-tab').forEach(btn => btn.classList.remove('active'));
    
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        const targetButton = document.querySelector(`[onclick="switchTab('${tab}')"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
    }
    
    // Animate form transition
    const currentForm = document.getElementById(previousTab + '-form') || document.getElementById(previousTab);
    const newForm = document.getElementById(tab + '-form') || document.getElementById(tab);
    
    if (currentForm) {
        currentForm.style.opacity = '0';
        setTimeout(() => {
            currentForm.style.display = 'none';
            if (newForm) {
                newForm.style.display = 'block';
                newForm.style.opacity = '0';
                setTimeout(() => {
                    newForm.style.opacity = '1';
                }, 50);
            }
        }, 150);
    } else {
        if (newForm) {
            document.querySelectorAll('.auth-form').forEach(form => {
                form.style.display = 'none';
            });
            newForm.style.display = 'block';
            newForm.style.opacity = '1';
        }
    }
    
    // Restore form data after animation
    setTimeout(() => {
        restoreFormData(tab);
        
        if (tab === 'signup') {
            validateSignUpButton();
            checkFormValidity();
            
            if (selectedRole) {
                const roleOption = document.querySelector(`[data-role="${selectedRole}"]`);
                if (roleOption) {
                    const radio = roleOption.querySelector('.role-radio');
                    if (radio) {
                        radio.checked = true;
                        roleOption.classList.add('selected');
                    }
                }
            }
        }
    }, 200);
    
    hideMessages();
};

// Enhanced form data management
function saveFormData(tab) {
    if (tab === 'signin') {
        const emailEl = document.getElementById('signin-email');
        const passwordEl = document.getElementById('signin-password');
        const rememberEl = document.getElementById('remember-me');
        
        formData.signin = {
            email: emailEl?.value || '',
            password: passwordEl?.value || '',
            rememberMe: rememberEl?.checked || false
        };
    } else if (tab === 'signup') {
        const nameEl = document.getElementById('signup-name');
        const emailEl = document.getElementById('signup-email');
        const passwordEl = document.getElementById('signup-password');
        const confirmEl = document.getElementById('signup-password-confirm');
        const termsEl = document.getElementById('terms');
        
        formData.signup = {
            name: nameEl?.value || '',
            email: emailEl?.value || '',
            password: passwordEl?.value || '',
            passwordConfirm: confirmEl?.value || '',
            termsAccepted: termsEl?.checked || false,
            selectedRole: selectedRole
        };
    }
}

function restoreFormData(tab) {
    if (tab === 'signin' && formData.signin) {
        const data = formData.signin;
        const emailEl = document.getElementById('signin-email');
        const passwordEl = document.getElementById('signin-password');
        const rememberEl = document.getElementById('remember-me');
        
        if (emailEl) emailEl.value = data.email || '';
        if (passwordEl) passwordEl.value = data.password || '';
        if (rememberEl) rememberEl.checked = data.rememberMe || false;
    } else if (tab === 'signup' && formData.signup) {
        const data = formData.signup;
        const nameEl = document.getElementById('signup-name');
        const emailEl = document.getElementById('signup-email');
        const passwordEl = document.getElementById('signup-password');
        const confirmEl = document.getElementById('signup-password-confirm');
        const termsEl = document.getElementById('terms');
        
        if (nameEl) nameEl.value = data.name || '';
        if (emailEl) emailEl.value = data.email || '';
        if (passwordEl) passwordEl.value = data.password || '';
        if (confirmEl) confirmEl.value = data.passwordConfirm || '';
        if (termsEl) termsEl.checked = data.termsAccepted || false;
        
        if (data.selectedRole) {
            selectedRole = data.selectedRole;
        }
    }
}

// Enhanced role selection with single checkbox rule
function setupRoleSelection() {
    const radioButtons = document.querySelectorAll('.role-radio');
    
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('selected'));
                
                const option = this.closest('.role-option');
                option.classList.add('selected');
                // Use the radio's value rather than the data-role attribute.
                // Update the selectedRole variable with the chosen radio value.
                selectedRole = this.value;
                // Also update the hidden input so the value persists when submitting the form.
                const selectedRoleInput = document.getElementById('selected-role');
                if (selectedRoleInput) selectedRoleInput.value = selectedRole;

                const roleType = selectedRole;
                let welcomeMessage = '';
                
                if (roleType === 'student') {
                    welcomeMessage = 'Welcome! We\'ll help you find internships and entry-level opportunities.';
                } else if (roleType === 'job-seeker') {
                    welcomeMessage = 'Welcome! We\'ll help you discover your next career opportunity.';
                } else if (roleType === 'recruiter') {
                    welcomeMessage = 'Welcome! Ready to post jobs and find great talent.';
                }
                
                showRoleConfirmation(welcomeMessage);
                validateSignUpButton();
                checkFormValidity();
            }
        });
    });
    
    document.querySelectorAll('.role-option').forEach(option => {
        option.addEventListener('click', function(e) {
            if (e.target.type === 'radio') return;
            
            const radio = this.querySelector('.role-radio');
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        });
    });
}

// Show role selection confirmation
function showRoleConfirmation(message) {
    const existing = document.querySelector('.role-confirmation');
    if (existing) {
        existing.remove();
    }
    
    const confirmation = document.createElement('div');
    confirmation.className = 'role-confirmation';
    confirmation.style.cssText = `
        color: #10b981;
        font-size: 14px;
        font-weight: 500;
        margin-top: 10px;
        text-align: center;
        animation: fadeInUp 0.3s ease;
    `;
    confirmation.textContent = message;
    
    const roleSelector = document.querySelector('.role-selector');
    roleSelector.parentNode.insertBefore(confirmation, roleSelector.nextSibling);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .role-option.deselecting {
        transform: scale(0.95);
        opacity: 0.7;
    }
`;
document.head.appendChild(style);

// Enhanced signup button validation
function validateSignUpButton() {
    const signupBtn = document.getElementById('create-account-btn');
    const termsCheckbox = document.getElementById('terms');
    
    if (!signupBtn) return;
    
    const hasRole = !!selectedRole;
    const hasTerms = termsCheckbox && termsCheckbox.checked;
    const isOnline = navigator.onLine;
    
    const shouldEnable = hasRole && hasTerms && isOnline;
    signupBtn.disabled = !shouldEnable;

    // Handle btn-disabled class for visual styling
    if (shouldEnable) {
        signupBtn.classList.remove('btn-disabled');
        signupBtn.title = 'Create your account';
    } else {
        signupBtn.classList.add('btn-disabled');
        let missing = [];
        if (!hasRole) missing.push('select role');
        if (!hasTerms) missing.push('agree to terms');
        if (!isOnline) missing.push('internet connection');

        signupBtn.title = `Please ${missing.join(', ')} to continue`;
    }
}

// Terms agreement handling
function setupTermsAgreement() {
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            validateSignUpButton();
            
            const termsGroup = termsCheckbox.closest('.form-group');
            if (termsCheckbox.checked) {
                termsGroup.classList.add('terms-accepted');
                termsGroup.classList.remove('terms-rejected');
            } else {
                termsGroup.classList.remove('terms-accepted');
                termsGroup.classList.add('terms-rejected');
            }
        });
    }
}

// Enhanced form submissions with validation and rate limiting
document.getElementById('signin-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (isAccountLocked()) {
        const remainingTime = Math.ceil((LOCKOUT_DURATION - (Date.now() - lastAttemptTime)) / 60000);
        showError(`Too many failed attempts. Please try again in ${remainingTime} minutes.`);
        return;
    }
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    if (!validateSignInForm(email, password)) {
        return;
    }
    
    setLoading('signin-btn', true);
    hideMessages();
    clearFieldErrors();
    
    const result = await handleNetworkError(
        () => authFunctions.signInUser(email, password, rememberMe),
        () => authFunctions.signInUser(email, password, rememberMe)
    );
    
    if (result.success) {
        loginAttempts = 0;
        
        if (rememberMe) {
            localStorage.setItem('rememberEmail', email);
        } else {
            localStorage.removeItem('rememberEmail');
        }
        
        showSuccess('Sign in successful! Redirecting...');
        
        setTimeout(async () => {
            const role = await utils.getUserRole(result.user.uid);
            utils.redirectToDashboard(role);
        }, 1500);
    } else {
        loginAttempts++;
        lastAttemptTime = Date.now();
        
        const friendlyError = getFriendlyErrorMessage(result.error);
        showError(friendlyError);
        
        if (loginAttempts >= 3 && loginAttempts < MAX_LOGIN_ATTEMPTS) {
            showError(`${friendlyError} (${MAX_LOGIN_ATTEMPTS - loginAttempts} attempts remaining)`);
        }
        
        setLoading('signin-btn', false);
    }
});

document.getElementById('signup-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const termsCheckbox = document.getElementById('terms');
    
    hideMessages();
    clearFieldErrors();
    
    let hasErrors = false;
    
    if (!selectedRole) {
        showError('Please select your role (Student or Recruiter)');
        hasErrors = true;
    }
    
    if (!termsCheckbox || !termsCheckbox.checked) {
        showError('Please agree to the Terms of Service and Privacy Policy');
        hasErrors = true;
    }
    
    if (!validateSignUpForm(name, email, password, passwordConfirm)) {
        hasErrors = true;
    }
    
    if (hasErrors) {
        return;
    }
    
    setLoading('create-account-btn', true);
    
    const additionalData = {
        profileComplete: false,
        emailVerified: false,
        accountCreatedAt: new Date().toISOString()
    };
    
    if (selectedRole === USER_ROLES.STUDENT) {
        additionalData.skills = [];
        additionalData.experience = '';
        additionalData.education = '';
        additionalData.applicationsCount = 0;
    } else if (selectedRole === USER_ROLES.JOB_SEEKER) {
        additionalData.skills = [];
        additionalData.experience = '';
        additionalData.currentRole = '';
        additionalData.applicationsCount = 0;
        additionalData.careerLevel = '';
    } else if (selectedRole === USER_ROLES.RECRUITER) {
        additionalData.company = '';
        additionalData.jobsPosted = 0;
        additionalData.verified = false;
        additionalData.subscriptionTier = 'free';
    }
    
    // Normalize role string for Firebase (convert underscores to hyphens).
    const normalizedRole = selectedRole ? selectedRole.replace('_', '-') : selectedRole;
    const result = await handleNetworkError(
        () => authFunctions.registerUser(email, password, name, normalizedRole, additionalData),
        () => authFunctions.registerUser(email, password, name, normalizedRole, additionalData)
    );
    
    if (result.success) {
        if (result.emailVerificationSent) {
            showSuccess('Account created successfully! Please check your email to verify your account before signing in.');
        } else {
            showSuccess('Account created successfully! You can now sign in.');
        }
        
        formData.signup = {};
        
        document.getElementById('signup-form').reset();
        selectedRole = null;
        document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelectorAll('.role-radio').forEach(cb => cb.checked = false);
        
        setTimeout(() => {
            switchTab('signin', null);
            document.getElementById('signin-email').value = email;
            setTimeout(() => {
                document.getElementById('signin-password').focus();
            }, 500);
            showSuccess('Registration complete! Please sign in with your credentials');
        }, 2000);
    } else {
        const friendlyError = getFriendlyErrorMessage(result.error);
        showError(friendlyError);
        setLoading('create-account-btn', false);
    }
});

// Enhanced utility functions
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    setTimeout(() => {
        if (errorDiv.style.display === 'block') {
            errorDiv.style.opacity = '0';
            setTimeout(() => {
                errorDiv.style.display = 'none';
                errorDiv.style.opacity = '1';
            }, 300);
        }
    }, 8000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMessages() {
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
    document.getElementById('error-message').style.opacity = '1';
    document.getElementById('success-message').style.opacity = '1';
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    const btnText = btn.querySelector('.btn-text');
    
    if (loading) {
        btn.disabled = true;
        btn.classList.add('loading-state');
        btnText.innerHTML = '<span class="loading"></span>Processing...';
    } else {
        btn.disabled = false;
        btn.classList.remove('loading-state');
        btnText.textContent = btnId.includes('signin') ? 'Sign In' : 'Create Account';
    }
}

// Enhanced validation functions
function validateSignInForm(email, password) {
    let isValid = true;
    
    if (!validateEmail(email)) {
        showFieldError('signin-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password || password.length < 6) {
        showFieldError('signin-password', 'Password is required');
        isValid = false;
    }
    
    return isValid;
}

function validateSignUpForm(name, email, password, passwordConfirm) {
    let isValid = true;
    
    if (!name || name.length < 2) {
        showFieldError('signup-name', 'Full name must be at least 2 characters');
        isValid = false;
    } else if (!validateName(name)) {
        showFieldError('signup-name', 'Please enter a valid full name (letters and spaces only)');
        isValid = false;
    }
    
    if (!email) {
        showFieldError('signup-email', 'Email address is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('signup-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password) {
        showFieldError('signup-password', 'Password is required');
        isValid = false;
    } else if (!validatePassword(password)) {
        showFieldError('signup-password', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');
        isValid = false;
    }
    
    if (!passwordConfirm) {
        showFieldError('signup-password-confirm', 'Please confirm your password');
        isValid = false;
    } else if (password !== passwordConfirm) {
        showFieldError('signup-password-confirm', 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

function validateEmail(email) {
    return validationPatterns.email.test(email);
}

function validateName(name) {
    const namePattern = /^[a-zA-Z\s'\-À-ÿ]{2,50}$/;
    return namePattern.test(name.trim());
}

function validatePassword(password) {
    const p = validationPatterns.password;
    return password.length >= p.minLength &&
           p.requireUppercase.test(password) &&
           p.requireLowercase.test(password) &&
           p.requireNumber.test(password) &&
           p.requireSpecial.test(password);
}

// Field-specific validation functions
function validateEmailField(inputId) {
    const input = document.getElementById(inputId);
    const email = input.value.trim();
    
    if (!email) {
        showFieldError(inputId, 'Email is required');
        return false;
    }
    
    if (!validateEmail(email)) {
        showFieldError(inputId, 'Please enter a valid email address');
        return false;
    }
    
    showFieldSuccess(inputId, 'Valid email address');
    return true;
}

function validateNameField() {
    const input = document.getElementById('signup-name');
    const name = input.value.trim();
    
    if (!name) {
        showFieldError('signup-name', 'Full name is required');
        return false;
    }
    
    if (!validateName(name)) {
        showFieldError('signup-name', 'Please enter a valid full name (2-50 characters, letters only)');
        return false;
    }
    
    showFieldSuccess('signup-name', 'Valid name');
    return true;
}

function validatePasswordStrength() {
    const input = document.getElementById('signup-password');
    const password = input.value;
    const strengthContainer = document.getElementById('password-strength');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    if (!password) {
        strengthContainer.style.display = 'none';
        return;
    }
    
    strengthContainer.style.display = 'block';
    
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score++; else feedback.push('8+ characters');
    if (validationPatterns.password.requireUppercase.test(password)) score++; else feedback.push('uppercase letter');
    if (validationPatterns.password.requireLowercase.test(password)) score++; else feedback.push('lowercase letter');
    if (validationPatterns.password.requireNumber.test(password)) score++; else feedback.push('number');
    if (validationPatterns.password.requireSpecial.test(password)) score++; else feedback.push('special character');
    
    strengthFill.className = 'strength-fill';
    
    let strengthLevel, strengthColor;
    if (score <= 2) {
        strengthLevel = 'weak';
        strengthColor = '#dc2626';
        strengthFill.classList.add('strength-weak');
    } else if (score === 3) {
        strengthLevel = 'fair';
        strengthColor = '#f59e0b';
        strengthFill.classList.add('strength-fair');
    } else if (score === 4) {
        strengthLevel = 'good';
        strengthColor = '#3b82f6';
        strengthFill.classList.add('strength-good');
    } else {
        strengthLevel = 'strong';
        strengthColor = '#10b981';
        strengthFill.classList.add('strength-strong');
    }
    
    strengthText.textContent = `Password strength: ${strengthLevel.toUpperCase()}`;
    strengthText.style.color = strengthColor;
    
    if (feedback.length > 0) {
        strengthText.textContent += ` (needs: ${feedback.join(', ')})`;
    }
}

function validatePasswordConfirm() {
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;
    
    if (!confirmPassword) {
        clearFieldError('signup-password-confirm');
        clearFieldSuccess('signup-password-confirm');
        return;
    }
    
    if (password !== confirmPassword) {
        showFieldError('signup-password-confirm', 'Passwords do not match');
        return false;
    }
    
    showFieldSuccess('signup-password-confirm', 'Passwords match');
    return true;
}

// Field error/success management
function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + '-error');
    const successElement = document.getElementById(fieldId + '-success');
    
    if (input) {
        input.classList.add('invalid');
        input.classList.remove('valid');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    if (successElement) {
        successElement.style.display = 'none';
    }
}

function showFieldSuccess(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + '-error');
    const successElement = document.getElementById(fieldId + '-success');
    
    if (input) {
        input.classList.add('valid');
        input.classList.remove('invalid');
    }
    
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    }
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + '-error');
    
    if (input) {
        input.classList.remove('invalid');
    }
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function clearFieldSuccess(fieldId) {
    const input = document.getElementById(fieldId);
    const successElement = document.getElementById(fieldId + '-success');
    
    if (input) {
        input.classList.remove('valid');
    }
    
    if (successElement) {
        successElement.style.display = 'none';
    }
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.field-success').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('invalid', 'valid');
    });
}

// Rate limiting functions
function isAccountLocked() {
    return loginAttempts >= MAX_LOGIN_ATTEMPTS && 
           (Date.now() - lastAttemptTime) < LOCKOUT_DURATION;
}

// User-friendly error messages
function getFriendlyErrorMessage(error) {
    const errorMappings = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Please choose a stronger password.',
        'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/internal-error': 'Something went wrong. Please try again.',
    };
    
    for (const [code, message] of Object.entries(errorMappings)) {
        if (error.includes(code)) {
            return message;
        }
    }
    
    return 'Something went wrong. Please try again or contact support if the problem persists.';
}

// Enhanced auth state management
authFunctions.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const role = await utils.getUserRole(user.uid);
            if (role) {
                document.body.style.opacity = '0.7';
                document.body.style.pointerEvents = 'none';
                
                showSuccess('Already signed in! Redirecting to dashboard...');
                setTimeout(() => {
                    utils.redirectToDashboard(role);
                }, 1000);
            }
        } catch (error) {
            // Don't redirect if there's an error
        }
    }
});

// Forgot password functionality
window.showForgotPassword = function() {
    const email = document.getElementById('signin-email').value;
    
    if (!email) {
        showError('Please enter your email address first');
        document.getElementById('signin-email').focus();
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        document.getElementById('signin-email').focus();
        return;
    }
    
    resetPassword(email);
};

async function resetPassword(email) {
    try {
        showPageLoader();
        const result = await authFunctions.sendPasswordReset(email);
        hidePageLoader();
        
        if (result.success) {
            showSuccess(`Password reset email sent to ${email}. Please check your inbox.`);
        } else {
            const friendlyError = getFriendlyErrorMessage(result.error);
            showError(friendlyError);
        }
    } catch (error) {
        hidePageLoader();
        const friendlyError = getFriendlyErrorMessage(error.message);
        showError(friendlyError);
    }
}

// Real-time validation setup
function setupRealTimeValidation() {
    ['signin-email', 'signup-email'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', () => validateEmailField(id));
            input.addEventListener('input', () => {
                clearFieldError(id);
                if (id === 'signup-email') {
                    checkFormValidity();
                }
            });
        }
    });
    
    const nameInput = document.getElementById('signup-name');
    if (nameInput) {
        nameInput.addEventListener('blur', () => validateNameField());
        nameInput.addEventListener('input', () => {
            clearFieldError('signup-name');
            checkFormValidity();
        });
    }
    
    const signupPassword = document.getElementById('signup-password');
    if (signupPassword) {
        signupPassword.addEventListener('input', () => {
            validatePasswordStrength();
            clearFieldError('signup-password');
            checkFormValidity();
            if (document.getElementById('signup-password-confirm').value) {
                validatePasswordConfirm();
            }
        });
    }
    
    const passwordConfirm = document.getElementById('signup-password-confirm');
    if (passwordConfirm) {
        passwordConfirm.addEventListener('input', () => {
            validatePasswordConfirm();
            checkFormValidity();
        });
        passwordConfirm.addEventListener('blur', validatePasswordConfirm);
    }
}

// Check overall form validity for visual feedback
function checkFormValidity() {
    if (currentTab !== 'signup') return;
    
    const name = document.getElementById('signup-name')?.value.trim() || '';
    const email = document.getElementById('signup-email')?.value.trim() || '';
    const password = document.getElementById('signup-password')?.value || '';
    const passwordConfirm = document.getElementById('signup-password-confirm')?.value || '';
    const termsCheckbox = document.getElementById('terms');
    
    const nameValid = name.length >= 2 && validateName(name);
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);
    const passwordMatchValid = password === passwordConfirm && passwordConfirm.length > 0;
    const roleValid = selectedRole !== null;
    const termsValid = termsCheckbox && termsCheckbox.checked;
    
    updateSignupProgress(nameValid && emailValid && passwordValid && passwordMatchValid, roleValid, termsValid);
    
    const isFormValid = nameValid && emailValid && passwordValid && passwordMatchValid && roleValid && termsValid;
    
    const form = document.getElementById('signup-form');
    if (form) {
        if (isFormValid) {
            form.classList.add('form-valid');
        } else {
            form.classList.remove('form-valid');
        }
    }
    
    return isFormValid;
}

// Update signup progress indicator
function updateSignupProgress(infoComplete, roleComplete, termsComplete) {
    const progressContainer = document.getElementById('signup-progress');
    if (!progressContainer) return;
    
    if (currentTab === 'signup') {
        progressContainer.style.display = 'flex';
    }
    
    const steps = progressContainer.querySelectorAll('.progress-step');
    
    const step1 = steps[0];
    if (step1) {
        step1.classList.toggle('completed', infoComplete);
        step1.classList.toggle('active', !infoComplete);
    }
    
    const step2 = steps[1];
    if (step2) {
        step2.classList.toggle('completed', roleComplete);
        step2.classList.toggle('active', infoComplete && !roleComplete);
    }
    
    const step3 = steps[2];
    if (step3) {
        step3.classList.toggle('completed', termsComplete);
        step3.classList.toggle('active', infoComplete && roleComplete && !termsComplete);
    }
}

// Initialize page with performance optimizations
function initializePage() {
    setupRealTimeValidation();
    setupOfflineDetection();
    setupPerformanceOptimizations();
    
    const rememberedEmail = localStorage.getItem('rememberEmail');
    const signinEmail = document.getElementById('signin-email');
    const rememberMe = document.getElementById('remember-me');
    
    if (rememberedEmail && signinEmail && rememberMe) {
        signinEmail.value = rememberedEmail;
        rememberMe.checked = true;
    }
    
    checkUrlParameters();
    
    if (currentTab === 'signup') {
        validateSignUpButton();
        checkFormValidity();
    }
    
    setTimeout(() => {
        if (currentTab === 'signin' && signinEmail) {
            signinEmail.focus();
        } else if (currentTab === 'signup') {
            const signupName = document.getElementById('signup-name');
            if (signupName) signupName.focus();
        }
    }, 100);
    
    hidePageLoader();
}

// Performance optimizations
function setupPerformanceOptimizations() {
    preloadDashboardResources();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker not available
        });
    }
    
    optimizeImages();
}

// Offline detection
function setupOfflineDetection() {
    const offlineIndicator = document.getElementById('offline-indicator');
    
    function showOffline() {
        offlineIndicator.classList.add('show');
        document.querySelectorAll('button[type="submit"]').forEach(btn => {
            btn.disabled = true;
        });
    }
    
    function showOnline() {
        offlineIndicator.classList.remove('show');
        document.querySelectorAll('button[type="submit"]').forEach(btn => {
            btn.disabled = false;
        });
        validateSignUpButton();
    }
    
    window.addEventListener('online', showOnline);
    window.addEventListener('offline', showOffline);
    
    if (!navigator.onLine) {
        showOffline();
    }
}

// Check URL parameters for special states
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('verified') === 'true') {
        showSuccess('Email verified successfully! You can now sign in.');
    }
    
    if (urlParams.get('reset') === 'true') {
        showSuccess('Password reset link sent! Please check your email.');
    }
    
    if (urlParams.get('expired') === 'true') {
        showError('Your session has expired. Please sign in again.');
    }
}

// Preload resources for better performance
function preloadDashboardResources() {
    const dashboardResources = [
        '/student-dashboard.html',
        '/recruiter-dashboard.html',
        '/firebase-config.js'
    ];
    
    dashboardResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource;
        document.head.appendChild(link);
    });
}

// Optimize images for better performance
function optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.loading = 'lazy';
        }
        
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    });
}

// Show/Hide page loader
function showPageLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.classList.add('show');
    }
}

function hidePageLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.remove('show');
        }, 300);
    }
}

// Enhanced error handling with retry mechanism
function handleNetworkError(error, retryFunction, maxRetries = 3) {
    let retryCount = 0;
    
    async function retry() {
        try {
            return await retryFunction();
        } catch (err) {
            retryCount++;
            if (retryCount < maxRetries && err.message.includes('network')) {
                showError(`Connection issue. Retrying... (${retryCount}/${maxRetries})`);
                setTimeout(retry, 2000 * retryCount);
            } else {
                throw err;
            }
        }
    }
    
    return retry();
}

// Initialize password toggles functionality
function initPasswordToggles() {
    document.querySelectorAll(".password-toggle").forEach(toggle => {
        toggle.setAttribute("aria-label", "Toggle password visibility");
        toggle.addEventListener("click", () => {
            const input = toggle.previousElementSibling;
            if (!input) return;
            if (input.type === "password") {
                input.type = "text";
                toggle.textContent = "🙈";
            } else {
                input.type = "password";
                toggle.textContent = "👁️";
            }
        });
    });
}

// Initialize when DOM is loaded
function initializeApp() {
    initializePage();
    setupTermsAgreement();
    setupRoleSelection();
    setupAdvancedValidation();
    initPasswordToggles();
}

// Advanced validation features
function setupAdvancedValidation() {
    let emailCheckTimeout;
    const signupEmail = document.getElementById('signup-email');
    
    if (signupEmail) {
        signupEmail.addEventListener('input', () => {
            clearTimeout(emailCheckTimeout);
            emailCheckTimeout = setTimeout(async () => {
                const email = signupEmail.value.trim();
                if (email && validateEmail(email)) {
                    await checkEmailAvailability(email);
                }
            }, 1000);
        });
    }
}

// Check if email is already registered
async function checkEmailAvailability(email) {
    try {
        const result = await authFunctions.checkEmailExists(email);
        
        if (result.success) {
            if (result.exists) {
                showFieldError('signup-email', 'An account with this email already exists');
                return false;
            } else {
                showFieldSuccess('signup-email', 'Email is available');
                return true;
            }
        }
    } catch (error) {
        // Don't show error to user
    }
    return true;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}