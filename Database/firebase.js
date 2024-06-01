import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Check user roles in Firestore
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

// Handle admin login form submission
async function handleAdminLogin(event) {
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
}

// Handle user login form submission
async function handleUserLogin(event) {
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
}

// Monitor authentication state changes
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

// Handle user logout
async function handleLogout(event) {
  event.preventDefault();

  try {
    await signOut(auth);
    window.location.href = '/ClientPages/clientLogin.html';
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// Add new building permit
async function addBuildingPermit(event) {
  event.preventDefault();

  // Retrieve form values
  const buildingPermitNo = document.getElementById('buildingPermitNo').value;
  const issuedOn = document.getElementById('basic-url').value;
  const addressTelNo = document.getElementById('addressTelNo').value;
  const projectLocation = document.getElementById('projectLocation').value;
  const hsdFormNo = document.getElementById('hsdFormNo').value;
  const ownerLastName = document.getElementById('ownerLastName').value;
  const ownerFirstName = document.getElementById('ownerFirstName').value;
  const ownerMiddleName = document.getElementById('ownerMiddleName').value;
  const ownerMaidenName = document.getElementById('ownerMaidenName').value;
  const ownerName = `${ownerLastName} ${ownerFirstName} ${ownerMiddleName} ${ownerMaidenName}`;
  const ownerEmail = document.getElementById('ownerEmail').value; // Add email field to your form
  const defaultPassword = 'sample'; // Set a default password or generate one dynamically

  // Retrieve selected checkboxes for scope of work and project justification
  const scopeOfWork = [];
  if (document.getElementById('option1').checked) {
    scopeOfWork.push(document.getElementById('option1').nextElementSibling.textContent);
  }
  if (document.getElementById('option2').checked) {
    scopeOfWork.push(document.getElementById('option2').nextElementSibling.textContent);
  }
  if (document.getElementById('option3').checked) {
    scopeOfWork.push(document.getElementById('option3').nextElementSibling.textContent);
  }
  if (document.getElementById('option4').checked) {
    scopeOfWork.push(document.getElementById('option4').nextElementSibling.textContent);
  }

  const projectJustification = [];
  if (document.getElementById('justification1').checked) {
    projectJustification.push(document.getElementById('justification1').nextElementSibling.textContent);
  }
  if (document.getElementById('justification2').checked) {
    projectJustification.push(document.getElementById('justification2').nextElementSibling.textContent);
  }
  if (document.getElementById('justification3').checked) {
    projectJustification.push(document.getElementById('justification3').nextElementSibling.textContent);
  }

  // Log the retrieved data for debugging
  console.log("Form Data:", {
    buildingPermitNo,
    issuedOn,
    ownerName,
    addressTelNo,
    projectLocation,
    hsdFormNo,
    scopeOfWork,
    projectJustification,
    ownerEmail // Log the owner's email for debugging
  });

  try {
    // Create a new user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, ownerEmail, defaultPassword);
    const user = userCredential.user;

    // Add the building permit document to Firestore and link the user ID
    await addDoc(collection(db, "buildingPermits"), {
      buildingPermitNo,
      issuedOn,
      ownerName,
      addressTelNo,
      projectLocation,
      hsdFormNo,
      scopeOfWork,
      projectJustification,
      ownerUid: user.uid // Link the user ID to the building permit
    });

    alert("Profile added successfully!");
    window.location.reload();
    console.log("Document successfully added to Firestore and user account created");

    // Send SMS notification
    await sendSmsNotification(addressTelNo, 'Your building permit application has been received.');
  } catch (error) {
    console.error("Error adding document or creating user: ", error);
    alert("Failed to add profile or create user: " + error.message);
  }
}

// Load profiles from Firestore
async function loadProfiles() {
  const querySnapshot = await getDocs(collection(db, "buildingPermits"));
  const buildingPermitDiv = document.getElementById("buildingPermitDiv");
  if (!buildingPermitDiv) {
    console.error("buildingPermitDiv not found in the DOM.");
    return;
  }
  const tableBody = buildingPermitDiv.querySelector("tbody");
  if (!tableBody) {
    console.error("Table body not found in buildingPermitDiv.");
    return;
  }
  tableBody.innerHTML = ""; // Clear existing rows

  querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = document.createElement("tr");

      row.innerHTML = `
          <td>${data.ownerName}</td>
          <td>${data.issuedOn}</td>
          <td>
              <select class="form-select form-select-sm status-select" aria-label=".form-select-sm example" data-id="${doc.id}">
                  <option value="Pending" ${data.status === "Pending" ? 'selected' : ''}>Pending</option>
                  <option value="Processing" ${data.status === "Processing" ? 'selected' : ''}>Processing</option>
                  <option value="To Pay" ${data.status === "To Pay" ? 'selected' : ''}>To Pay</option>
                  <option value="For Approval" ${data.status === "For Approval" ? 'selected' : ''}>For Approval</option>
                  <option value="For Release" ${data.status === "Release" ? 'selected' : ''}>For Release</option>
                  <option value="Claimed" ${data.status === "Claimed" ? 'selected' : ''}>Claimed</option>
              </select>
          </td>
          <td>
              <a class="btn btn-success text-white save-btn" data-id="${doc.id}">Save</a>
              <a class="btn btn-secondary text-white" data-bs-toggle="modal" data-bs-target="#remarksModal1">Remarks</a>
              <a class="btn btn-primary text-white" data-bs-toggle="modal" data-bs-target="#buildingPermitModal">Edit</a>
              <button class="btn btn-danger text-white archive-btn" data-id="${doc.id}">Archive</button>
          </td>
      `;
      tableBody.appendChild(row);
  });

  // Attach event listeners to save and archive buttons after profiles are loaded
  attachSaveButtonListeners();
  attachArchiveButtonListeners();
}

