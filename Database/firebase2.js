import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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

async function addBuildingPermit(event) {
    event.preventDefault();
  
    // Fetch all necessary form data
    const buildingPermitNo = document.getElementById('buildingPermitNo').value;
    const issuedOn = document.getElementById('basic-url').value;
    const addressTelNo = document.getElementById('addressTelNo').value;
    const projectLocation = document.getElementById('projectLocation').value;
    const hsdFormNo = document.getElementById('hsdFormNo').value;
    const ownerLastName = document.getElementById('ownerLastName').value;
    const ownerFirstName = document.getElementById('ownerFirstName').value;
    const ownerMiddleName = document.getElementById('ownerMiddleName').value;
    const ownerMaidenName = document.getElementById('ownerMaidenName').value;
    const ownerEmail = document.getElementById('ownerEmail').value;
  
    // Combine owner names
    const ownerName = `${ownerLastName} ${ownerFirstName} ${ownerMiddleName} ${ownerMaidenName}`;
  
    // Fetch scope of work
    const scopeOfWork = [];
    document.querySelectorAll('input[name="scopeOfWork"]:checked').forEach(option => {
      scopeOfWork.push(option.nextElementSibling.textContent);
    });
  
    // Fetch project justification
    const projectJustification = [];
    document.querySelectorAll('input[name="projectJustification"]:checked').forEach(option => {
      projectJustification.push(option.nextElementSibling.textContent);
    });
  
    console.log("Form Data:", {
      buildingPermitNo,
      issuedOn,
      ownerName,
      addressTelNo,
      projectLocation,
      hsdFormNo,
      scopeOfWork,
      projectJustification,
      ownerEmail
    });
  
    try {
      // Determine if the user is an admin
      const user = auth.currentUser;
      if (!user) {
        console.error("No user logged in.");
        return;
      }
  
      const { isAdminPC, isAdminIS } = await checkUserRole(user.uid);
      const isAdmin = isAdminPC || isAdminIS;
  
      if (isAdmin) {
        // Admin-specific logic: Define defaultPassword
        const defaultPassword = 'sample'; // This is needed for admin user creation
  
        // Attempt to create a new user
        const userCredential = await createUserWithEmailAndPassword(auth, ownerEmail, defaultPassword);
        const newUser = userCredential.user;
  
        // If user creation is successful, proceed to add document with ownerUid
        await addDoc(collection(db, "buildingPermits"), {
          buildingPermitNo,
          issuedOn,
          ownerName,
          addressTelNo,
          projectLocation,
          hsdFormNo,
          scopeOfWork,
          projectJustification,
          ownerUid: newUser.uid // Use newUser.uid instead of user.uid for the new user
        });
  
        alert("Profile added successfully!");
        window.location.reload();
        console.log("Document successfully added to Firestore and user account created");
  
        // Optionally send SMS notification
        await sendSmsNotification(addressTelNo, 'Your building permit application has been received.');
      } else {
        // Non-admin user logic: Directly add document to Firestore without user creation
        await addDoc(collection(db, "buildingPermits"), {
          buildingPermitNo,
          issuedOn,
          ownerName,
          addressTelNo,
          projectLocation,
          hsdFormNo,
          scopeOfWork,
          projectJustification
        });
  
        alert("Profile added successfully!");
        window.location.reload();
        console.log("Document successfully added to Firestore without creating user");
      }
    } catch (error) {
      // Handle error messages appropriately
      console.error("Error adding profile or creating user:", error);
  
      // Check if the error is due to missing email (auth/missing-email)
      if (error.code === "auth/missing-email") {
        // Inform the user that user creation is not allowed
        alert("User creation is not allowed for non-admin users. Please contact an administrator.");
      } else {
        // For other errors, inform the user there was a problem adding the profile
        alert("Failed to add profile. Please try again later.");
      }
    }
  }