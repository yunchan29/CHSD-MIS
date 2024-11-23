import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where, arrayUnion, Timestamp, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

// Initialize Firebase if it hasn't been initialized already
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();  // Use the already initialized app
}

// Initialize Firebase services
const auth = getAuth(app);
const db = initializeFirestore(app, {
    cache: {
        sizeBytes: 40 * 1024 * 1024,  // Optional cache size
        synchronizeTabs: true,  // Multi-tab persistence
    }
});
const storage = getStorage(app);



export const firebaseReady = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user);
            } else {
                resolve(null);
            }
        });
    });
});

// Function to check user roles
async function checkUserRole(userUid) {
    try {
        let isAdminPC = false;
        let isAdminIS = false;
        let isMainAdmin = false;

        // Check AdminPC collection
        const adminPCRef = doc(db, 'AdminPC', userUid);
        const adminPCSnapshot = await getDoc(adminPCRef);
        if (adminPCSnapshot.exists()) {
            isAdminPC = adminPCSnapshot.data().isAdmin === true;
        }

        // Check AdminIS collection
        const adminISRef = doc(db, 'AdminIS', userUid);
        const adminISSnapshot = await getDoc(adminISRef);
        if (adminISSnapshot.exists()) {
            isAdminIS = adminISSnapshot.data().isAdmin === true;
        }

        // Check MainAdmin collection
        const mainAdminRef = doc(db, 'MainAdmin', userUid);
        const mainAdminSnapshot = await getDoc(mainAdminRef);
        if (mainAdminSnapshot.exists()) {
            isMainAdmin = mainAdminSnapshot.data().isAdmin === true;
        }

        return { isAdminPC, isAdminIS, isMainAdmin };
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

        // Check user roles from Firestore
        const { isAdminPC, isAdminIS, isMainAdmin } = await checkUserRole(user.uid);

        console.log('User roles:', { isAdminPC, isAdminIS, isMainAdmin });

        // Redirect based on user role
        if (isMainAdmin) {
            console.log("Redirecting to Main Admin dashboard");
            window.location.href = "/AdminPages/Admin/adminUserManagement.html";
        } else if (isAdminPC) {
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


async function handleSignUp(event) {
    event.preventDefault();

    const firstName = document.getElementById('client-first-name').value;
    const lastName = document.getElementById('client-last-name').value;
    const middleName = document.getElementById("client-middle-name").value;
    const email = document.getElementById('client-signup-email').value;
    const password = document.getElementById('client-signup-password').value;
    const confirmPassword = document.getElementById('client-confirm-password').value;
    const clientAddress = document.getElementById("client-address").value;

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

        // Send email verification
        await sendEmailVerification(user);
        console.log("Verification email sent to:", email);
          // Hide the loading screen in case of an error
          
        Swal.fire({
            title: 'Verification Email Sent!',
            text: 'A verification email has been sent to your email address. Please verify your email before logging in.',
            icon: 'info',
            confirmButtonText: 'OK'
        });

        // Save user information to Firestore (even before verification)
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            firstName: firstName,
            middleName: middleName,
            lastName: lastName,
            email: email,
            clientAddress: clientAddress,
            avatarUrl: avatarUrl,
            emailVerified: false, // Set email verification status to false
            createdAt: serverTimestamp() // Add server timestamp here
        });

        console.log("User data saved to Firestore under collection 'users'.");

        // Monitor email verification status before allowing user to proceed
        const checkEmailVerification = setInterval(async () => {
            await user.reload(); // Reload user data to get latest email verification status
            if (user.emailVerified) {
                clearInterval(checkEmailVerification); // Stop checking once the email is verified
                console.log("User email verified:", email);

                // Update Firestore to mark the user as verified
                await updateDoc(userRef, {
                    emailVerified: true
                });

                // Sign out the user after email verification
                await signOut(auth);
                console.log("User signed out after email verification.");

                // Redirect to login page
                window.location.replace("/ClientPages/clientLogin.html");
                logFirestoreChanges("yourCollectionName", "yourDocumentId");
            }
        }, 3000); // Check every 3 seconds

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
        const avatarElement = document.getElementById('client-avatar');
        const permitStatusTable = document.getElementById('permit-status-table');

        if (!user) {
            console.log("No user is logged in.");
            if (userInfo) userInfo.innerHTML = "Not logged in";
            return;
        }

        console.log("User is logged in:", user.uid);

        // Display basic user info
        if (userInfo) userInfo.innerHTML = `Logged in as: ${user.email}`;

        // Fetch user document and permit status in parallel
        try {
            const [userDoc, permitStatus] = await Promise.all([
                fetchUserInfo(user.uid, userNameElement, avatarElement),
                loadUserPermitStatus(permitStatusTable)
            ]);

            console.log("User info and permits loaded successfully.");
        } catch (error) {
            console.error("Error loading user info or permits:", error);
        }
    });
}

