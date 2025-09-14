// roleButtonFix.js - Fix for Continue & Create Account Button Activation

function updateButtons() {
  const roleSelected = document.querySelector('input[name="role"]:checked');
  const pwdInput = document.getElementById('signup-password');
  const confirmPwdInput = document.getElementById('signup-password-confirm');
  const termsCheckbox = document.getElementById('terms');
  const roleHidden = document.getElementById('selected-role');

  const pwd = pwdInput ? pwdInput.value : "";
  const confirmPwd = confirmPwdInput ? confirmPwdInput.value : "";
  const termsChecked = termsCheckbox ? termsCheckbox.checked : false;

  // Sync role to hidden input
  if (roleSelected && roleHidden) {
    roleHidden.value = roleSelected.value;
  }

  // Continue Button
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    if (roleSelected) {
      continueBtn.disabled = false;
      continueBtn.classList.add('active');
      continueBtn.classList.remove('disabled');
    } else {
      continueBtn.disabled = true;
      continueBtn.classList.add('disabled');
      continueBtn.classList.remove('active');
    }
  }

  // Create Account Button
  const createBtn = document.getElementById('create-account-btn');
  if (createBtn) {
    if (roleSelected && pwd && confirmPwd && pwd === confirmPwd && termsChecked) {
      createBtn.disabled = false;
      createBtn.classList.add('active');
      createBtn.classList.remove('disabled');
    } else {
      createBtn.disabled = true;
      createBtn.classList.add('disabled');
      createBtn.classList.remove('active');
    }
  }
}

// Ensure role radios update hidden field + buttons
window.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('input[name="role"]').forEach(radio => {
    radio.addEventListener('change', function() {
      document.getElementById('selected-role').value = this.value;
      updateButtons();
    });
  });

  document.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', updateButtons);
    el.addEventListener('change', updateButtons);
  });

  updateButtons();
});

// Call after showing signup form to refresh button states
function proceedToSignup() {
  document.getElementById('signup-choice').style.display = 'none';
  document.getElementById('signup-form').style.display = 'block';
  setTimeout(updateButtons, 200);
}
