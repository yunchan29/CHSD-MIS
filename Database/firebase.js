// firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
const auth = getAuth(app); // Get the Auth service for authentication
const db = getFirestore(app); // Get the Firestore service for database operations
const functions = getFunctions(app); // Get the Functions service for callable functions

// Function to check user role
async function checkUserRole(user, role) {
    try {
        // Get the ID token result for the current user
        const idTokenResult = await user.getIdTokenResult();
        // Check if the user has the specified custom claim
        return idTokenResult.claims[role] === true;
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error; // Throw error for debugging or error handling
    }
}

// Function to handle login form submission
function handleLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User signed in:", user.uid);

        if (await checkUserRole(user, 'adminPC')) {
          window.location.href = "/AdminPages/PermitsAndCert/adminDashboardP&C.html";
        } else if (await checkUserRole(user, 'adminIS')) {
          window.location.href = "/AdminPages/InformalSettlers/adminDashboardInformalSettlers.html";
        } else {
          window.location.href = "/ClientPages/clientDashboard.html";
        }
      } catch (error) {
        console.error("Error signing in:", error.code, error.message);
        alert("Login failed: " + error.message);
      }
    });
  }
}

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