// Example usage: call loadProfiles when the page is ready or when needed
document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM fully loaded and parsed in firebase.js');
  attachEventListeners(); // Attach event listeners to forms and buttons
  monitorAuthState(); // Monitor authentication state changes
  loadProfiles(); // Load profiles from Firestore
});

// Function to attach event listeners to forms and buttons
function attachEventListeners() {
  const adminLoginForm = document.getElementById('admin-login-form');
  const userLoginForm = document.getElementById('user-login-form');
  const adminLogoutButton = document.getElementById('admin-logout-btn');
  const userLogoutButton = document.getElementById('user-logout-btn');
  const addBuildingPermitButton = document.getElementById('submitProfile');
  const sendMessageForm = document.getElementById('send-message-form');
  
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', handleAdminLogin);
  }

  if (userLoginForm) {
    userLoginForm.addEventListener('submit', handleUserLogin);
  }

  if (adminLogoutButton) {
    adminLogoutButton.addEventListener('click', handleLogout);
  }

  if (userLogoutButton) {
    userLogoutButton.addEventListener('click', handleLogout);
  }

  if (addBuildingPermitButton) {
    addBuildingPermitButton.addEventListener('click', addBuildingPermit);
  }

  if (sendMessageForm) {
    sendMessageForm.addEventListener('submit', sendMessage);
  }
}

// Attach event listeners to Save buttons
function attachSaveButtonListeners() {
  const saveButtons = document.querySelectorAll('.save-btn');
  saveButtons.forEach(button => {
    button.addEventListener('click', handleSaveBuildingPermit);
  });
}

// Attach event listeners to Archive buttons
function attachArchiveButtonListeners() {
  const archiveButtons = document.querySelectorAll('.archive-btn');
  archiveButtons.forEach(button => {
    button.addEventListener('click', handleArchiveBuildingPermit);
  });
}

