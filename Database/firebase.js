
// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';


// Your Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyBhvoPidRWGeJmnN2E11SBS5n8oyxVLJ0M",
    authDomain: "chsd-mis.firebaseapp.com",
    projectId: "chsd-mis",
    storageBucket: "chsd-mis.appspot.com",
    messagingSenderId: "694967679357",
    appId: "1:694967679357:web:65cffd50f13739f934f414",
    measurementId: "G-XBQTQFRLJ5"
};


// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Function to check user role
async function checkUserRole(user, role) {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.roles && userData.roles[role] === true;
    }
    return false;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

//user login



  
 // In firebase.js
function handleAdminLoginForm() {
  // Ensure the function waits until the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('admin-login-form');
      if (form) {
          form.addEventListener('submit', (event) => {
              event.preventDefault();
              // Your form submission logic here
              console.log('Form submitted');
          });
      } else {
          console.error('Form not found');
      }
  });
}

// Export or execute the function if needed
export { handleAdminLoginForm };

  

// Function to monitor authentication state
function monitorAuthState() {
  onAuthStateChanged(auth, (user) => {
    const userInfo = document.getElementById('user-info');
    if (user) {
      console.log("User is logged in:", user.uid);
      if (userInfo) {
        userInfo.innerHTML = `Logged in as: ${user.email}`;
      }
    } else {
      console.log("No user is logged in.");
      if (userInfo) {
        userInfo.innerHTML = "Not logged in";
      }
    }
  });
}

// Function to handle logout
function handleLogout() {
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        await signOut(auth);
        window.location.href = '/ClientPages/clientLogin.html';
      } catch (error) {
        console.error('Error logging out:', error);
      }
    });
  }
}

// Initialize Firebase and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  handleLoginForm();
  monitorAuthState();
  handleLogout();
});

// Initialize Firebase and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
handleUserLoginForm();
});

document.addEventListener('DOMContentLoaded', () => {
  handleAdminLoginForm();
  });