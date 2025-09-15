// === Unified Auth Handler v7 ===
// Fixes: mismatched IDs in test functions, removed legacy test logic, clarified error vs demo messaging,
// improved password toggle feedback, ensured role highlight styling, mapped errors to field-level containers,
// added aria-invalid attributes for accessibility, consolidated delegated validation.

(function() {
  console.log("✅ Unified Auth Handler v7 Loaded");

  const authUtils = {};

  // === Messaging ===
  authUtils.showError = function(msg, fieldId) {
    const err = document.getElementById("error-message");
    if (err) {
      err.textContent = msg;
      err.style.display = "block";
    }
    if (fieldId) {
      const field = document.getElementById(fieldId);
      if (field) {
        field.setAttribute("aria-invalid", "true");
        const fieldError = field.closest("div")?.querySelector(".field-error");
        if (fieldError) fieldError.textContent = msg;
      }
    }
    console.error("❌ Auth Error:", msg);
  };

  authUtils.clearFieldErrors = function() {
    document.querySelectorAll(".field-error").forEach(div => div.textContent = "");
    document.querySelectorAll("input, select, textarea").forEach(el => el.setAttribute("aria-invalid", "false"));
  };

  authUtils.showSuccess = function(msg) {
    const ok = document.getElementById("success-message");
    if (ok) {
      ok.textContent = msg;
      ok.style.display = "block";
    }
    console.log("✅ Auth Success:", msg);
  };

  authUtils.setLoading = function(btn, state) {
    if (!btn) return;
    if (state) {
      btn.disabled = true;
      btn.classList.add("loading");
      btn.textContent = "Processing...";
    } else {
      btn.disabled = false;
      btn.classList.remove("loading");
      btn.textContent = btn.getAttribute("data-label") || "Submit";
    }
  };

  // === Validation ===
  authUtils.validateSignupForm = function() {
    authUtils.clearFieldErrors();
    const name = document.getElementById("signup-name");
    const email = document.getElementById("signup-email");
    const password = document.getElementById("signup-password");
    const confirm = document.getElementById("signup-password-confirm");
    const terms = document.getElementById("terms");
    const role = document.getElementById("selected-role").value;

    if (!name.value.trim()) { authUtils.showError("Name is required", "signup-name"); return false; }
    if (!email.value.includes("@")) { authUtils.showError("Invalid email", "signup-email"); return false; }
    if (password.value.length < 6) { authUtils.showError("Password must be at least 6 characters", "signup-password"); return false; }
    if (password.value !== confirm.value) { authUtils.showError("Passwords do not match", "signup-password-confirm"); return false; }
    if (!terms.checked) { authUtils.showError("You must accept the terms", "terms"); return false; }
    if (!role) { authUtils.showError("Please select a role", "selected-role"); return false; }

    if (role === "student") {
      if (!document.getElementById("university").value) { authUtils.showError("University required", "university"); return false; }
      if (!document.getElementById("major").value) { authUtils.showError("Major required", "major"); return false; }
    }
    if (role === "job_seeker") {
      if (!document.getElementById("current-title").value) { authUtils.showError("Current title required", "current-title"); return false; }
      if (!document.getElementById("industry").value) { authUtils.showError("Industry required", "industry"); return false; }
    }
    if (role === "recruiter") {
      if (!document.getElementById("company").value) { authUtils.showError("Company required", "company"); return false; }
      if (!document.getElementById("company-size").value) { authUtils.showError("Company size required", "company-size"); return false; }
    }
    return true;
  };

  // === Submission Handlers ===
  async function handleSignupSubmit(e) {
    e.preventDefault();
    const btn = e.submitter || document.querySelector("#signup-form button[type=submit]");
    if (!authUtils.validateSignupForm()) return;

    authUtils.setLoading(btn, true);
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
    } finally {
      authUtils.setLoading(btn, false);
    }
  }

  async function handleSigninSubmit(e) {
    e.preventDefault();
    const btn = e.submitter || document.querySelector("#signin-form button[type=submit]");
    authUtils.setLoading(btn, true);
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
    } finally {
      authUtils.setLoading(btn, false);
    }
  }

  // === Password Toggle ===
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

  // === Delegated Validation ===
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

  // === Role Highlighting ===
  function setupRoleHighlighting() {
    document.addEventListener("change", (e) => {
      if (e.target.name === "role") {
        document.querySelectorAll(".role-option").forEach(opt => opt.classList.remove("selected"));
        e.target.closest(".role-option").classList.add("selected");
      }
    });
  }

  // === Init ===
  window.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    if (signupForm) signupForm.addEventListener("submit", handleSignupSubmit);
    const signinForm = document.getElementById("signin-form");
    if (signinForm) signinForm.addEventListener("submit", handleSigninSubmit);

    initPasswordToggles();
    setupDelegatedValidation();
    setupRoleHighlighting();

    const err = document.getElementById("error-message");
    const ok = document.getElementById("success-message");
    if (err) err.setAttribute("aria-live", "polite");
    if (ok) ok.setAttribute("aria-live", "polite");
  });
})();
