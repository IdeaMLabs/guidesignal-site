import { authAdmin, dbAdmin } from "./firebase-admin-setup.js";
import { signInAndCheckRole } from "./firebase-client.js";
import crypto from "crypto";

const expectedRedirects = {
  student: "student-dashboard.html",
  jobseeker: "dashboard.html",
  recruiter: "recruiter-dashboard.html"
};

async function createTestUser(role) {
  const email = `test-${role}-${crypto.randomBytes(4).toString("hex")}@fake.local`;
  const password = "Test123!";

  const userRecord = await authAdmin.createUser({
    email,
    password,
    emailVerified: true,
    displayName: `Test ${role}`
  });

  await authAdmin.setCustomUserClaims(userRecord.uid, { role });

  await dbAdmin.collection("users").doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    role,
    createdAt: new Date().toISOString()
  });

  return { email, password, uid: userRecord.uid };
}

async function run(role) {
  console.log(`🚀 Testing ${role} flow...`);
  const { email, password, uid } = await createTestUser(role);

  const { role: fetchedRole } = await signInAndCheckRole(email, password);
  const expectedPage = expectedRedirects[role];

  if (fetchedRole === role) {
    console.log(`✅ Signed in as ${role}`);
    console.log(`➡️ Redirect should go to: ${expectedPage}`);
  } else {
    console.error(`❌ Role mismatch: expected ${role}, got ${fetchedRole}`);
  }

  await authAdmin.deleteUser(uid);
  console.log(`🧹 Deleted test user ${email}\n`);
}

const role = process.argv[2] || "student";
if (role === "all") {
  for (const r of ["student", "jobseeker", "recruiter"]) {
    await run(r);
  }
} else {
  await run(role);
}