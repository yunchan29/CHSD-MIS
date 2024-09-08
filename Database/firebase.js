import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const storage = getStorage(app);

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
    
    // Show the loading screen
    document.getElementById('loading-screen').style.display = 'flex';

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
        
        // Hide the loading screen in case of an error
        document.getElementById('loading-screen').style.display = 'none';
    }
}

// Function to handle user login
async function handleUserLogin(event) {
    event.preventDefault();
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    
    // Show the loading screen
    document.getElementById('loading-screen').style.display = 'flex';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User signed in:", user.uid);

        window.location.href = "/ClientPages/clientDashboard.html";
    } catch (error) {
        console.error("Error signing in:", error.code, error.message);
        alert("Login failed: " + error.message);
        
        // Hide the loading screen in case of an error
        document.getElementById('loading-screen').style.display = 'none';
    }
}

// Function to handle user signup
async function handleSignUp(event) {
    event.preventDefault();

    const firstName = document.getElementById('client-first-name').value;
    const lastName = document.getElementById('client-last-name').value;
    const email = document.getElementById('client-signup-email').value;
    const password = document.getElementById('client-signup-password').value;
    const confirmPassword = document.getElementById('client-confirm-password').value;

    const selectedAvatar = document.querySelector('input[name="avatar"]:checked');
    const uploadedImageFile = document.getElementById('client-upload-image').files[0];

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Show the loading screen
    document.getElementById('loading-screen').style.display = 'flex';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userId = user.uid;

        let avatarUrl = null;

        // If the user selected an avatar, use that
        if (selectedAvatar) {
            avatarUrl = `/resources/pictures/${selectedAvatar.value}`;
        }

        // If the user uploaded an image, upload it to Firebase Storage
        if (uploadedImageFile) {
            const storageRef = ref(storage, `userAvatars/${userId}/${uploadedImageFile.name}`);
            await uploadBytes(storageRef, uploadedImageFile);
            avatarUrl = await getDownloadURL(storageRef);
            console.log("Uploaded avatar and obtained URL:", avatarUrl);
        }

        // Save user information to Firestore
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            firstName: firstName,
            lastName: lastName,
            email: email,
            avatarUrl: avatarUrl,
        });

        console.log("User data saved to Firestore under collection 'users'.");

        // Sign out the user after successful sign-up
        await signOut(auth);
        console.log("User signed out after sign up.");

        // Slight delay before redirect to ensure all processes are completed
        setTimeout(() => {
            window.location.replace("/ClientPages/clientLogin.html");
        }, 1000); // 1-second delay

    } catch (error) {
        console.error("Error signing up:", error.code, error.message);
        alert("Sign Up failed: " + error.message);
        
        // Hide the loading screen in case of an error
        document.getElementById('loading-screen').style.display = 'none';
    }
}


