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

// forgot password
document.addEventListener('DOMContentLoaded', function() {
    const auth = getAuth(); // Initialize Firebase Auth

    document.getElementById('forgot-password-link').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default link behavior
        const email = document.getElementById('user-email').value; // Get email input

        if (email) {
            // Show confirmation dialog
            const confirmation = confirm('Are you sure you want to reset your password?');

            if (confirmation) {
                // Call Firebase function to send password reset email
                sendPasswordResetEmail(auth, email)
                    .then(() => {
                        alert('Password reset email sent!');
                    })
                    .catch((error) => {
                        console.error('Error sending password reset email:', error);
                        alert('Failed to send reset email. Please check the email address and try again.');
                    });
            } else {
                alert('Password reset canceled.');
            }
        } else {
            alert('Please enter your email address.');
        }
    });
});

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

        // Send email verification
        await sendEmailVerification(user);
        console.log("Verification email sent to:", email);
        alert("A verification email has been sent to your email address. Please verify your email before logging in.");

        // Save user information to Firestore (even before verification)
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            firstName: firstName,
            lastName: lastName,
            email: email,
            avatarUrl: avatarUrl,
            emailVerified: false // Set email verification status to false
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

        // Fetch Building Permits
        const buildingPermitsRef = collection(db, "buildingPermits");
        const buildingPermitsQuery = query(buildingPermitsRef, where("ownerUid", "==", user.uid));
        const buildingPermitsSnapshot = await getDocs(buildingPermitsQuery);

        // Fetch Occupancy Permits
        const occupancyPermitsRef = collection(db, "OccupancyPermits");
        const occupancyPermitsQuery = query(occupancyPermitsRef, where("ownerUid", "==", user.uid));
        const occupancyPermitsSnapshot = await getDocs(occupancyPermitsQuery);

        // Fetch Housing Applications
        const housingApplicationsRef = collection(db, "Housing");
        const housingApplicationsQuery = query(housingApplicationsRef, where("ownerUid", "==", user.uid));
        const housingApplicationsSnapshot = await getDocs(housingApplicationsQuery);

        console.log("Building Permits Query Result:", buildingPermitsSnapshot.empty ? "No documents found." : `Found ${buildingPermitsSnapshot.size} documents`);
        console.log("Occupancy Permits Query Result:", occupancyPermitsSnapshot.empty ? "No documents found." : `Found ${occupancyPermitsSnapshot.size} documents`);
        console.log("Housing Applications Query Result:", housingApplicationsSnapshot.empty ? "No documents found." : `Found ${housingApplicationsSnapshot.size} documents`);

        const createTableRow = (permit, permitType, permitId) => {
            console.log("Creating table row for permit:", permit);
            
            // Owner name logic
            const ownerName = permit.ownerName || permit.householdHeadName || 'Unknown Owner';
        
            // Date logic: fallback to createdAt if issuedOn is not available
            const issuedOnDate = permit.issuedOn || (permit.createdAt ? new Date(permit.createdAt.seconds * 1000).toLocaleDateString() : 'N/A');
        
            // Actions (View Remarks)
            const viewRemarksButton = `
                <a class="btn btn-primary text-white" data-bs-toggle="modal" data-bs-target="#viewRemarks" data-id="${permitId}">
                    <i class="fa-solid fa-comment"></i> Remarks
                </a>
            `;
        
            // Create a new table row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ownerName}</td>
                <td>${permitType}</td>
                <td>${issuedOnDate}</td>
                <td>${permit.status || 'N/A'}</td>
                <td>${viewRemarksButton}</td>
            `;
            
            // Append the row to the table body
            tableBody.appendChild(row);
        };
        

        // Populate Building Permits
        if (!buildingPermitsSnapshot.empty) {
            buildingPermitsSnapshot.forEach((permitDoc) => {
                const permit = permitDoc.data();
                createTableRow(permit, "Building Permit", permitDoc.id);
            });
        }

        // Populate Occupancy Permits
        if (!occupancyPermitsSnapshot.empty) {
            occupancyPermitsSnapshot.forEach((permitDoc) => {
                const permit = permitDoc.data();
                createTableRow(permit, "Certificate of Occupancy", permitDoc.id);
            });
        }

        // Populate Housing Applications
        if (!housingApplicationsSnapshot.empty) {
            housingApplicationsSnapshot.forEach((applicationDoc) => {
                const application = applicationDoc.data();
                createTableRow(application, "Housing Application", applicationDoc.id);
            });
        }

        // If no permits found in both collections
        if (buildingPermitsSnapshot.empty && occupancyPermitsSnapshot.empty && housingApplicationsSnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5">No permits or applications found.</td></tr>';
        }

    } catch (error) {
        console.error("Error fetching permit status:", error);
    } finally {
        document.getElementById('fetching-loading-screen').style.display = 'none';
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