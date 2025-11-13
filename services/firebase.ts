
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVvdCDal6pttwOcZHKQan1Jp9EUvxPvjU",
  authDomain: "jual-90e15.firebaseapp.com",
  databaseURL: "https://jual-90e15-default-rtdb.firebaseio.com",
  projectId: "jual-90e15",
  storageBucket: "jual-90e15.firebasestorage.app",
  messagingSenderId: "429824607248",
  appId: "1:429824607248:web:8fd6933af8f43a4d333695"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);

// Use emulators if running in development
if (window.location.hostname === "localhost") {
  // connectAuthEmulator(auth, "http://127.0.0.1:9099");
  // connectDatabaseEmulator(db, "127.0.0.1", 9000);
}

export { auth, db };
