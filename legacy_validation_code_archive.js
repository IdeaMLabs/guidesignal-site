// === LEGACY VALIDATION CODE ARCHIVE ===
// Extracted from auth.html before unified-auth-v4.js implementation
// Kept for reference purposes - DO NOT USE

/* LEGACY VALIDATION FUNCTION 1 - from fallback object */
validateSignupForm: function() {
    const name = document.getElementById('signup-name')?.value.trim() || '';
    const email = document.getElementById('signup-email')?.value.trim() || '';
    const pwd = document.getElementById('signup-password')?.value || '';
    const confirmPwd = document.getElementById('signup-password-confirm')?.value || '';
    const role = document.getElementById('selected-role')?.value || '';
    const terms = document.getElementById('terms')?.checked || false;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const errors = [];

    if (!name || name.length < 2) errors.push('Name must be at least 2 characters');
    if (!emailRegex.test(email)) errors.push('Please enter a valid email address');
    if (pwd.length < 8) errors.push('Password must be at least 8 characters');
    if (pwd !== confirmPwd) errors.push('Passwords do not match');
    if (!role) errors.push('Please select your role');
    if (!terms) errors.push('You must agree to the terms');

    return {
        valid: errors.length === 0,
        errors: errors,
        data: { name, email, password: pwd, role, terms }
    };
},

/* LEGACY VALIDATION FUNCTION 2 - standalone function with role-specific validation */
function validateSignupForm() {
    var name = document.getElementById('signup-name').value.trim();
    var email = document.getElementById('signup-email').value.trim();
    var password = document.getElementById('signup-password').value;
    var passwordConfirm = document.getElementById('signup-password-confirm').value;
    var selectedRole = document.getElementById('selected-role').value;
    var termsCheckbox = document.getElementById('terms');

    var errors = [];

    // Name validation
    if (!name || name.length < 2) {
        errors.push('Full name is required (minimum 2 characters)');
    }

    // Email validation
    var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('Please enter a valid email address');
    }

    // Password validation
    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    // Password confirmation
    if (password !== passwordConfirm) {
        errors.push('Passwords do not match');
    }

    // Role validation
    if (!selectedRole) {
        errors.push('Please select your account type');
    }

    // Terms validation
    if (!termsCheckbox || !termsCheckbox.checked) {
        errors.push('Please agree to the Terms and Privacy Policy');
    }

    // Role-specific field validation
    if (selectedRole === 'student') {
        var university = document.getElementById('university');
        var major = document.getElementById('major');
        var graduationYear = document.getElementById('graduation-year');
        var skills = document.getElementById('skills');
        var opportunityType = document.getElementById('opportunity-type');

        if (!university || !university.value.trim()) {
            errors.push('University/School is required for students');
        }
        if (!major || !major.value.trim()) {
            errors.push('Major/Field of study is required for students');
        }
        if (!graduationYear || !graduationYear.value) {
            errors.push('Graduation year is required for students');
        }
        if (!skills || !skills.value.trim()) {
            errors.push('Skills and technologies are required for students');
        }
        if (!opportunityType || !opportunityType.value) {
            errors.push('Opportunity type is required for students');
        }
    } else if (selectedRole === 'job_seeker') {
        var currentTitle = document.getElementById('current-title');
        var experienceYears = document.getElementById('experience-years');
        var industry = document.getElementById('industry');
        var skills = document.getElementById('skills');
        var workEnvironment = document.getElementById('work-environment');

        if (!currentTitle || !currentTitle.value.trim()) {
            errors.push('Current job title is required for job seekers');
        }
        if (!experienceYears || !experienceYears.value) {
            errors.push('Years of experience is required for job seekers');
        }
        if (!industry || !industry.value) {
            errors.push('Industry selection is required for job seekers');
        }
        if (!skills || !skills.value.trim()) {
            errors.push('Skills and expertise are required for job seekers');
        }
        if (!workEnvironment || !workEnvironment.value) {
            errors.push('Preferred work environment is required for job seekers');
        }
    } else if (selectedRole === 'recruiter') {
        var company = document.getElementById('company');
        var companySize = document.getElementById('company-size');
        var companyIndustry = document.getElementById('company-industry');
        var hiringRoles = document.getElementById('hiring-roles');
        var hiringVolume = document.getElementById('hiring-volume');
        var responseTime = document.getElementById('response-time');
        var companyLocation = document.getElementById('company-location');

        if (!company || !company.value.trim()) {
            errors.push('Company name is required for recruiters');
        }
        if (!companySize || !companySize.value) {
            errors.push('Company size selection is required for recruiters');
        }
        if (!companyIndustry || !companyIndustry.value) {
            errors.push('Company industry is required for recruiters');
        }
        if (!hiringRoles || !hiringRoles.value.trim()) {
            errors.push('Hiring roles information is required for recruiters');
        }
        if (!hiringVolume || !hiringVolume.value) {
            errors.push('Hiring volume is required for recruiters');
        }
        if (!responseTime || !responseTime.value) {
            errors.push('Response time is required for recruiters');
        }
        if (!companyLocation || !companyLocation.value.trim()) {
            errors.push('Company location is required for recruiters');
        }
    }

    return errors;
}

/* LEGACY ENABLE SIGNUP BUTTON FUNCTION */
function enableSignupButton() {
    var signupBtn = document.getElementById('create-account-btn');
    var selectedRole = document.getElementById('selected-role').value;
    var termsCheckbox = document.getElementById('terms');

    if (selectedRole && termsCheckbox && termsCheckbox.checked) {
        signupBtn.disabled = false;
    } else {
        signupBtn.disabled = true;
    }
}

// === END OF LEGACY CODE ARCHIVE ===