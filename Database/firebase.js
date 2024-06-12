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


async function handleUserLogin(event) {
  event.preventDefault();
  const email = document.getElementById('user-email').value;
  const password = document.getElementById('user-password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("User signed in:", user.uid);


    window.location.href = "/ClientPages/clientDashboard.html";
  } catch (error) {
    console.error("Error signing in:", error.code, error.message);
    alert("Login failed: " + error.message);
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




async function handleLogout(event) {
  event.preventDefault();

  try {
    await signOut(auth);
    window.location.href = '/ClientPages/clientLogin.html';
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// Function to handle Google Sign-In
const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Google user signed in:", user.uid);
    console.log("Redirecting to client dashboard");
    window.location.href = "/ClientPages/clientDashboard.html";
    // Handle redirect or additional logic after successful Google sign-in
  } catch (error) {
    console.error("Error signing in with Google:", error);
    alert("Failed to sign in with Google. Please try again later.");
  }
};

// Event listener for Google Sign-In button
const googleSignInBtn = document.getElementById('google-signin-btn');
if (googleSignInBtn) {
  googleSignInBtn.addEventListener('click', handleGoogleSignIn);
}


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
  tableBody.innerHTML = ""; 

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


  attachSaveButtonListeners();
  attachArchiveButtonListeners();
}


document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM fully loaded and parsed in firebase.js');
  attachEventListeners();
  monitorAuthState(); 
  loadProfiles(); 
});


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


function attachSaveButtonListeners() {
  const saveButtons = document.querySelectorAll('.save-btn');
  saveButtons.forEach(button => {
    button.addEventListener('click', handleSaveBuildingPermit);
  });
}


function attachArchiveButtonListeners() {
  const archiveButtons = document.querySelectorAll('.archive-btn');
  archiveButtons.forEach(button => {
    button.addEventListener('click', handleArchiveBuildingPermit);
  });
}

async function handleSignUp(event) {
  event.preventDefault();

  const firstName = document.getElementById('client-first-name').value;
  const lastName = document.getElementById('client-last-name').value;
  const email = document.getElementById('client-signup-email').value;
  const password = document.getElementById('client-signup-password').value;
  const confirmPassword = document.getElementById('client-confirm-password').value;

  // Validate passwords match
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userId = user.uid;

    console.log("User created successfully:", userId);

    // Save additional user data to Firestore under collection "users"
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      firstName: firstName,
      lastName: lastName,
      email: email,
    });

    console.log("User data saved to Firestore under collection 'users'.");

    // Optionally, you can log the user out and redirect
    await signOut(auth); // Log out current user if any
    console.log("User signed out after sign up.");

    // Redirect to login page
    window.location.replace("/ClientPages/clientLogin.html");

  } catch (error) {
    console.error("Error signing up:", error.code, error.message);
    alert("Sign Up failed: " + error.message);
  }
}


// Event listener for sign-up form submission
const signUpForm = document.getElementById('client-signup-form');
if (signUpForm) {
  signUpForm.addEventListener('submit', handleSignUp);
}


document.addEventListener('DOMContentLoaded', async () => {
  // Function to fetch user data and update client info
  async function fetchAndSetClientInfo() {
      try {
          // Assuming you have the auth and db references set up already
          const user = auth.currentUser;
          if (user) {
              const userId = user.uid;
              const userRef = doc(db, 'users', userId);
              const docSnap = await getDoc(userRef);

              if (docSnap.exists()) {
                  const userData = docSnap.data();
                  const { firstName, lastName } = userData;

                  // Update client info in the sidebar
                  document.getElementById('clientInfo').innerHTML = `
                      <div>Client ID: ${userId}</div>
                      <div>${firstName} ${lastName}</div>
                  `;
              }
          }
      } catch (error) {
          console.error('Error fetching client info:', error);
      }
  }

  // Call the function to fetch and set client info on page load
  await fetchAndSetClientInfo();
});
 
async function handleArchiveBuildingPermit(event) {
  event.preventDefault();

  const buildingPermitId = event.target.getAttribute('data-id');

  
  const confirmed = confirm("Are you sure you want to archive this document?");
  
  if (!confirmed) {
    return; 
  }

  try {
    const buildingPermitRef = doc(db, "buildingPermits", buildingPermitId);
    const buildingPermitSnapshot = await getDoc(buildingPermitRef);

    if (buildingPermitSnapshot.exists()) {
      const buildingPermitData = buildingPermitSnapshot.data();
      
  
      await setDoc(doc(db, "archivedBuildingPermits", buildingPermitId), buildingPermitData);
      
    
      await deleteDoc(buildingPermitRef);

      
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


async function handleSaveBuildingPermit(event) {
  event.preventDefault();

  const buildingPermitId = event.target.getAttribute('data-id');
  const row = event.target.closest('tr');
  const statusSelect = row.querySelector('.status-select'); 

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
  
  await loadProfiles();
}


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

//async function loadChatMessages() {
  //const chatMessagesQuery = query(collection(db, "chatMessages"), orderBy("timestamp"));
  //const chatMessagesDiv = document.getElementById("chat-messages");

  //onSnapshot(chatMessagesQuery, (snapshot) => {
   // chatMessagesDiv.innerHTML = '';
    //snapshot.forEach((doc) => {
     // const data = doc.data();
      //const messageElement = document.createElement('div');
     // messageElement.textContent = `${data.uid}: ${data.message}`;
      //chatMessagesDiv.appendChild(messageElement);
    //});
  //});
//}


document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed in firebase.js');
  attachEventListeners(); 
  monitorAuthState(); 
  loadProfiles(); 
 // loadChatMessages(); 
});


//Facial Recognition
async function storeFacialData(detections) {
  const userId = "some_unique_user_id"; // Replace with actual user ID logic
  const descriptors = detections.map(det => Array.from(det.descriptor));

  try {
    await db.collection("facialData").doc(userId).set({ descriptors });
    console.log("Facial data stored successfully!");
  } catch (e) {
    console.error("Error storing facial data: ", e);
  }
}

//video.addEventListener('play', () => {
//  const canvas = faceapi.createCanvasFromMedia(video);
 // document.body.append(canvas);
  //const displaySize = { width: video.width, height: video.height };
 // faceapi.matchDimensions(canvas, displaySize);

  //setInterval(async () => {
  //  const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
  //  if (detections.length > 0) {
   //   await storeFacialData(detections);
   // }
   // const resizedDetections = faceapi.resizeResults(detections, displaySize);
  //  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    //faceapi.draw.drawDetections(canvas, resizedDetections);
   // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
 // }, 100);
// });