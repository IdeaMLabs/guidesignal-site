import { authAdmin, dbAdmin } from "./firebase-admin-setup.js";
import { signInAndCheckRole, testAuthConfiguration } from "./firebase-client.js";
import crypto from "crypto";

// Expected redirect mappings based on GuideSignal roles
const expectedRedirects = {
  student: "student-dashboard.html",
  job_seeker: "dashboard.html", // Generic dashboard for job seekers
  recruiter: "recruiter-dashboard.html"
};

// Role validation
const validRoles = ["student", "job_seeker", "recruiter"];

async function createTestUser(role) {
  const email = `test-${role}-${crypto.randomBytes(4).toString("hex")}@guidesignal-test.local`;
  const password = "TestPassword123!";

  try {
    console.log(`🔧 Creating test user for role: ${role}`);

    // Create user in Firebase Auth
    const userRecord = await authAdmin.createUser({
      email,
      password,
      emailVerified: true,
      displayName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`
    });

    console.log(`✅ Created Auth user with UID: ${userRecord.uid}`);

    // Set custom claims for role-based access
    await authAdmin.setCustomUserClaims(userRecord.uid, { role });

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email,
      displayName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      emailVerified: true,
      accountStatus: "active",
      profileCompleted: true,
      registrationSource: "test_agent",
      preferences: {
        notifications: true,
        marketing: false,
        theme: "light"
      }
    };

    await dbAdmin.collection("users").doc(userRecord.uid).set(userData);
    console.log(`✅ Created Firestore document for user`);

    return { email, password, uid: userRecord.uid };
  } catch (error) {
    console.error(`❌ Failed to create test user: ${error.message}`);
    throw error;
  }
}

async function testUserFlow(role) {
  console.log(`\n🚀 Testing ${role} authentication flow...`);
  console.log("=".repeat(50));

  let testUser = null;

  try {
    // Create test user
    testUser = await createTestUser(role);

    // Test sign-in and role verification
    const { role: fetchedRole, userData } = await signInAndCheckRole(testUser.email, testUser.password);

    // Verify role matches
    if (fetchedRole === role) {
      console.log(`✅ Role verification successful: ${role}`);

      const expectedPage = expectedRedirects[role];
      if (expectedPage) {
        console.log(`➡️  Expected redirect: ${expectedPage}`);
      } else {
        console.warn(`⚠️  No redirect mapping defined for role: ${role}`);
      }

      // Verify user data structure
      if (userData) {
        console.log(`📊 User data validation:`);
        console.log(`   - Display Name: ${userData.displayName || 'Not set'}`);
        console.log(`   - Email Verified: ${userData.emailVerified || false}`);
        console.log(`   - Account Status: ${userData.accountStatus || 'unknown'}`);
        console.log(`   - Profile Completed: ${userData.profileCompleted || false}`);
      }

      return true;
    } else {
      console.error(`❌ Role mismatch: expected '${role}', got '${fetchedRole}'`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Test failed for ${role}: ${error.message}`);
    return false;
  } finally {
    // Clean up test user
    if (testUser?.uid) {
      try {
        await authAdmin.deleteUser(testUser.uid);
        console.log(`🧹 Deleted test user: ${testUser.email}`);
      } catch (cleanupError) {
        console.warn(`⚠️  Failed to delete test user: ${cleanupError.message}`);
      }
    }
  }
}

async function runTests(targetRole) {
  console.log("🔥 GuideSignal Firebase Authentication Test Agent");
  console.log("================================================");

  // Test Firebase configuration first
  const configValid = await testAuthConfiguration();
  if (!configValid) {
    console.error("❌ Firebase configuration test failed. Aborting tests.");
    process.exit(1);
  }

  const results = {};

  if (targetRole === "all") {
    console.log("🧪 Running tests for all roles...\n");

    for (const role of validRoles) {
      results[role] = await testUserFlow(role);
    }

    // Summary
    console.log("\n📊 TEST SUMMARY");
    console.log("================");
    for (const [role, success] of Object.entries(results)) {
      const status = success ? "✅ PASS" : "❌ FAIL";
      console.log(`${role.padEnd(12)} ${status}`);
    }

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    console.log(`\nPassed: ${passedTests}/${totalTests} tests`);

    if (passedTests === totalTests) {
      console.log("🎉 All tests passed!");
      process.exit(0);
    } else {
      console.log("❌ Some tests failed.");
      process.exit(1);
    }

  } else if (validRoles.includes(targetRole)) {
    const success = await testUserFlow(targetRole);
    process.exit(success ? 0 : 1);
  } else {
    console.error(`❌ Invalid role: ${targetRole}`);
    console.log(`Valid roles: ${validRoles.join(", ")}, all`);
    process.exit(1);
  }
}

// Main execution
const targetRole = process.argv[2] || "student";
runTests(targetRole).catch(error => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});