// continueButtonFix.js
// Ensures the Continue button activates correctly when a role radio is selected

(function () {
  function setBtnState(btn, enabled) {
    if (!btn) return;
    btn.disabled = !enabled;
    btn.classList.toggle('active', enabled);
    btn.classList.toggle('disabled', !enabled);
    // Also handle legacy CSS class used in your file
    btn.classList.toggle('btn-disabled', !enabled);
  }

  // Listen for role radio selection
  document.addEventListener('change', function (e) {
    if (e.target && e.target.matches('input[name="role"]')) {
      const continueBtn = document.getElementById('continue-btn');
      setBtnState(continueBtn, true);

      // Sync hidden role field
      const hiddenRole = document.getElementById('selected-role');
      if (hiddenRole) hiddenRole.value = e.target.value;
    }
  });
})();
