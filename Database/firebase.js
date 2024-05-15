import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-functions.js";

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
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

async function assignRole(email, role) {
  const assignRoleFunction = httpsCallable(functions, 'assignRole');
  try {
    const result = await assignRoleFunction({ email, role });
    console.log(result.data.message);
  } catch (error) {
    console.error("Error assigning role: ", error.message);
  }
}

async function checkUserRole(user, role) {
  const idTokenResult = await user.getIdTokenResult();
  return idTokenResult.claims[role] === true;
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (await checkUserRole(user, 'adminPC')) {
      console.log('User is adminPC');
      // Show adminPC-specific features
    }
    if (await checkUserRole(user, 'adminIS')) {
      console.log('User is adminIS');
      // Show adminIS-specific features
    }
    if (await checkUserRole(user, 'user')) {
      console.log('User is a general user');
      // Show user-specific features
    }
  } else {
    console.log('No user is signed in');
  }
});

// Example usage:
// Assign roles to users (use these functions in your admin panel or server-side logic)
assignRole('user@example.com', 'user');
assignRole('adminPC@example.com', 'adminPC');
assignRole('adminIS@example.com', 'adminIS');
