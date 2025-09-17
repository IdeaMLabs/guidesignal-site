import admin from "firebase-admin";
import { readFileSync } from "fs";

// Initialize Firebase Admin SDK
let serviceAccount;

try {
  // Try to load service account key
  serviceAccount = JSON.parse(
    readFileSync("./serviceAccountKey.json", "utf8")
  );
} catch (error) {
  console.error("❌ Failed to load serviceAccountKey.json");
  console.error("Please download your Firebase service account key and save it as 'serviceAccountKey.json'");
  console.error("Get it from: Firebase Console → Project Settings → Service Accounts → Generate new private key");
  process.exit(1);
}

// Initialize admin app if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "guidesignal"
    });
    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    process.exit(1);
  }
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();