// Helper function to fetch and display user info
async function fetchUserInfo(userId, userNameElement, avatarElement) {
    if (!userNameElement || !avatarElement) return;

    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        const { firstName, lastName, avatarUrl } = docSnap.data();
        userNameElement.textContent = `${firstName} ${lastName}`;
        avatarElement.src = avatarUrl || '/resources/pictures/avatar3.png';
        avatarElement.alt = `${firstName || 'Default'}'s Avatar`;
    } else {
        console.error("No such document!");
    }
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

    const scopeOfWork = document.querySelector('input[name="scopeOfWork"]:checked')?.value || '';
    const scopeOthersDetail = document.getElementById('scopeOthersDetail').value;

    const projectJustification = document.querySelector('input[name="projectJustification"]:checked')?.value || '';

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
            scopeOfWork: scopeOfWork === 'Others' ? [scopeOthersDetail] : [scopeOfWork],
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



// Function to load and display the number of unread notifications
function loadUnreadNotificationCount(userId) {
    const notificationsRef = collection(db, "notifications");
    const notificationBadge = document.getElementById("notification-badge");

    // Query for unread notifications
    const unreadNotificationsQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        where("Read", "==", false) // Adjusted to match your Firestore field
    );

    // Listen for real-time updates on unread notifications
    onSnapshot(unreadNotificationsQuery, (snapshot) => {
        const unreadCount = snapshot.size;
        
        // Update badge with unread count
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = "inline-block"; // Show badge
        } else {
            notificationBadge.style.display = "none"; // Hide badge if no unread notifications
        }
    });
}

// Call the function when the user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUnreadNotificationCount(user.uid);
    }
});


// Function to show notification
function showNotification(message, type) {
    alert(`Showing notification: ${message}`); // Debugging line
    const notificationContainer = document.getElementById('notification-container');
    if (notificationContainer) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
    } else {
        console.error('Notification container not found.');
    }
}


function attachEditButtonListeners() {
    const editButtons = document.querySelectorAll('a[data-permit-id]'); // Ensure targeting 'a' tag with permit-id attribute

    editButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            const permitId = button.getAttribute('data-permit-id');
            populateEditForm(permitId); // Call populateEditForm with the correct permitId
        });
    });
}




