
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";



const firebaseConfig = {
  apiKey: "AIzaSyBhvoPidRWGeJmnN2E11SBS5n8oyxVLJ0M",
  authDomain: "chsd-mis.firebaseapp.com",
  projectId: "chsd-mis",
  storageBucket: "chsd-mis.appspot.com",
  messagingSenderId: "694967679357",
  appId: "1:694967679357:web:65cffd50f13739f934f414",
  measurementId: "G-XBQTQFRLJ5"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);