// Function to monitor authentication state and display user info
function monitorAuthState() {
    onAuthStateChanged(auth, async (user) => {
        const userInfo = document.getElementById('user-info');
        const userNameElement = document.getElementById('user-name');
        const permitStatusTable = document.getElementById('permit-status-table'); // Add this line

        if (user) {
            console.log("User is logged in:", user.uid);

            // Fetch and display user info
            if (userNameElement) {
                const userRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    const { firstName, lastName, avatarUrl } = docSnap.data();
                    userNameElement.textContent = `${firstName} ${lastName}`;

                    const avatarElement = document.getElementById('client-avatar');
                    if (avatarUrl) {
                        avatarElement.src = avatarUrl;
                        avatarElement.alt = `${firstName} ${lastName}'s Avatar`;
                    } else {
                        avatarElement.src = '/resources/pictures/avatar3.png'; // Default avatar
                        avatarElement.alt = 'Default Avatar';
                    }
                } else {
                    console.error("No such document!");
                }
            }

            if (userInfo) {
                userInfo.innerHTML = `Logged in as: ${user.email}`;
            }

            // Fetch and display user permit status
            if (permitStatusTable) {
                await loadUserPermitStatus(); // Ensure permits are loaded
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

// Function to add a building permit
async function addBuildingPermit(event) {
    event.preventDefault();

    const buildingPermitNo = document.getElementById('buildingPermitNo').value;
    const issuedOn = document.getElementById('basic-url').value;
    const addressTelNo = document.getElementById('addressTelNo').value;
    const projectLocation = document.getElementById('projectLocation').value;
    const hsdFormNo = document.getElementById('hsdFormNo').value;
    const phoneNumber=document.getElementById('phoneNumber').value;
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
            phoneNumber,
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


// Function to edit an existing building permit
async function editBuildingPermit(event) {
    event.preventDefault();

    const permitId = document.getElementById('permitId').value; // ID of the permit to edit
    const buildingPermitNo = document.getElementById('buildingPermitNo').value;
    const issuedOn = document.getElementById('basic-url').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
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

        // Update existing permit
        await updateDoc(doc(db, "buildingPermits", permitId), {
            buildingPermitNo,
            issuedOn,
            ownerName,
            phoneNumber,
            addressTelNo,
            projectLocation,
            hsdFormNo,
            scopeOfWork,
            projectJustification,
            ownerUid,
            status: 'Pending'
        });

        // Update user's document
        await updateDoc(doc(db, 'users', ownerUid), {
            buildingPermits: arrayUnion({
                permitId,
                buildingPermitNo,
                issuedOn,
                status: 'Pending',
                projectLocation
            })
        });

        alert("Building permit updated successfully!");
        window.location.reload();
    } catch (error) {
        console.error("Error updating building permit:", error);

        if (error.code === "auth/missing-email") {
            alert("User creation is not allowed for non-admin users. Please contact an administrator.");
        } else {
            alert("Failed to update permit. Please try again later.");
        }
    }
}









async function loadUserPermitStatus() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("No user is signed in.");
            return;
        }

        document.getElementById('fetching-loading-screen').style.display = 'flex';
        console.log("Fetching permit status for user:", user.uid);

        const permitsRef = collection(db, "buildingPermits");
        const q = query(permitsRef, where("ownerUid", "==", user.uid));
        const permitsSnapshot = await getDocs(q);

        console.log("Query result: ", permitsSnapshot.empty ? "No documents found." : `Found ${permitsSnapshot.size} documents`);

        const tableBody = document.getElementById('permit-status-table');
        tableBody.innerHTML = '';

        if (!permitsSnapshot.empty) {
            permitsSnapshot.forEach((permitDoc) => {
                const permit = permitDoc.data();
                console.log("Permit data:", permit);

                // Create a button for viewing remarks
                const viewRemarksButton = `
                    <a class="btn btn-primary text-white" data-bs-toggle="modal" data-bs-target="#viewRemarks" onclick="showRemarks('${permitDoc.id}')">
                        <i class="fa-solid fa-comment"></i> View Remarks
                    </a>
                `;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>Building Permit</td>
                    <td>${permit.issuedOn}</td>
                    <td>${permit.status}</td>
                    <td>${viewRemarksButton}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="4">No permits found.</td></tr>';
        }
    } catch (error) {
        console.error("Error fetching permit status:", error);
    } finally {
        document.getElementById('fetching-loading-screen').style.display = 'none';
    }
}




document.addEventListener('DOMContentLoaded', () => {
    // Example function to open the remarks modal and show the remarks
    async function openRemarksModal(permitId) {
        await showRemarks(permitId);
        var remarksModal = new bootstrap.Modal(document.getElementById('viewRemarks'));
        remarksModal.show();
    }

    // Example function to add click event listeners to table rows
    function addTableRowListeners() {
        const rows = document.querySelectorAll('#permit-status-table tr');
        rows.forEach(row => {
            row.addEventListener('click', () => {
                const permitId = row.getAttribute('data-permit-id');
                if (permitId) {
                    openRemarksModal(permitId);
                }
            });
        });
    }

    // Call the function to add listeners after table rows are populated
    addTableRowListeners();
});


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
                    <option value="For Release" ${data.status === "For Release" ? 'selected' : ''}>For Release</option>
                    <option value="Claimed" ${data.status === "Claimed" ? 'selected' : ''}>Claimed</option>
                </select>
            </td>
            <td>
                <a class="mt-2 btn btn-success text-white save-btn" data-id="${doc.id}">Save</a>
               <a class="mt-2 btn btn-secondary text-white" data-bs-toggle="modal" data-bs-target="#remarksModal1" data-permit-id="${doc.id}">Remarks</a>

                <!-- Button to trigger the edit modal -->
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#buildingPermitModal" data-permit-id="${doc.id}">Edit</button>
                <button class="mt-2 btn btn-danger text-white archive-btn" data-id="${doc.id}">Archive</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    attachSaveButtonListeners();
    attachArchiveButtonListeners();
    attachEditButtonListeners();
    attachRemarksButtonListeners(); // Add this line to attach remarks button listeners
}

// Function to attach event listeners to edit buttons
function attachEditButtonListeners() {
    const editButtons = document.querySelectorAll('button[data-bs-target="#buildingPermitModal"]');
    
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const permitId = button.getAttribute('data-permit-id');
            populateEditForm(permitId); // Ensure this function populates the form in the modal
        });
    });
}