function populateEditForm(permitId) {
    console.log('populateEditForm called with permitId:', permitId); // Debugging log

    const permitDoc = doc(db, "buildingPermits", permitId);

    // Fetch the document from Firestore
    getDoc(permitDoc).then((docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            console.log("Permit data:", data); // Log permit data for debugging

            // Populate form fields with the permit data
            document.getElementById('hsdFormNo').value = data.hsdFormNo || '';
            document.getElementById('ownerEmail').value = data.ownerEmail || '';
            document.getElementById('buildingPermitNo').value = data.buildingPermitNo || '';
            document.getElementById('basic-url').value = data.issuedOn || '';
            document.getElementById('phoneNumber').value = data.phoneNumber || '';
            document.getElementById('addressTelNo').value = data.addressTelNo || '';
            document.getElementById('projectLocation').value = data.projectLocation || '';

            // Checkbox logic
            document.getElementById('option1').checked = data.scopeOfWork?.includes('New Construction') || false;
            document.getElementById('option2').checked = data.scopeOfWork?.includes('Addition') || false;
            document.getElementById('option3').checked = data.scopeOfWork?.includes('Repair Renovation') || false;
            document.getElementById('option4').checked = data.scopeOfWork?.includes('Others') || false;

            // Project justification logic
            document.getElementById('justification1').checked = data.projectJustification?.includes('Single Attached/Semi-Attached/Duplex') || false;
            document.getElementById('justification2').checked = data.projectJustification?.includes('Single/Detached') || false;
            document.getElementById('justification3').checked = data.projectJustification?.includes('Row House/Multi-family Dwelling') || false;

            // Dynamic fields
            document.getElementById('lotBlockField').value = data.lotBlock || '';
            document.getElementById('sqMField').value = data.sqM || '';
            document.getElementById('totalFloorArea').value = data.totalFloorArea || '';
            document.getElementById('estimatedCost').value = data.estimatedCost || '';

            // Store permitId in form's dataset (for further usage)
            document.getElementById('editPermitForm').dataset.permitId = permitId;
        } else {
            console.error('No such document!');
        }
    }).catch((error) => {
        console.error('Error getting document:', error); // Catching any potential errors
    });
}

