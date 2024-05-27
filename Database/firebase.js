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

// Initialize Firebase app with configuration
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app); // Get the Auth service for authentication
const db = getFirestore(app); // Get the Firestore service for database operations
const functions = getFunctions(app); // Get the Functions service for callable functions

// Function to check user role based on custom claims
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
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    // Get email and password from the form inputs
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Sign in the user with email and password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user; // Get the authenticated user object

        console.log("User signed in:", user.uid); // Log user's UID for debugging

        // Redirect based on user role after successful login
        if (await checkUserRole(user, 'adminPC')) {
            window.location.href = "/AdminPages/PermitsAndCert/adminDashboardP&C.html";
        } else if (await checkUserRole(user, 'adminIS')) {
            window.location.href = "/AdminPages/InformalSettlers/adminDashboardInformalSettlers.html";
        } else {
            window.location.href = "/ClientPages/clientDashboard.html";
        }

    } catch (error) {
        console.error("Error signing in:", error.code, error.message);
        alert("Login failed: " + error.message); // Alert user with login error message
    }
});

// Function to handle user authentication state change
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User is logged in:", user.uid); // Log user's UID for debugging
        // Example: Update UI based on user's authentication state
        document.getElementById('user-info').innerHTML = `Logged in as: ${user.email}`;
    } else {
        console.log("No user is logged in."); // Log when no user is logged in
        // Example: Reset UI to default state
        document.getElementById('user-info').innerHTML = "Not logged in";
    }
});

// Function to handle logout button click
document.getElementById('logoutButton').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the default click behavior
    try {
        await signOut(auth); // Sign out the current user
        window.location.href = '/ClientPages/clientLogin.html'; // Redirect to login page after logout
    } catch (error) {
        console.error('Error logging out:', error); // Log error if logout fails
    }
});

// Function to call a Firebase callable function
async function callFirebaseFunction() {
    try {
        const addMessage = httpsCallable(functions, 'addMessage');
        const result = await addMessage({ text: 'Hello, world!' });
        console.log(result.data);
    } catch (error) {
        console.error('Error calling Firebase function:', error);
    }
}

// Example: Call Firebase function on button click
document.getElementById('callFunctionButton').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the default click behavior
    await callFirebaseFunction(); // Call the Firebase callable function
});
