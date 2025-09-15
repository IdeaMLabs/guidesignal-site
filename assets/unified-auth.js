// === Unified Signup + Signin Handler with Fallbacks ===

(function() {
  console.log("✅ Unified Auth Handler Loaded");

  // Utility: show toast or field-level error
  function showError(msg) {
    const err = document.getElementById("error-message");
    if (err) {
      err.textContent = msg;
      err.style.display = "block";
    }
    console.error("❌ Auth Error:", msg);
  }

  function showSuccess(msg) {
    const ok = document.getElementById("success-message");
    if (ok) {
      ok.textContent = msg;
      ok.style.display = "block";
    }
    console.log("✅ Auth Success:", msg);
  }

  // Unified validation for signup form
  function validateSignupForm() {
    const name = document.getElementById("signup-name");
    const email = document.getElementById("signup-email");
    const password = document.getElementById("signup-password");
    const confirm = document.getElementById("signup-password-confirm"); // FIXED: correct ID
    const role = document.getElementById("selected-role").value;
    const terms = document.getElementById("terms");

    if (!name || !email || !password || !confirm) return false;
    if (!name.value.trim() || name.value.trim().length < 2) { showError("Name must be at least 2 characters"); return false; }
    if (!email.value.includes("@")) { showError("Invalid email address"); return false; }
    if (password.value.length < 8) { showError("Password must be at least 8 characters"); return false; }
    if (password.value !== confirm.value) { showError("Passwords do not match"); return false; }
    if (!role) { showError("Please select your role"); return false; }
    if (!terms || !terms.checked) { showError("You must agree to the terms and conditions"); return false; }

    // Role-specific validation using prefixed IDs
    if (role === "student") {
      const university = document.getElementById("student-university");
      const major = document.getElementById("student-major");
      if (!university || !university.value.trim()) { showError("University is required for students"); return false; }
      if (!major || !major.value.trim()) { showError("Major is required for students"); return false; }
    }
    if (role === "job_seeker") {
      const title = document.getElementById("jobseeker-current-title");
      const industry = document.getElementById("jobseeker-industry");
      if (!title || !title.value.trim()) { showError("Current job title is required"); return false; }
      if (!industry || !industry.value.trim()) { showError("Industry is required"); return false; }
    }
    if (role === "recruiter") {
      const company = document.getElementById("recruiter-company");
      const size = document.getElementById("recruiter-company-size");
      if (!company || !company.value.trim()) { showError("Company name is required"); return false; }
      if (!size || !size.value.trim()) { showError("Company size is required"); return false; }
    }
    return true;
  }

  // Fallback submission handler for signup
  async function handleSignupSubmit(e) {
    e.preventDefault();
    if (!validateSignupForm()) return;

    const form = document.getElementById("signup-form");
    const data = new FormData(form);
    const payload = {};
    for (let [k,v] of data.entries()) payload[k] = v;

    // Add role-specific data with correct IDs
    const role = document.getElementById("selected-role").value;
    payload.roleSpecificData = {};

    if (role === "student") {
      payload.roleSpecificData.university = document.getElementById("student-university")?.value || '';
      payload.roleSpecificData.major = document.getElementById("student-major")?.value || '';
      payload.roleSpecificData.graduationYear = document.getElementById("student-graduation-year")?.value || '';
      payload.roleSpecificData.gpa = document.getElementById("student-gpa")?.value || '';
      payload.roleSpecificData.skills = document.getElementById("student-skills")?.value || '';
      payload.roleSpecificData.opportunityType = document.getElementById("student-opportunity-type")?.value || '';
    } else if (role === "job_seeker") {
      payload.roleSpecificData.currentTitle = document.getElementById("jobseeker-current-title")?.value || '';
      payload.roleSpecificData.experienceYears = document.getElementById("jobseeker-experience-years")?.value || '';
      payload.roleSpecificData.industry = document.getElementById("jobseeker-industry")?.value || '';
      payload.roleSpecificData.skills = document.getElementById("jobseeker-skills")?.value || '';
      payload.roleSpecificData.salaryRange = document.getElementById("jobseeker-salary-range")?.value || '';
      payload.roleSpecificData.workEnvironment = document.getElementById("jobseeker-work-environment")?.value || '';
      payload.roleSpecificData.location = document.getElementById("jobseeker-location")?.value || '';
    } else if (role === "recruiter") {
      payload.roleSpecificData.company = document.getElementById("recruiter-company")?.value || '';
      payload.roleSpecificData.companySize = document.getElementById("recruiter-company-size")?.value || '';
      payload.roleSpecificData.companyIndustry = document.getElementById("recruiter-company-industry")?.value || '';
      payload.roleSpecificData.hiringRoles = document.getElementById("recruiter-hiring-roles")?.value || '';
      payload.roleSpecificData.hiringVolume = document.getElementById("recruiter-hiring-volume")?.value || '';
      payload.roleSpecificData.responseTime = document.getElementById("recruiter-response-time")?.value || '';
      payload.roleSpecificData.companyLocation = document.getElementById("recruiter-company-location")?.value || '';
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Signup failed");
      showSuccess("Account created successfully!");
    } catch (err) {
      showError("Signup API unavailable, running in demo mode.");
      showSuccess("Demo: Account created locally!");
    }
  }

  // Fallback signin handler
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
      showSuccess("Signed in successfully!");
    } catch (err) {
      showError("Signin API unavailable, running in demo mode.");
      showSuccess("Demo: Signed in locally!");
    }
  }

  // Attach fallbacks if external handlers are missing
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
  });
})();