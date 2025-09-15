// test-auth-functionality.js
// Comprehensive test script for auth.html functionality

console.log('🧪 Starting comprehensive auth functionality test...');

// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
} else {
    runTests();
}

function runTests() {
    console.log('📋 Running auth functionality tests...');

    // Test 1: Check external JS file loading
    setTimeout(() => {
        console.group('🔧 External JS Files Test');

        console.log('✓ updateSignupButtonState function:', typeof updateSignupButtonState);
        console.log('✓ handleSignupSubmit function:', typeof handleSignupSubmit);
        console.log('✓ handleSigninSubmit function:', typeof handleSigninSubmit);
        console.log('✓ generateRoleSpecificFields function:', typeof generateRoleSpecificFields);

        console.groupEnd();
    }, 500);

    // Test 2: Form Elements Existence
    setTimeout(() => {
        console.group('📝 Form Elements Test');

        const elements = [
            'continue-btn',
            'selected-role',
            'create-account-btn',
            'role-specific-fields',
            'signup-form',
            'signin-form'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`✓ ${id}:`, element ? '✅ Found' : '❌ Missing');
        });

        console.groupEnd();
    }, 1000);

    // Test 3: Role Selection Simulation
    setTimeout(() => {
        console.group('👤 Role Selection Test');

        const roles = ['student', 'job_seeker', 'recruiter'];

        roles.forEach((role, index) => {
            setTimeout(() => {
                console.log(`🎯 Testing role: ${role}`);

                // Find role radio button
                const roleRadio = document.querySelector(`input[name="role"][value="${role}"]`);
                if (roleRadio) {
                    roleRadio.checked = true;
                    roleRadio.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(() => {
                        const continueBtn = document.getElementById('continue-btn');
                        const selectedRole = document.getElementById('selected-role');

                        console.log(`  ✓ Continue button enabled: ${!continueBtn.disabled}`);
                        console.log(`  ✓ Hidden role field value: ${selectedRole.value}`);
                        console.log(`  ✓ Role-specific fields container populated: ${document.getElementById('role-specific-fields').innerHTML.length > 0}`);
                    }, 100);
                } else {
                    console.log(`  ❌ Role radio button not found: ${role}`);
                }
            }, index * 500);
        });

        console.groupEnd();
    }, 1500);

    // Test 4: Form Validation
    setTimeout(() => {
        console.group('✅ Form Validation Test');

        // Fill out form with test data
        const testData = {
            'signup-name': 'Test User',
            'signup-email': 'test@example.com',
            'signup-password': 'password123',
            'signup-password-confirm': 'password123'
        };

        Object.entries(testData).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Check terms checkbox
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox) {
            termsCheckbox.checked = true;
            termsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        setTimeout(() => {
            const createBtn = document.getElementById('create-account-btn');
            console.log(`✓ Create Account button enabled: ${!createBtn.disabled}`);
            console.log(`✓ Create Account button classes: ${createBtn.className}`);

            if (typeof updateSignupButtonState === 'function') {
                updateSignupButtonState(false);
                console.log(`✓ updateSignupButtonState executed successfully`);
            }
        }, 200);

        console.groupEnd();
    }, 3000);

    console.log('🎉 Auth functionality tests initiated! Check console logs above for results.');
}