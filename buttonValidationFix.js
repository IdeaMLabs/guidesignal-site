// buttonValidationFix.js - Fix for Continue & Create Account Buttons

function updateButtons() {
  const roleSelected = document.querySelector('input[name="role"]:checked');
  const pwdInput = document.getElementById('signup-password');
  const confirmPwdInput = document.getElementById('signup-password-confirm');
  const termsCheckbox = document.getElementById('terms');

  const pwd = pwdInput ? pwdInput.value : "";
  const confirmPwd = confirmPwdInput ? confirmPwdInput.value : "";
  const termsChecked = termsCheckbox ? termsCheckbox.checked : false;

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

// Attach listeners after DOM loads
window.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', updateButtons);
    el.addEventListener('change', updateButtons);
  });
  updateButtons(); // initial call
});
