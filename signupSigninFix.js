// signupSigninFix.js
// Full fix for Signup + Signin process

function updateSignupButtonState(showErrors = true) {
  const name = document.getElementById('signup-name')?.value.trim() || '';
  const email = document.getElementById('signup-email')?.value.trim() || '';
  const pwd = document.getElementById('signup-password')?.value || '';
  const confirmPwd = document.getElementById('signup-password-confirm')?.value || '';
  const role = document.getElementById('selected-role')?.value || '';
  const terms = document.getElementById('terms')?.checked || false;

  const createBtn = document.getElementById('create-account-btn');
  if (!createBtn) return;

  let valid = true;
  const errors = [];

  if (!name || name.length < 2) { valid = false; if (showErrors) errors.push("Name must be at least 2 characters"); }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) { valid = false; if (showErrors) errors.push("Enter a valid email"); }
  if (pwd.length < 8) { valid = false; if (showErrors) errors.push("Password must be at least 8 characters"); }
  if (pwd !== confirmPwd) { valid = false; if (showErrors) errors.push("Passwords must match"); }
  if (!role) { valid = false; if (showErrors) errors.push("Select a role"); }
  if (!terms) { valid = false; if (showErrors) errors.push("You must agree to terms"); }

  if (valid) {
    createBtn.disabled = false;
    createBtn.classList.add("active");
    createBtn.classList.remove("disabled");
  } else {
    createBtn.disabled = true;
    createBtn.classList.add("disabled");
    createBtn.classList.remove("active");
  }

  const errorDiv = document.getElementById('error-message');
  if (showErrors && errorDiv) {
    if (errors.length > 0) {
      errorDiv.innerHTML = errors.join("<br>");
      errorDiv.style.display = "block";
    } else {
      errorDiv.style.display = "none";
    }
  }
}

// Signup success handler
function handleSignupSubmit(event) {
  event.preventDefault();
  const createBtn = document.getElementById('create-account-btn');
  if (createBtn.disabled) return;

  document.getElementById('error-message').style.display = "none";

  const successDiv = document.getElementById('success-message');
  if (successDiv) {
    successDiv.innerHTML = "🎉 Account created successfully! Redirecting to sign in...";
    successDiv.style.color = "green";
    successDiv.style.display = "block";
  }

  setTimeout(() => {
    document.getElementById('signup-form').style.display = "none";
    document.getElementById('signin-form').style.display = "block";
  }, 2000);
}

// Signin validation + success
function updateSigninButton() {
  const email = document.getElementById('signin-email')?.value.trim() || '';
  const pwd = document.getElementById('signin-password')?.value || '';
  const signinBtn = document.getElementById('signin-btn');
  if (!signinBtn) return;

  signinBtn.disabled = !(email && pwd);
  signinBtn.classList.toggle("active", !!(email && pwd));
}

function handleSigninSubmit(event) {
  event.preventDefault();
  const signinBtn = document.getElementById('signin-btn');
  if (signinBtn.disabled) return;

  const email = document.getElementById('signin-email').value.trim();
  const pwd = document.getElementById('signin-password').value;

  const errorDiv = document.getElementById('signin-error');
  const successDiv = document.getElementById('signin-success');

  // Demo success (replace with real backend auth later)
  if (email === "test@example.com" && pwd === "password123") {
    errorDiv.style.display = "none";
    successDiv.innerHTML = "✅ Signed in successfully! Redirecting...";
    successDiv.style.color = "green";
    successDiv.style.display = "block";
    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 2000);
  } else {
    successDiv.style.display = "none";
    errorDiv.innerHTML = "❌ Invalid email or password";
    errorDiv.style.color = "red";
    errorDiv.style.display = "block";
  }
}

// Attach listeners
window.addEventListener("DOMContentLoaded", () => {
  ["signup-name","signup-email","signup-password","signup-password-confirm","terms"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => updateSignupButtonState(false));
        el.addEventListener("change", () => updateSignupButtonState(false));
      }
    });

  document.querySelectorAll("input[name='role']").forEach(radio => {
    radio.addEventListener("change", () => {
      document.getElementById("continue-btn").disabled = false;
      document.getElementById("selected-role").value = radio.value;
      updateSignupButtonState(false);
    });
  });

  const signupForm = document.getElementById("signup-form");
  if (signupForm) signupForm.addEventListener("submit", handleSignupSubmit);

  const signinForm = document.getElementById("signin-form");
  if (signinForm) {
    signinForm.addEventListener("input", updateSigninButton);
    signinForm.addEventListener("submit", handleSigninSubmit);
  }
});
