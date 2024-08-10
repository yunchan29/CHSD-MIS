import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhvoPidRWGeJmnN2E11SBS5n8oyxVLJ0M",
    authDomain: "chsd-mis.firebaseapp.com",
    projectId: "chsd-mis",
    storageBucket: "chsd-mis.appspot.com",
    messagingSenderId: "694967679357",
    appId: "1:694967679357:web:65cffd50f13739f934f414",
    measurementId: "G-XBQTQFRLJ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to check user roles
async function checkUserRole(userUid) {
    try {
        let isAdminPC = false;
        let isAdminIS = false;

        const adminPCRef = doc(db, 'AdminPC', userUid);
        const adminPCSnapshot = await getDoc(adminPCRef);
        if (adminPCSnapshot.exists()) {
            isAdminPC = adminPCSnapshot.data().isAdmin === true;
        }

        const adminISRef = doc(db, 'AdminIS', userUid);
        const adminISSnapshot = await getDoc(adminISRef);
        if (adminISSnapshot.exists()) {
            isAdminIS = adminISSnapshot.data().isAdmin === true;
        }

        return { isAdminPC, isAdminIS };
    } catch (error) {
        console.error("Error fetching user roles:", error);
        throw error;
    }
}

// Function to handle admin login
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
            window.location.href = "/AdminPages/InformalSettlers/InformalSettlersApplication.html";
        } else {
            console.log("Redirecting to client dashboard");
            window.location.href = "/ClientPages/clientDashboard.html";
        }
    } catch (error) {
        console.error("Error signing in:", error.code, error.message);
        alert("Login failed: " + error.message);
    }
}

// Function to handle user login
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

// Function to monitor authentication state and display user info
function monitorAuthState() {
    onAuthStateChanged(auth, async (user) => {
        const userInfo = document.getElementById('user-info');
        const userNameElement = document.getElementById('user-name');

        if (user) {
            console.log("User is logged in:", user.uid);
            
            if (userNameElement) {
                const userRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    const { firstName, lastName } = docSnap.data();
                    userNameElement.textContent = `${firstName} ${lastName}`;
                } else {
                    console.error("No such document!");
                }
            }

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

// Function to add a building permit and update user's document
async function addBuildingPermit(event) {
    event.preventDefault();

    const buildingPermitNo = document.getElementById('buildingPermitNo').value;
    const issuedOn = document.getElementById('basic-url').value;
    const addressTelNo = document.getElementById('addressTelNo').value;
    const projectLocation = document.getElementById('projectLocation').value;
    const hsdFormNo = document.getElementById('hsdFormNo').value;
    const ownerLastName = document.getElementById('ownerLastName').value;
    const ownerFirstName = document.getElementById('ownerFirstName').value;
    const ownerMiddleName = document.getElementById('ownerMiddleName').value;
    const ownerMaidenName = document.getElementById('ownerMaidenName').value;
    const ownerEmail = document.getElementById('ownerEmail') ? document.getElementById('ownerEmail').value : null;

    const ownerName = `${ownerLastName} ${ownerFirstName} ${ownerMiddleName} ${ownerMaidenName}`;

    const scopeOfWork = [];
    document.querySelectorAll('input[name="scopeOfWork"]:checked').forEach(option => {
        scopeOfWork.push(option.nextElementSibling.textContent);
    });

    const projectJustification = [];
    document.querySelectorAll('input[name="projectJustification"]:checked').forEach(option => {
        projectJustification.push(option.nextElementSibling.textContent);
    });

    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("No user logged in.");
            return;
        }

        const { isAdminPC, isAdminIS } = await checkUserRole(user.uid);
        const isAdmin = isAdminPC || isAdminIS;

        let ownerUid;

        if (isAdmin && ownerEmail) {
            const defaultPassword = 'sample'; 
            const userCredential = await createUserWithEmailAndPassword(auth, ownerEmail, defaultPassword);
            const newUser = userCredential.user;
            ownerUid = newUser.uid;
        } else {
            ownerUid = user.uid;
        }

        const permitDocRef = await addDoc(collection(db, "buildingPermits"), {
            buildingPermitNo,
            issuedOn,
            ownerName,
            addressTelNo,
            projectLocation,
            hsdFormNo,
            scopeOfWork,
            projectJustification,
            ownerUid: ownerUid,
            status: 'Pending'
        });

        await updateDoc(doc(db, 'users', ownerUid), {
            buildingPermits: arrayUnion({
                permitId: permitDocRef.id,
                buildingPermitNo,
                issuedOn,
                status: 'Pending',
                projectLocation
            })
        });

        alert("Building permit application submitted successfully!");
        window.location.reload();
    } catch (error) {
        console.error("Error adding profile or creating user:", error);

        if (error.code === "auth/missing-email") {
            alert("User creation is not allowed for non-admin users. Please contact an administrator.");
        } else {
            alert("Failed to submit application. Please try again later.");
        }
    }
}

// Function to load the user's permit status
async function loadUserPermitStatus() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("No user is signed in.");
            return;
        }

        console.log("Fetching permit status for user:", user.uid);

        const permitsRef = collection(db, "users", user.uid, "buildingPermits");
        const permitsSnapshot = await getDocs(permitsRef);

        const tableBody = document.getElementById('permit-status-table');
        tableBody.innerHTML = '';

        if (!permitsSnapshot.empty) {
            permitsSnapshot.forEach((permitDoc) => {
                const permit = permitDoc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>Building Permit</td>
                    <td>${permit.issuedOn}</td>
                    <td>${permit.status}</td>
                    <td><a class="btn btn-primary text-white" data-bs-toggle="modal" data-bs-target="#viewRemarks"><i class="fa-solid fa-comment"></i> View Remarks</a></td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="4">No building permits found.</td></tr>';
        }
    } catch (error) {
        console.error("Error fetching permit status:", error);
    }
}



