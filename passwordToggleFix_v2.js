// passwordToggleFix_v2.js - Unified Fix for Password & Confirm Password Toggle

// Initialize password toggle buttons for all .password-container elements
function initializePasswordToggles() {
  var containers = document.querySelectorAll('.password-container');

  containers.forEach(function(container) {
    var input = container.querySelector('input');
    var toggle = container.querySelector('.password-toggle');

    if (input && toggle) {
      // Remove any old listeners to avoid duplication
      toggle.replaceWith(toggle.cloneNode(true));
      toggle = container.querySelector('.password-toggle');

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

// Run once DOM is ready
window.addEventListener('DOMContentLoaded', function() {
  initializePasswordToggles();
});
