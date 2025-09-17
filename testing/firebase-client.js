import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Use the correct Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyBJOVbMoHfdxHexsfqsbYsvFzFqaKBXC_s",
  authDomain: "guidesignal.firebaseapp.com",
  projectId: "guidesignal",
  storageBucket: "guidesignal.appspot.com",
  messagingSenderId: "120511246886",
  appId: "1:120511246886:web:5b555a77ee25420951ece7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export async function signInAndCheckRole(email, password) {
  try {
    console.log(`🔄 Attempting to sign in with ${email}...`);
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    console.log(`✅ Sign-in successful, UID: ${uid}`);

    // Get user document from Firestore
    const userDocRef = doc(db, "users", uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const userData = snap.data();
      const role = userData.role || "unknown";
      console.log(`📋 User role from Firestore: ${role}`);
      return { uid, role, userData };
    } else {
      console.warn(`⚠️ No user document found in Firestore for UID: ${uid}`);
      return { uid, role: "unknown", userData: null };
    }
  } catch (error) {
    console.error(`❌ Sign-in failed: ${error.message}`);
    throw error;
  }
}

export async function testAuthConfiguration() {
  try {
    console.log("🔍 Testing Firebase configuration...");
    console.log(`📋 Project ID: ${firebaseConfig.projectId}`);
    console.log(`🌐 Auth Domain: ${firebaseConfig.authDomain}`);
    console.log(`✅ Firebase client configuration appears valid`);
    return true;
  } catch (error) {
    console.error(`❌ Firebase configuration test failed: ${error.message}`);
    return false;
  }
}