// Function to load building permits (for admin view)
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

// Function to attach event listeners
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

// Function to attach save button listeners
function attachSaveButtonListeners() {
    const saveButtons = document.querySelectorAll('.save-btn');
    saveButtons.forEach(button => {
        button.addEventListener('click', handleSaveBuildingPermit);
    });
}

// Function to attach archive button listeners
function attachArchiveButtonListeners() {
    const archiveButtons = document.querySelectorAll('.archive-btn');
    archiveButtons.forEach(button => {
        button.addEventListener('click', handleArchiveBuildingPermit);
    });
}

// Function to handle saving a building permit
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

// Function to handle archiving a building permit
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

// Function to send SMS notifications
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

// Function to send a message
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

// Function to handle sign-up
async function handleSignUp(event) {
    event.preventDefault();

    const firstName = document.getElementById('client-first-name').value;
    const lastName = document.getElementById('client-last-name').value;
    const email = document.getElementById('client-signup-email').value;
    const password = document.getElementById('client-signup-password').value;
    const confirmPassword = document.getElementById('client-confirm-password').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userId = user.uid;

        console.log("User created successfully:", userId);

        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            firstName: firstName,
            lastName: lastName,
            email: email,
        });

        console.log("User data saved to Firestore under collection 'users'.");

        await signOut(auth);
        console.log("User signed out after sign up.");

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

// Function to fetch and set client info
async function fetchAndSetClientInfo() {
    try {
        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
            const userRef = doc(db, 'users', userId);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                const { firstName, lastName } = userData;

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

document.addEventListener('DOMContentLoaded', () => {
    attachEventListeners();
    monitorAuthState();

    const buildingPermitDiv = document.getElementById("buildingPermitDiv");
    if (buildingPermitDiv) {
        loadProfiles();
    }

    const permitStatusTable = document.getElementById('permit-status-table');
    if (permitStatusTable) {
        loadUserPermitStatus();
    }

    fetchAndSetClientInfo();
});