// Function to populate the edit form with data
function populateEditForm(permitId) {
    // Fetch the permit data from Firestore
    const permitDoc = doc(db, "buildingPermits", permitId);
    
    getDoc(permitDoc).then((docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();

            // Populate the form fields with permit data
            document.getElementById('hsdFormNo').value = data.hsdFormNo || '';
            document.getElementById('ownerEmail').value = data.ownerEmail || '';
            document.getElementById('buildingPermitNo').value = data.buildingPermitNo || '';
            document.getElementById('basic-url').value = data.issuedOn || '';
            document.getElementById('phoneNumber').value = data.phoneNumber || '';
            document.getElementById('addressTelNo').value = data.addressTelNo || '';
            document.getElementById('projectLocation').value = data.projectLocation || '';
            
            // Update checkbox values based on data
            document.getElementById('option1').checked = data.scopeOfWork.includes('New Construction');
            document.getElementById('option2').checked = data.scopeOfWork.includes('Addition');
            document.getElementById('option3').checked = data.scopeOfWork.includes('Repair Renovation');
            document.getElementById('option4').checked = data.scopeOfWork.includes('Others');
            
            document.getElementById('justification1').checked = data.projectJustification.includes('Single Attached/Semi-Attached/Duplex');
            document.getElementById('justification2').checked = data.projectJustification.includes('Single/Detached');
            document.getElementById('justification3').checked = data.projectJustification.includes('Row House/Multi-family Dwelling');
            
            // Populate the dynamic fields if they exist
            const lotBlockField = document.getElementById('lotBlockField');
            const sqMField = document.getElementById('sqMField');
            const totalFloorArea = document.getElementById('totalFloorArea');
            const estimatedCost = document.getElementById('estimatedCost');
            
            if (lotBlockField && sqMField && totalFloorArea && estimatedCost) {
                lotBlockField.value = data.lotBlock || '';
                sqMField.value = data.sqM || '';
                totalFloorArea.value = data.totalFloorArea || '';
                estimatedCost.value = data.estimatedCost || '';
            }

            // Assuming `editPermitForm` is the form in the modal
            const editPermitForm = document.getElementById('editPermitForm');
            if (editPermitForm) {
                editPermitForm.dataset.permitId = permitId; // Store permitId in form's dataset for later use
            }
        } else {
            console.error('No such document!');
        }
    }).catch((error) => {
        console.error('Error getting document:', error);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    // Function to populate the edit form
    function populateEditForm(permitId) {
        // Example code for fetching and populating data
        console.log('populateEditForm called with permitId:', permitId);
        // Fetch and populate form fields here
    }

    // Attach event listeners to buttons
    function attachEventListeners() {
        const editPermitButtons = document.querySelectorAll('button[data-permit-id]');

        editPermitButtons.forEach(button => {
            button.addEventListener('click', () => {
                const permitId = button.getAttribute('data-permit-id');
                populateEditForm(permitId);
            });
        });
    }

    attachEventListeners();
});


// Function to attach event listeners to remarks buttons
function attachRemarksButtonListeners() {
    const remarksButtons = document.querySelectorAll('a[data-permit-id]');
    
    remarksButtons.forEach(button => {
        button.addEventListener('click', () => {
            const permitId = button.getAttribute('data-permit-id');
            showRemarks(permitId); // Or showRemarks(permitId) depending on your requirement
        });
    });
}


