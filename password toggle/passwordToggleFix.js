// passwordToggleFix.js - Fix for Password & Confirm Password Toggle

// Toggle function: works for any input ID passed in
function togglePassword(inputId) {
  var input = document.getElementById(inputId);
  var toggle = input.parentElement.querySelector('.password-toggle');

  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = '🙈';
  } else {
    input.type = 'password';
    toggle.textContent = '👁️';
  }
}

// Initialize toggles: loops through ALL password containers
function initializePasswordToggles() {
  var containers = document.querySelectorAll('.password-container');

  containers.forEach(function(container) {
    var input = container.querySelector('input');
    var toggle = container.querySelector('.password-toggle');

    if (input && toggle) {
      toggle.addEventListener('click', function() {
        if (input.type === 'password') {
          input.type = 'text';
          toggle.textContent = '🙈';
        } else {
          input.type = 'password';
          toggle.textContent = '👁️';
        }
      });
    }
  });
}

// Call this function after the signup form is displayed
// Example: inside proceedToSignup()
// proceedToSignup() {
//   document.getElementById('signup-form').style.display = 'block';
//   initializePasswordToggles();
// }
