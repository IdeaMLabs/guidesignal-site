import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;
  const snap = await getDoc(doc(db, "users", uid));
  const role = snap.exists() ? snap.data().role : "unknown";
  return { uid, role };
}