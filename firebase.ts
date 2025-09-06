import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: แทนที่ด้วย Firebase project configuration ของคุณ
const firebaseConfig = {
  apiKey: "AIzaSyAI_6bUkqiaGR2rA7eXckHdXQB7DtPOVnk",
  authDomain: "cyberwatch-9d004.firebaseapp.com",
  projectId: "cyberwatch-9d004",
  storageBucket: "cyberwatch-9d004.appspot.com",
  messagingSenderId: "173155952387",
  appId: "1:173155952387:web:d6c1e08763fa38b2f06b36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