// Function to attach event listeners
function attachEventListeners() {
    const adminLoginForm = document.getElementById('admin-login-form');
    const userLoginForm = document.getElementById('user-login-form');
    const adminLogoutButton = document.getElementById('admin-logout-btn');
    const userLogoutButton = document.getElementById('user-logout-btn');
    const addBuildingPermitButton = document.getElementById('submitProfile');
    const sendMessageForm = document.getElementById('send-message-form');
    const signUpForm = document.getElementById('client-signup-form');
    const editPermitForm = document.getElementById('editPermitForm');  

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

    if (signUpForm) {
        signUpForm.addEventListener('submit', handleSignUp);
    }

    if (editPermitForm) {  
        editPermitForm.addEventListener('submit', editBuildingPermit);
    }
}

// Call the function to attach event listeners
attachEventListeners();


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

// Function to fetch and display client info
async function fetchAndSetClientInfo() {
    try {
        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
            const userRef = doc(db, 'users', userId);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                const { firstName, lastName, avatarUrl } = userData;

                document.getElementById('clientInfo').innerHTML = `
                    <div>Client ID: ${userId}</div>
                    <div>${firstName} ${lastName}</div>
                `;

                if (avatarUrl) {
                    document.getElementById('client-avatar').src = avatarUrl;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching client info:', error);
    }
}




// Admin: Save Remark
async function saveRemark(buildingPermitId) {
    const newRemark = document.getElementById('new-remark').value.trim();
    if (newRemark === '') {
        alert("Remark cannot be empty.");
        return;
    }
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("No user logged in.");
            return;
        }
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            alert("User document does not exist.");
            return;
        }
        const userName = userDoc.data().name || 'Unknown';
        const remarkData = {
            text: newRemark,
            timestamp: serverTimestamp(), // Use serverTimestamp for consistency
            buildingPermitId: buildingPermitId,
            userId: currentUser.uid,
            userName: userName
        };
        const remarksCollectionRef = collection(userRef, "remarks");
        await addDoc(remarksCollectionRef, remarkData);
        alert("Remark saved successfully");
        document.getElementById('new-remark').value = '';
        loadRemarks(buildingPermitId); // Reload remarks
    } catch (error) {
        console.error("Error saving remark:", error);
        alert("Failed to save remark. Please try again later.");
    }
}

// Admin: Load Remarks
async function loadRemarks(buildingPermitId) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("No user logged in.");
            return;
        }
        const remarksCollectionRef = collection(db, "users", currentUser.uid, "remarks");
        const q = query(remarksCollectionRef, where("buildingPermitId", "==", buildingPermitId));
        const remarksSnapshot = await getDocs(q);
        const existingRemarksContainer = document.getElementById('existing-remarks');
        if (!existingRemarksContainer) {
            console.warn("No element with id 'existing-remarks' found.");
            return;
        }
        if (remarksSnapshot.empty) {
            existingRemarksContainer.innerHTML = '<p>No remarks found.</p>';
            return;
        }
        existingRemarksContainer.innerHTML = '';
        remarksSnapshot.forEach(doc => {
            const remarkData = doc.data();
            const remarkDiv = document.createElement('div');
            remarkDiv.className = 'remark mb-2';
            const remarkText = remarkData.text || 'No text';
            const remarkTimestamp = remarkData.timestamp ? new Date(remarkData.timestamp.seconds * 1000).toLocaleString() : 'No timestamp';
            remarkDiv.innerHTML = `
                <div style="border:1px solid black; border-radius:12px; margin:1%; padding:10px;">
                    <p>${remarkText}</p>
                    <small>Posted by: Admin on ${remarkTimestamp}</small>
                </div>
            `;
            existingRemarksContainer.appendChild(remarkDiv);
        });
    } catch (error) {
        console.error("Error loading remarks:", error);
        alert("Failed to load remarks. Please try again later.");
    }
}

