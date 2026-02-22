
import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgsi7kzYwyhHxKkYMVViaDxwETae27kYk",
  authDomain: "flareguard-97905.firebaseapp.com",
  projectId: "flareguard-97905",
  storageBucket: "flareguard-97905.firebasestorage.app",
  messagingSenderId: "806631192112",
  appId: "1:806631192112:web:0a2ff5f5bc774675cf5ff5",
  measurementId: "G-FMMFDMX78F",
};


const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];


export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);
export const db = getFirestore(app);
