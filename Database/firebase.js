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

// Function to handle regular user login form submission
function handleUserLoginForm() {
    const userLoginForm = document.getElementById('user-login-form');
    if (userLoginForm) {
      userLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('user-email').value;
        const password = document.getElementById('user-password').value;
  
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
  
          console.log("User signed in:", user.uid);
          window.location.href = "/ClientPages/clientDashboard.html"; // Redirect to client dashboard
        } catch (error) {
          console.error("Error signing in:", error.code, error.message);
          alert("Login failed: " + error.message);
        }
      });
    }
  }
  
  // Function to handle admin login form submission
  function handleAdminLoginForm() {
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
  
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
  
          console.log("Admin signed in:", user.uid);
  
          if (await checkUserRole(user, 'adminPC')) {
            window.location.href = "/AdminPages/PermitsAndCert/adminDashboardP&C.html"; // Redirect adminPC to dashboard
          } else if (await checkUserRole(user, 'adminIS')) {
            window.location.href = "/AdminPages/InformalSettlers/adminDashboardInformalSettlers.html"; // Redirect adminIS to dashboard
          } else {
            alert("You do not have permission to access this admin portal.");
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