// Client: Show Remarks
async function showRemarks(permitId) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            document.getElementById('remarks-content').innerText = 'No user logged in';
            return;
        }
        const userRef = doc(db, "users", currentUser.uid);
        const remarksRef = collection(userRef, "remarks");
        const q = query(remarksRef, where("buildingPermitId", "==", permitId));
        const remarksSnapshot = await getDocs(q);
        const userRemarks = remarksSnapshot.docs.map(doc => doc.data());
        const remarksContent = userRemarks.length > 0
            ? userRemarks.map(remark => `
                <div>
                    <p>${remark.text}</p>
                    <small>Posted on ${new Date(remark.timestamp.seconds * 1000).toLocaleString()}</small>
                </div>
            `).join('')
            : 'No remarks available';
        document.getElementById('remarks-content').innerHTML = remarksContent;
    } catch (error) {
        console.error("Error fetching permit remarks:", error);
        document.getElementById('remarks-content').innerText = 'Error fetching remarks';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    attachEventListeners();
    monitorAuthState();

    // Debug log to check if buildingPermitId is being found
    const buildingPermitBtn = document.querySelector('.save-btn');
    if (buildingPermitBtn) {
        const buildingPermitId = buildingPermitBtn.getAttribute('data-id');
        console.log("Building Permit ID found on page load:", buildingPermitId);
        
        if (buildingPermitId) {
            loadRemarks(buildingPermitId);
        } else {
            console.error('Building Permit ID is not set on the save button');
        }
    } else {
        console.error('No element with class "save-btn" found');
    }

    // Additional initialization
    const buildingPermitDiv = document.getElementById("buildingPermitDiv");
    if (buildingPermitDiv) {
        loadProfiles();
    }

    const permitStatusTable = document.getElementById('permit-status-table');
    if (permitStatusTable) {
        loadUserPermitStatus();
    }

    fetchAndSetClientInfo();

    // Handle Save Remark Button
    const saveRemarkButton = document.getElementById('save-remark-btn');
    if (saveRemarkButton) {
        saveRemarkButton.addEventListener('click', () => {
            const buildingPermitId = document.querySelector('.save-btn')?.getAttribute('data-id');
            if (buildingPermitId) {
                saveRemark(buildingPermitId);
            } else {
                console.error('Save Remark button has no data-id attribute');
            }
        });
    } else {
        console.error('Save Remark button not found');
    }

    // Handle Load Remarks Button
    document.querySelectorAll('.save-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const buildingPermitId = event.target.getAttribute('data-id');
            if (buildingPermitId) {
                loadRemarks(buildingPermitId);
            } else {
                console.error('Save button has no data-id attribute');
            }
        });
    });
});


//user manager
// Reference to the 'users' collection
const usersCollection = collection(db, "users");

// Function to load users and display them
async function loadUsers() {
    const querySnapshot = await getDocs(usersCollection);
    const userTableBody = document.getElementById("userTableBody");

    querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const userRow = `
            <tr>
                <td>${doc.id}</td> <!-- Assuming USID is the document ID -->
               <td>${userData.firstName} ${userData.lastName}</td>
                <td>${userData.email}</td>
                <td>*******</td> <!-- You may want to hide the actual password -->
                <td>User</td> <!-- Assuming 'User' as the default account type -->
                <td>YES</td> <!-- Assuming all users are enabled by default -->
            </tr>
        `;
        userTableBody.insertAdjacentHTML('beforeend', userRow);
    });
}


window.addEventListener('DOMContentLoaded', loadUsers);


async function fetchPermitCounts() {
    // Show the loading screen
    document.getElementById('fetching-loading-screen').style.display = 'flex';

    // Collection references
    const buildingPermitRef = collection(db, "buildingPermits");
    const occupancyPermitRef = collection(db, "OccupancyPermit");
    const electricalCertRef = collection(db, "ElectricalCert");

    try {
        // Get the total count of documents in each collection
        const buildingPermitsSnapshot = await getDocs(buildingPermitRef);
        const occupancyPermitsSnapshot = await getDocs(occupancyPermitRef);
        const electricalCertsSnapshot = await getDocs(electricalCertRef);

        // Update the UI with the counts
        document.getElementById('buildingPermitCount').textContent = buildingPermitsSnapshot.size;
        document.getElementById('occupancyPermitCount').textContent = occupancyPermitsSnapshot.size;
        document.getElementById('electricalCertCount').textContent = electricalCertsSnapshot.size;
    } catch (error) {
        console.error("Error fetching permit counts: ", error);
    } finally {
        // Hide the loading screen
        document.getElementById('fetching-loading-screen').style.display = 'none';
    }
}

// Call the function to fetch and display permit counts
fetchPermitCounts();