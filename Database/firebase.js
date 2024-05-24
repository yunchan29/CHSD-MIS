import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
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
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

async function checkUserRole(user, role) {
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims[role] === true;
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User signed in:", user.uid); // Log user's UID for debugging

        // Redirect based on user role after successful login
        if (await checkUserRole(user, 'adminPC')) {
            window.location.href = "/AdminPages/PermitsAndCert/adminDashboardP&C.html";
        } else if (await checkUserRole(user, 'adminIS')) {
            window.location.href = "/AdminPages/OtherAdmin/adminDashboardIS.html";
        } else {
            window.location.href = "/UserPages/userDashboard.html";
        }

    } catch (error) {
        console.error("Error signing in:", error.code, error.message);
        alert("Login failed: " + error.message);
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User is logged in:", user.uid); // Log user's UID for debugging

        // You can perform additional checks or actions here based on user's state
    } else {
        console.log("No user is logged in.");
    }
});