document.addEventListener('DOMContentLoaded', () => {
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




// Function to attach event listeners
function attachEventListeners() {
    const adminLoginForm = document.getElementById('admin-login-form');
    const userLoginForm = document.getElementById('user-login-form');
    const adminLogoutButton = document.getElementById('admin-logout-btn');
    const userLogoutButton = document.getElementById('user-logout-btn');

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





document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners for buttons and forms
    attachEventListeners();
    // Monitor authentication state of the user
    monitorAuthState();

    // Load building permits profiles
    const buildingPermitDiv = document.getElementById("buildingPermitDiv");
    if (buildingPermitDiv) {
        loadProfiles();
    }

    // Load user permit status if the status table exists
    const permitStatusTable = document.getElementById('permit-status-table');
    if (permitStatusTable) {
        loadUserPermitStatus();
    }

    // Fetch and display client information
    fetchAndSetClientInfo();

    // Event listener for permit status table actions
    document.getElementById('permit-status-table').addEventListener('click', async function(event) {
        const target = event.target;

        // Check if the download button for Excel is clicked
        if (target && target.classList.contains('download-excel-btn')) {
            const permitId = target.getAttribute('data-permit-id');
            await downloadApplicationAsExcel(permitId);
        }

        // Check if the download button for PDF is clicked
        if (target && target.classList.contains('download-pdf-btn')) {
            const permitId = target.getAttribute('data-permit-id');
            await downloadApplicationAsPDF(permitId);
        }
    });
});




const logoPath = '/resources/pictures/chsd.png';  // Adjust path if necessary

async function downloadApplicationAsExcel(permitId) {
    try {
        const permitRef = doc(db, "buildingPermits", permitId);
        const permitSnap = await getDoc(permitRef);

        if (permitSnap.exists()) {
            const permitData = permitSnap.data();
            const data = [
                ['Field', 'Value'],
                ['Building Permit No', permitData.buildingPermitNo],
                ['Issued On', permitData.issuedOn],
                ['Owner Name', permitData.ownerName],
                ['Phone Number', permitData.phoneNumber],
                ['Address/Tel No.', permitData.addressTelNo],
                ['Project Location', permitData.projectLocation],
                ['Scope of Work', permitData.scopeOfWork],
                ['Project Justification', permitData.projectJustification],
            ];

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Building Permit Application');

            // Add HSD Logo to the top-left corner
            const logoBuffer = await fetch(logoPath).then(res => res.arrayBuffer());
            const logoId = wb.addImage({
                buffer: logoBuffer,
                extension: 'png',
            });
            ws.addImage(logoId, {
                tl: { col: 0, row: 0 },  // Top-left corner
                ext: { width: 75, height: 75 }  // Adjust size as needed
            });

            // Add table data starting from row 10 to leave space for the logo
            ws.addTable({
                name: 'PermitTable',
                ref: 'A10',
                columns: [
                    { name: 'Field' },
                    { name: 'Value' }
                ],
                rows: data
            });

            // Format the worksheet for A4 and short bond paper
            ws.pageSetup = {
                paperSize: 9, // A4 paper size
                orientation: 'portrait', // or 'landscape'
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                margins: {
                    left: 1,
                    right: 1,
                    top: 1.25,
                    bottom: 1.25,
                    header: 0.5,
                    footer: 0.5
                }
            };

            // Set column widths for readability
            ws.getColumn(1).width = 20;
            ws.getColumn(2).width = 40;

            // Center the table headers
            ws.getCell('A10').alignment = { horizontal: 'center', vertical: 'middle' };
            ws.getCell('B10').alignment = { horizontal: 'center', vertical: 'middle' };

            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `Building_Permit_Application_${permitId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            console.error("No such permit document!");
        }
    } catch (error) {
        console.error("Error fetching application data:", error);
    }
}


// PDF download function
async function downloadApplicationAsPDF(permitId) {
    try {
        const permitRef = doc(db, "buildingPermits", permitId);
        const permitSnap = await getDoc(permitRef);

        if (permitSnap.exists()) {
            const permitData = permitSnap.data();

            const doc = new jsPDF();
            doc.setFontSize(12);
            doc.text('Building Permit Application Form', 10, 10);

            let yPosition = 20;
            doc.text(`Building Permit No: ${permitData.buildingPermitNo}`, 10, yPosition);
            yPosition += 10;
            doc.text(`Issued On: ${permitData.issuedOn}`, 10, yPosition);
            yPosition += 10;
            doc.text(`Owner Name: ${permitData.ownerName}`, 10, yPosition);
            yPosition += 10;
            doc.text(`Phone Number: ${permitData.phoneNumber}`, 10, yPosition);
            yPosition += 10;
            doc.text(`Address/Tel No.: ${permitData.addressTelNo}`, 10, yPosition);
            yPosition += 10;
            doc.text(`Project Location: ${permitData.projectLocation}`, 10, yPosition);
            yPosition += 10;
            doc.text(`HSD Form No: ${permitData.hsdFormNo}`, 10, yPosition);
            yPosition += 10;
            doc.text(`Scope of Work: ${permitData.scopeOfWork}`, 10, yPosition);
            yPosition += 10;
            doc.text(`Project Justification: ${permitData.projectJustification}`, 10, yPosition);
            yPosition += 10;
            doc.text(`Status: ${permitData.status}`, 10, yPosition);

            doc.save(`Building_Permit_Application_${permitId}.pdf`);
        } else {
            console.error("No such permit document!");
        }
    } catch (error) {
        console.error("Error fetching application data:", error);
    }
}


async function fetchPermitCounts() {
    // Show the loading screen
    document.getElementById('fetching-loading-screen').style.display = 'flex';

    // Collection references
    const buildingPermitRef = collection(db, "buildingPermits");
    const occupancyPermitRef = collection(db, "OccupancyPermits");
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

async function loadUserPermitStatus() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("No user is signed in.");
            return;
        }

        document.getElementById('fetching-loading-screen').style.display = 'flex';
        console.log("Fetching permit status for user:", user.uid);

        const tableBody = document.getElementById('permit-status-table');
        if (!tableBody) {
            console.error("Table body element with ID 'permit-status-table' not found.");
            return;
        }
        tableBody.innerHTML = '';

        const permits = [
            { ref: collection(db, "buildingPermits"), label: "Building Permit" },
            { ref: collection(db, "OccupancyPermits"), label: "Certificate of Occupancy" },
            { ref: collection(db, "Housing"), label: "Housing Application" },
            { ref: collection(db, "ElectricalCert"), label: "Electrical Certification" }
        ];

        const createTableRow = (permit, permitType, permitId, permitNumber, commentsSummary = [], followupRequested = false, followupAllowed = false) => {
            const ownerName = permit.ownerName || permit.householdHeadName || 'Unknown Owner';
            const issuedOnDate = permit.issuedOn || (permit.createdAt ? new Date(permit.createdAt.seconds * 1000).toLocaleDateString() : 'N/A');
            const appointmentDate = permit.appointmentDate ? new Date(permit.appointmentDate.seconds * 1000).toLocaleDateString() : 'N/A';

            const viewRemarksButton = `
                <a class="btn btn-primary text-white" 
                   data-bs-toggle="modal" 
                   data-bs-target="#viewRemarks" 
                   data-id="${permitId}" 
                   data-comments-summary='${JSON.stringify(commentsSummary)}'>
                    <i class="fa-solid fa-comment"></i> Remarks
                </a>
            `;

            const followupButton = permitType === "Housing Application" && followupAllowed ? `
                <button class="btn btn-success followup-btn" 
                        data-bs-toggle="modal" 
                        data-bs-target="#followUpModal"
                        data-id="${permitId}">
                    ${followupRequested ? '<i class="fa-solid fa-bullhorn"></i> Requested' : '<i class="fa-solid fa-bullhorn"></i> Follow-up'}
                </button>
            ` : '';

            const rescheduleButton = `
                <button class="btn btn-info reschedule-btn" 
                        data-id="${permitId}" 
                        data-permit-type="${permitType}">
                    <i class="fa-solid fa-calendar"></i> Resched
                </button>
            `;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${permitNumber || 'N/A'}</td>
                <td>${ownerName}</td>
                <td>${permitType}</td>
                <td>${issuedOnDate}</td>
                <td>${permit.status || 'N/A'}</td>
                <td>${appointmentDate}</td>
                <td>
                    <div class="d-flex gap-2 flex-wrap">
                        ${viewRemarksButton} 
                        ${followupButton} 
                        ${rescheduleButton}
                    </div>
                </td>
            `;
            tableBody.appendChild(row);

            const rescheduleBtn = row.querySelector('.reschedule-btn');
rescheduleBtn.addEventListener('click', async (event) => {
    const docId = event.target.getAttribute('data-id');
    const permitType = event.target.getAttribute('data-permit-type');
    const calendarModal = new bootstrap.Modal(document.getElementById('calendarModal'));
    calendarModal.show();

    const dateInput = document.getElementById('datePicker');
    dateInput.value = ''; // Reset the date input
    dateInput.setAttribute('min', new Date().toISOString().split('T')[0]); // Disable past dates

    // Add event listener for date selection
    dateInput.addEventListener('change', async function handleDateChange(event) {
        const selectedDate = new Date(event.target.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today || [0, 6].includes(selectedDate.getDay())) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Selection',
                text: 'Rescheduling on weekends or past dates is not allowed.',
            });
            dateInput.value = ''; // Reset invalid selection
            return;
        }

        const confirmation = await Swal.fire({
            icon: 'question',
            title: 'Confirm Reschedule',
            text: `Do you want to reschedule the appointment to ${selectedDate.toLocaleDateString()}?`,
            showCancelButton: true,
            confirmButtonText: 'Yes, Reschedule',
        });

        if (confirmation.isConfirmed) {
            try {
                const permitDoc = doc(
                    db,
                    permitType === "Building Permit" 
                        ? "buildingPermits" 
                        : permitType === "Certificate of Occupancy" 
                        ? "OccupancyPermits" 
                        : permitType === "Housing Application" 
                        ? "Housing" 
                        : "ElectricalCert", 
                    docId
                );
                await updateDoc(permitDoc, { appointmentDate: Timestamp.fromDate(selectedDate) });

                Swal.fire({
                    icon: 'success',
                    title: 'Rescheduled!',
                    text: 'Appointment rescheduled successfully!',
                });
                calendarModal.hide();
            } catch (error) {
                console.error("Error rescheduling appointment:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error rescheduling appointment. Please try again.',
                });
            }
        }
        
        // Remove event listener after handling
        dateInput.removeEventListener('change', handleDateChange);
    });
});

        };

        const extractCommentsSummary = (fileValidationStatus) => {
            if (!fileValidationStatus) return [];
            return Object.entries(fileValidationStatus).map(([file, fileData]) => ({
                fileName: file,
                status: fileData.status,
                comment: fileData.comments
            })).filter(item => item.comment);
        };

        const isFollowUpAllowed = (permit) => {
            const today = new Date();
            const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 0));
            return permit.status === "Pending" && permit.createdAt && permit.createdAt.toDate() <= thirtyDaysAgo;
        };

        for (let { ref, label } of permits) {
            const querySnapshot = await getDocs(query(ref, where("ownerUid", "==", user.uid)));
            if (!querySnapshot.empty) {
                querySnapshot.forEach((permitDoc) => {
                    const permit = permitDoc.data();
                    const permitNumber = label === "Housing Application" ? permit.surveyNo : permit.buildingPermitNo;
                    const commentsSummary = extractCommentsSummary(permit.fileValidationStatus);
                    const followupAllowed = isFollowUpAllowed(permit);
                    createTableRow(permit, label, permitDoc.id, permitNumber, commentsSummary, permit.followup || false, followupAllowed);
                });
            }
        }

        if (tableBody.innerHTML === '') {
            tableBody.innerHTML = '<tr><td colspan="7">No permits or applications found.</td></tr>';
        }

    } catch (error) {
        console.error("Error fetching permit status:", error);
    } finally {
        document.getElementById('fetching-loading-screen').style.display = 'none';
    }

    document.getElementById('submitFollowUpRequest').addEventListener('click', async () => {
        const followUpButton = document.querySelector('.followup-btn[data-bs-target="#followUpModal"]');
        const docId = followUpButton ? followUpButton.getAttribute('data-id') : null;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const householdAddress = document.getElementById('householdAddress').value;

        if (!docId || !phoneNumber || !householdAddress) {
            console.error("Required fields are missing");
            return;
        }

        try {
            const permitDoc = doc(db, "Housing", docId);
            await updateDoc(permitDoc, {
                followup: true,
                telephone: phoneNumber,
                householdAddress
            });
            Swal.fire({
                icon: 'success',
                title: 'Follow-up Requested!',
                text: 'Your follow-up request has been submitted successfully.'
            });
            document.querySelector(`.followup-btn[data-id="${docId}"]`).innerHTML = '<i class="fa-solid fa-bullhorn"></i> Requested';
            bootstrap.Modal.getInstance(document.getElementById('followUpModal')).hide();
        } catch (error) {
            console.error("Error requesting follow-up:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an issue submitting your follow-up request. Please try again.'
            });
        }
    });
}


