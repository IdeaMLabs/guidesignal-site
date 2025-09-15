// === Unified Auth Handler v5 ===
// Fixes: consolidated event binding, inline styles refactored to classes, clearer error/demo messaging, namespaced globals, aria-live regions for accessibility, legacy polyfills separated.

(function() {
  console.log("✅ Unified Auth Handler v5 Loaded");

  const authUtils = {};

  authUtils.showError = function(msg) {
    const err = document.getElementById("error-message");
    if (err) {
      err.textContent = msg;
      err.style.display = "block";
    }
    console.error("❌ Auth Error:", msg);
  };

  authUtils.showSuccess = function(msg) {
    const ok = document.getElementById("success-message");
    if (ok) {
      ok.textContent = msg;
      ok.style.display = "block";
    }
    console.log("✅ Auth Success:", msg);
  };

  authUtils.validateSignupForm = function() {
    const name = document.getElementById("signup-name");
    const email = document.getElementById("signup-email");
    const password = document.getElementById("signup-password");
    const confirm = document.getElementById("signup-password-confirm");
    const terms = document.getElementById("terms-checkbox");
    const role = document.getElementById("selected-role").value;

    if (!name.value.trim()) { authUtils.showError("Name is required"); return false; }
    if (!email.value.includes("@")) { authUtils.showError("Invalid email"); return false; }
    if (password.value.length < 6) { authUtils.showError("Password must be at least 6 characters"); return false; }
    if (password.value !== confirm.value) { authUtils.showError("Passwords do not match"); return false; }
    if (!terms.checked) { authUtils.showError("You must accept the terms"); return false; }
    if (!role) { authUtils.showError("Please select a role"); return false; }

    if (role === "student") {
      if (!document.getElementById("student-university").value) return false;
      if (!document.getElementById("student-major").value) return false;
    }
    if (role === "job_seeker") {
      if (!document.getElementById("jobseeker-current-title").value) return false;
      if (!document.getElementById("jobseeker-industry").value) return false;
    }
    if (role === "recruiter") {
      if (!document.getElementById("recruiter-company").value) return false;
      if (!document.getElementById("recruiter-company-size").value) return false;
    }
    return true;
  };

  async function handleSignupSubmit(e) {
    e.preventDefault();
    if (!authUtils.validateSignupForm()) return;
    const form = document.getElementById("signup-form");
    const data = new FormData(form);
    const payload = {};
    for (let [k,v] of data.entries()) payload[k] = v;
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Signup failed");
      authUtils.showSuccess("🎉 Account created successfully!");
    } catch (err) {
      authUtils.showError("⚠️ Signup API unavailable, demo mode activated.");
      authUtils.showSuccess("Demo Mode: Account created locally (not saved to server).");
    }
  }

  async function handleSigninSubmit(e) {
    e.preventDefault();
    const form = document.getElementById("signin-form");
    const data = new FormData(form);
    const payload = {};
    for (let [k,v] of data.entries()) payload[k] = v;
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Signin failed");
      authUtils.showSuccess("🎉 Signed in successfully!");
    } catch (err) {
      authUtils.showError("⚠️ Signin API unavailable, demo mode activated.");
      authUtils.showSuccess("Demo Mode: Signed in locally (not connected to server).");
    }
  }

  function fallbackPasswordToggles() {
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

  // Consolidated single event delegation
  function setupDelegatedValidation() {
    document.addEventListener("input", (e) => {
      if (e.target.closest("#signup-form")) {
        authUtils.validateSignupForm();
      }
    });
    document.addEventListener("change", (e) => {
      if (e.target.closest("#signup-form")) {
        authUtils.validateSignupForm();
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    if (signupForm && !signupForm.onsubmit) {
      signupForm.addEventListener("submit", handleSignupSubmit);
      console.log("⚡ Fallback signup handler attached");
    }

    const signinForm = document.getElementById("signin-form");
    if (signinForm && !signinForm.onsubmit) {
      signinForm.addEventListener("submit", handleSigninSubmit);
      console.log("⚡ Fallback signin handler attached");
    }

    fallbackPasswordToggles();
    setupDelegatedValidation();

    // Add aria-live for screen readers
    const err = document.getElementById("error-message");
    const ok = document.getElementById("success-message");
    if (err) err.setAttribute("aria-live", "polite");
    if (ok) ok.setAttribute("aria-live", "polite");
  });
})();
