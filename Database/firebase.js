import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

async function checkUserRole(userUid) {
  try {
    const adminPCRef = doc(db, 'roles', 'adminPC');
    const adminPCSnapshot = await getDoc(adminPCRef);
    const isAdminPC = adminPCSnapshot.exists() && adminPCSnapshot.data()[userUid] === true;

    const adminISRef = doc(db, 'roles', 'adminIS');
    const adminISSnapshot = await getDoc(adminISRef);
    const isAdminIS = adminISSnapshot.exists() && adminISSnapshot.data()[userUid] === true;

    return { isAdminPC, isAdminIS };
  } catch (error) {
    console.error("Error fetching user roles:", error);
    throw error;
  }
}





async function handleAdminLoginForm() {
  const form = document.getElementById('admin-login-form');
  console.log('Admin login form:', form);
  
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('admin-email').value;
      const password = document.getElementById('admin-password').value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("Admin signed in:", user.uid);

        const { isAdminPC, isAdminIS } = await checkUserRole(user.uid);
        console.log('User roles:', { isAdminPC, isAdminIS });

        if (isAdminPC) {
          console.log("Redirecting to adminPC dashboard");
          window.location.href = "/AdminPages/PermitsAndCert/adminDashboardP&C.html";
        } else if (isAdminIS) {
          console.log("Redirecting to adminIS dashboard");
          window.location.href = "/AdminPages/InformalSettlers/adminDashboardInformalSettlers.html";
        } else {
          console.log("Redirecting to client dashboard");
          window.location.href = "/ClientPages/clientDashboard.html";
        }
      } catch (error) {
        console.error("Error signing in:", error.code, error.message);
        alert("Login failed: " + error.message);
      }
    });
  } else {
    console.error('Admin login form not found');
  }
}



function monitorAuthState() {
  onAuthStateChanged(auth, (user) => {
    const userInfo = document.getElementById('user-info');
    console.log('Auth state changed:', user);
    
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

function handleLogout() {
  const logoutButton = document.getElementById('logoutButton');
  console.log('Logout button:', logoutButton);
  
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
  } else {
    console.error('Logout button not found');
  }
}


function handleUserLoginForm() {
  const form = document.getElementById('user-login-form');
  console.log('User login form:', form);
  
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('user-email').value;
      const password = document.getElementById('user-password').value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User signed in:", user.uid);

        // Redirect to user dashboard
        window.location.href = "/ClientPages/clientDashboard.html";
      } catch (error) {
        console.error("Error signing in:", error.code, error.message);
        alert("Login failed: " + error.message);
      }
    });
  } else {
    console.error('User login form not found');
  }
}

// Initialize Firebase and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed in firebase.js');
  handleAdminLoginForm();
  handleUserLoginForm(); // Call the user login form handler
  monitorAuthState();
  handleLogout();
});
