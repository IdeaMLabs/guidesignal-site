
// auth_fix.js - Fixed version of handleSignUp with safe reset

import { authFunctions } from './firebase-config.js';

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('loading');
    button.querySelector('.btn-text').textContent = 'Processing...';
  } else {
    button.disabled = false;
    button.classList.remove('loading');
    const isSignin = button.id === 'signin-btn';
    button.querySelector('.btn-text').textContent = isSignin ? 'Sign In' : 'Create Account';
  }
}

function showMessage(message, type) {
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  if (type === 'error') {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
  } else {
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
  }
}

async function handleSignUp(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('signup-btn');
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const role = document.querySelector('input[name="role"]:checked').value;

  setButtonLoading(submitBtn, true);

  try {
    const result = await authFunctions.registerUser(email, password, name, role, {});
    if (result.success) {
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', name);
      localStorage.setItem('userRole', role);

      showMessage('🎉 Account created successfully! Welcome to GuideSignal!', 'success');

      // Reset before redirect so button never stays frozen
      setButtonLoading(submitBtn, false);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    } else {
      const errorMsg = result.error || 'Account creation failed. Please try again.';
      showMessage(errorMsg, 'error');
      setButtonLoading(submitBtn, false);
    }
  } catch (error) {
    console.error('Sign up error:', error);
    showMessage('Network error. Please try again.', 'error');
    setButtonLoading(submitBtn, false);
  }
}

// Export so it can be wired into global scope in your HTML
export { handleSignUp };