// Handle archive building permit button click
async function handleArchiveBuildingPermit(event) {
  event.preventDefault();

  const buildingPermitId = event.target.getAttribute('data-id');

  // Display confirmation dialog
  const confirmed = confirm("Are you sure you want to archive this document?");
  
  if (!confirmed) {
    return; // Exit if user cancels
  }

  try {
    const buildingPermitRef = doc(db, "buildingPermits", buildingPermitId);
    const buildingPermitSnapshot = await getDoc(buildingPermitRef);

    if (buildingPermitSnapshot.exists()) {
      const buildingPermitData = buildingPermitSnapshot.data();
      
      // Add the document to the archived collection
      await setDoc(doc(db, "archivedBuildingPermits", buildingPermitId), buildingPermitData);
      
      // Delete the document from the current collection
      await deleteDoc(buildingPermitRef);

      // Remove the row from the UI after archiving
      event.target.closest('tr').remove();

      console.log("Document archived successfully!");
      alert("Document archived successfully!");
    } else {
      alert("Document not found!");
    }
  } catch (error) {
    console.error("Error archiving document: ", error);
    alert("Failed to archive document: " + error.message);
  }
}

// Handle save building permit button click
async function handleSaveBuildingPermit(event) {
  event.preventDefault();

  const buildingPermitId = event.target.getAttribute('data-id');
  const row = event.target.closest('tr');
  const statusSelect = row.querySelector('.status-select'); // Select within the same row

  const status = statusSelect.value;

  try {
    await updateDoc(doc(db, "buildingPermits", buildingPermitId), {
      status: status
    });
    console.log("Document successfully updated!");
    alert("Status updated successfully!");
  } catch (error) {
    console.error("Error updating document: ", error);
    alert("Failed to update status: " + error.message);
  }
  // Optional: Reload profiles after update
  await loadProfiles();
}

// Function to send SMS notification (dummy implementation)
async function sendSmsNotification(phoneNumber, message) {
  try {
    const response = await fetch('http://localhost:3000/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, message }),
      mode: 'cors', 
    });

    if (response.ok) {
      console.log('SMS sent successfully!');
    } else {
      console.error('Failed to send SMS.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Chat functionality

// Send message
// Send message
async function sendMessage(event) {
  event.preventDefault();

  const messageInput = document.getElementById('message-input');
  const message = messageInput.value;
  const user = auth.currentUser;

  if (message.trim() === '') {
    return;
  }

  try {
    await addDoc(collection(db, "chatMessages"), {
      uid: user.uid,
      message: message,
      timestamp: new Date()
    });
    messageInput.value = '';
  } catch (error) {
    console.error("Error sending message: ", error);
  }
}

async function loadChatMessages() {
  const chatMessagesQuery = query(collection(db, "chatMessages"), orderBy("timestamp"));
  const chatMessagesDiv = document.getElementById("chat-messages");

  onSnapshot(chatMessagesQuery, async (snapshot) => {
    chatMessagesDiv.innerHTML = '';

    const messagePromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const uid = data.uid;

      try {
        const permitRef = doc(db, "buildingPermits", uid); // Correct usage of doc
        const permitSnapshot = await getDoc(permitRef);

        if (permitSnapshot.exists()) {
          const permitData = permitSnapshot.data();
          const ownerName = permitData.ownerName;
          return { ownerName, message: data.message };
        } else {
          console.log(`No building permit found for ownerUid: ${uid}`);
          return { ownerName: 'User', message: data.message }; // Fallback if no permit found
        }
      } catch (error) {
        console.error("Error fetching building permit:", error);
        return { ownerName: 'User', message: data.message }; // Error fallback
      }
    });

    const messages = await Promise.all(messagePromises);

    messages.forEach(({ ownerName, message }) => {
      const messageElement = document.createElement('div');
      messageElement.textContent = `${ownerName}: ${message}`;
      chatMessagesDiv.appendChild(messageElement);
    });
  });
}


// Initialize Firebase and set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed in firebase.js');
  attachEventListeners(); // Attach event listeners to forms and buttons
  monitorAuthState(); // Monitor authentication state changes
  loadProfiles(); // Load profiles from Firestore
  loadChatMessages(); // Load chat messages from Firestore
});