document.getElementById('viewRemarks').addEventListener('show.bs.modal', function (event) {
    const button = event.relatedTarget;
    const commentsSummary = JSON.parse(button.getAttribute('data-comments-summary'));
    const modalBody = document.querySelector('#viewRemarks .modal-body');

    modalBody.innerHTML = '';

    // Mapping file keys to descriptive names
    const fileMapping = {
        buildingPlan: 'Building Plan',
        proofOwnership: 'Proof of Ownership',
        taxReceipt: 'Photocopy of Tax Declaration & Current Tax Receipt',
        brgyClearance: 'Barangay Clearance for Building Permit',
        billMaterials: 'Bill of Materials and Specifications',
        prc: 'Photocopy of PRC ID/PTR of Signing Engineers',
        certExemption: 'Certificate of Exemption/Location Clearance from CPDO',
        structuralAnalysis: 'Structural Analysis (2-Storey and Up)',
    };

    if (commentsSummary.length === 0) {
        modalBody.textContent = 'No remarks available.';
    } else {
        // Create table structure
        const table = document.createElement('table');
        table.classList.add('table', 'table-hover', 'align-middle', 'table-striped', 'mt-3');

        // Table header
        table.innerHTML = `
            <thead class="table-light">
                <tr>
                    <th>File</th>
                    <th>Status</th>
                    <th>Comment</th>
                    <th>Action</th>
                </tr>
            </thead>
        `;

        const tbody = document.createElement('tbody');

        commentsSummary.forEach(commentObj => {
            const statusColor = commentObj.status.toLowerCase() === 'approved' ? 'success'
                : commentObj.status.toLowerCase() === 'disapproved' ? 'danger'
                : 'secondary';

            // Use mapped names or fallback to raw key
            const displayFileName = fileMapping[commentObj.fileName] || commentObj.fileName;

            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${displayFileName}</td>
                <td>
                    <span class="badge bg-${statusColor}">${commentObj.status}</span>
                </td>
                <td class="text-truncate" style="max-width: 200px;">${commentObj.comment || 'No comment provided.'}</td>
                <td>
                    ${commentObj.status.toLowerCase() === 'disapproved' ? `
                        <button class="btn btn-warning btn-sm reupload-btn" data-file="${commentObj.fileName}" data-permit-id="${button.getAttribute('data-id')}">Reupload</button>
                        <input type="file" class="d-none" id="reupload-${commentObj.fileName}" accept="application/pdf,image/*">
                    ` : ''}
                </td>
            `;

            // Add reupload functionality for disapproved files
            if (commentObj.status.toLowerCase() === 'disapproved') {
                const reuploadButton = row.querySelector('.reupload-btn');
                const fileInput = row.querySelector(`#reupload-${commentObj.fileName}`);

                reuploadButton.addEventListener('click', () => {
                    fileInput.click();
                });

                fileInput.addEventListener('change', async (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        try {
                            const confirmation = await Swal.fire({
                                title: 'Confirm Reupload',
                                text: `Are you sure you want to reupload the file "${displayFileName}"?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Yes, reupload it!',
                            });

                            if (!confirmation.isConfirmed) return;

                            const permitId = reuploadButton.getAttribute('data-permit-id');

                            const storageRef = ref(storage, `reuploads/${auth.currentUser.uid}/buildingPermits/${commentObj.fileName}`);
                            const snapshot = await uploadBytes(storageRef, file);
                            const downloadURL = await getDownloadURL(snapshot.ref);

                            const permitDoc = doc(db, "buildingPermits", permitId);
                            await updateDoc(permitDoc, {
                                [`${commentObj.fileName}URL`]: downloadURL,
                            });

                            await Swal.fire({
                                title: 'Success!',
                                text: 'File reuploaded successfully!',
                                icon: 'success',
                            });
                        } catch (error) {
                            console.error('Error uploading file:', error);
                            await Swal.fire({
                                title: 'Error',
                                text: 'Error reuploading file. Please try again.',
                                icon: 'error',
                            });
                        }
                    }
                });
            }

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        modalBody.appendChild(table);
    }
});





//logs

async function logFirestoreChanges(collectionName, documentId) {
    // Reference to the specific document in the collection
    const docRef = doc(db, collectionName, documentId);
  
    // Listen for real-time updates on the document
    onSnapshot(docRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // Create a log entry with document data, collection name, timestamp, and type of operation
        const logEntry = {
          documentId: docSnapshot.id,
          collection: collectionName,
          data,
          timestamp: new Date().toISOString(),
          operation: "update" // Update this to reflect your operation type if needed
        };
        
        // Write the log entry to the 'logs' collection
        try {
          await addDoc(collection(db, "logs"), logEntry);
          console.log(`Logged change for document ${documentId} in collection ${collectionName}`);
        } catch (error) {
          console.error("Error writing log entry:", error);
        }
      } else {
        console.log(`Document ${collectionName}/${documentId} does not exist.`);
      }
    });
  }

 