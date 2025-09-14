// Comprehensive Signup Testing Suite
// Tests all three user roles and validates complete signup flows

console.log('🚀 Starting Comprehensive Signup Testing Suite');

class SignupTester {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const result = { timestamp, message, type };
        this.testResults.push(result);

        const color = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔍';
        console.log(`${color} [${timestamp}] ${message}`);

        if (type === 'success') this.passedTests++;
        if (type === 'error') this.failedTests++;
        this.totalTests++;
    }

    async waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const check = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                } else {
                    setTimeout(check, 100);
                }
            };

            check();
        });
    }

    async testStudentSignup() {
        this.log('=== TESTING STUDENT SIGNUP FLOW ===', 'info');

        try {
            // Navigate to signup
            this.log('Navigating to signup page...', 'info');

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Select Student role
            this.log('Selecting Student role...', 'info');
            const studentRadio = document.querySelector('input[name="signup-role"][value="student"]');

            if (!studentRadio) {
                throw new Error('Student radio button not found');
            }

            studentRadio.checked = true;
            studentRadio.dispatchEvent(new Event('change'));

            // Check if continue button enables
            await new Promise(resolve => setTimeout(resolve, 500));

            const continueBtn = document.getElementById('continue-btn');
            if (continueBtn && !continueBtn.disabled) {
                this.log('Continue button enabled successfully', 'success');
            } else {
                throw new Error('Continue button not enabled after role selection');
            }

            // Click continue to proceed to signup form
            continueBtn.click();
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Fill student form
            this.log('Filling student signup form...', 'info');

            const fields = {
                'signup-name': 'Alex Chen',
                'signup-email': 'alex.chen@stanford.edu',
                'signup-password': 'StudentPass123!',
                'signup-password-confirm': 'StudentPass123!',
                'university': 'Stanford University',
                'major': 'Computer Science',
                'graduation-year': '2025',
                'skills': 'Python, JavaScript, React, Data Analysis, Machine Learning',
                'opportunity-type': 'internship'
            };

            let filledFields = 0;
            for (const [fieldId, value] of Object.entries(fields)) {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                    field.dispatchEvent(new Event('input'));
                    filledFields++;
                    this.log(`Filled field '${fieldId}': ${value}`, 'success');
                } else {
                    this.log(`Field '${fieldId}' not found`, 'error');
                }
            }

            // Check terms agreement
            const termsCheckbox = document.getElementById('terms-agreement');
            if (termsCheckbox) {
                termsCheckbox.checked = true;
                termsCheckbox.dispatchEvent(new Event('change'));
                this.log('Terms agreement checked', 'success');
            } else {
                throw new Error('Terms agreement checkbox not found');
            }

            // Validate signup button state
            await new Promise(resolve => setTimeout(resolve, 500));

            const signupBtn = document.getElementById('signup-btn');
            if (signupBtn) {
                const isEnabled = !signupBtn.disabled;
                if (isEnabled) {
                    this.log('Student signup form completed successfully - Button enabled', 'success');
                    return true;
                } else {
                    throw new Error('Signup button still disabled after filling all fields');
                }
            } else {
                throw new Error('Signup button not found');
            }

        } catch (error) {
            this.log(`Student signup test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testJobSeekerSignup() {
        this.log('=== TESTING JOB SEEKER SIGNUP FLOW ===', 'info');

        try {
            // Reset form by reloading
            location.reload();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Select Job Seeker role
            this.log('Selecting Job Seeker role...', 'info');
            const jobSeekerRadio = document.querySelector('input[name="signup-role"][value="job_seeker"]');

            if (!jobSeekerRadio) {
                throw new Error('Job Seeker radio button not found');
            }

            jobSeekerRadio.checked = true;
            jobSeekerRadio.dispatchEvent(new Event('change'));

            // Continue to form
            await new Promise(resolve => setTimeout(resolve, 500));
            const continueBtn = document.getElementById('continue-btn');
            if (continueBtn && !continueBtn.disabled) {
                continueBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Fill job seeker form
            this.log('Filling job seeker signup form...', 'info');

            const fields = {
                'signup-name': 'Sarah Johnson',
                'signup-email': 'sarah.johnson@email.com',
                'signup-password': 'SecurePass123!',
                'signup-password-confirm': 'SecurePass123!',
                'current-title': 'Senior Marketing Manager',
                'experience-years': '5-10',
                'industry': 'marketing',
                'skills': 'Digital Marketing, SEO, Content Strategy, Team Leadership, Analytics',
                'work-environment': 'hybrid'
            };

            for (const [fieldId, value] of Object.entries(fields)) {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                    field.dispatchEvent(new Event('input'));
                    this.log(`Filled field '${fieldId}': ${value}`, 'success');
                }
            }

            // Check terms and validate
            const termsCheckbox = document.getElementById('terms-agreement');
            if (termsCheckbox) {
                termsCheckbox.checked = true;
                termsCheckbox.dispatchEvent(new Event('change'));
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            const signupBtn = document.getElementById('signup-btn');
            if (signupBtn && !signupBtn.disabled) {
                this.log('Job Seeker signup form completed successfully', 'success');
                return true;
            } else {
                throw new Error('Job Seeker signup button not enabled');
            }

        } catch (error) {
            this.log(`Job Seeker signup test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async testRecruiterSignup() {
        this.log('=== TESTING RECRUITER SIGNUP FLOW ===', 'info');

        try {
            // Reset form
            location.reload();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Select Recruiter role
            const recruiterRadio = document.querySelector('input[name="signup-role"][value="recruiter"]');

            if (!recruiterRadio) {
                throw new Error('Recruiter radio button not found');
            }

            recruiterRadio.checked = true;
            recruiterRadio.dispatchEvent(new Event('change'));

            // Continue to form
            await new Promise(resolve => setTimeout(resolve, 500));
            const continueBtn = document.getElementById('continue-btn');
            if (continueBtn && !continueBtn.disabled) {
                continueBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Fill recruiter form
            this.log('Filling recruiter signup form...', 'info');

            const fields = {
                'signup-name': 'Jessica Martinez',
                'signup-email': 'jessica.martinez@techcorp.com',
                'signup-password': 'RecruiterPass123!',
                'signup-password-confirm': 'RecruiterPass123!',
                'company': 'TechCorp Inc.',
                'company-size': '201-500',
                'company-industry': 'technology',
                'hiring-roles': 'Software Engineers, Data Scientists, Product Managers, UX Designers'
            };

            for (const [fieldId, value] of Object.entries(fields)) {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                    field.dispatchEvent(new Event('input'));
                    this.log(`Filled field '${fieldId}': ${value}`, 'success');
                }
            }

            // Check terms and validate
            const termsCheckbox = document.getElementById('terms-agreement');
            if (termsCheckbox) {
                termsCheckbox.checked = true;
                termsCheckbox.dispatchEvent(new Event('change'));
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            const signupBtn = document.getElementById('signup-btn');
            if (signupBtn && !signupBtn.disabled) {
                this.log('Recruiter signup form completed successfully', 'success');
                return true;
            } else {
                throw new Error('Recruiter signup button not enabled');
            }

        } catch (error) {
            this.log(`Recruiter signup test failed: ${error.message}`, 'error');
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting comprehensive signup testing...', 'info');

        const results = {
            student: await this.testStudentSignup(),
            jobSeeker: await this.testJobSeekerSignup(),
            recruiter: await this.testRecruiterSignup()
        };

        // Generate summary report
        this.log('\n📊 TEST SUMMARY REPORT', 'info');
        this.log(`Total Tests: ${this.totalTests}`, 'info');
        this.log(`Passed: ${this.passedTests}`, 'success');
        this.log(`Failed: ${this.failedTests}`, 'error');
        this.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`, 'info');

        this.log('\n🎯 SIGNUP FLOW RESULTS:', 'info');
        this.log(`Student Signup: ${results.student ? '✅ PASS' : '❌ FAIL'}`, results.student ? 'success' : 'error');
        this.log(`Job Seeker Signup: ${results.jobSeeker ? '✅ PASS' : '❌ FAIL'}`, results.jobSeeker ? 'success' : 'error');
        this.log(`Recruiter Signup: ${results.recruiter ? '✅ PASS' : '❌ FAIL'}`, results.recruiter ? 'success' : 'error');

        const allPassed = results.student && results.jobSeeker && results.recruiter;

        if (allPassed) {
            this.log('🎉 ALL SIGNUP FLOWS WORKING PERFECTLY!', 'success');
            this.log('✅ No obstacles preventing user signups', 'success');
        } else {
            this.log('⚠️  Some signup flows have issues that need attention', 'error');
        }

        return results;
    }
}

// Auto-execute if loaded in browser
if (typeof window !== 'undefined') {
    window.SignupTester = SignupTester;

    // Add global test function
    window.runComprehensiveSignupTests = async function() {
        const tester = new SignupTester();
        return await tester.runAllTests();
    };

    console.log('🔧 Comprehensive signup testing suite loaded');
    console.log('Run: runComprehensiveSignupTests() to start testing');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignupTester;
}