// customClaimsOriginal.js
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("./chsd-mis-79b43ccc3955.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chsd-mis.firebaseio.com"
});

// Function to update custom claims for AdminPC
const assignAdminPC = async (uidAdminPC) => {
    await admin.auth().setCustomUserClaims(uidAdminPC, { adminPC: true });
    console.log(`Successfully updated custom claims for ${uidAdminPC}`);
    // Update Firestore document
    const userRef = admin.firestore().collection('AdminPC').doc(uidAdminPC);
    await userRef.update({
        roles: {
            adminPC: true
        }
    });
    console.log(`Successfully updated Firestore document for ${uidAdminPC}`);
};

// Function to update custom claims for AdminIS
const assignAdminIS = async (uidAdminIS) => {
    await admin.auth().setCustomUserClaims(uidAdminIS, { adminIS: true });
    console.log(`Successfully updated custom claims for ${uidAdminIS}`);
    // Update Firestore document
    const userRef = admin.firestore().collection('AdminIS').doc(uidAdminIS);
    await userRef.update({
        roles: {
            adminIS: true
        }
    });
    console.log(`Successfully updated Firestore document for ${uidAdminIS}`);
};

// Function to update custom claims for Main Admin
const assignMainAdmin = async (uidMainAdmin) => {
    await admin.auth().setCustomUserClaims(uidMainAdmin, { mainAdmin: true });
    console.log(`Successfully updated custom claims for ${uidMainAdmin}`);
    // Update Firestore document
    const userRef = admin.firestore().collection('MainAdmin').doc(uidMainAdmin);
    await userRef.update({
        roles: {
            mainAdmin: true
        }
    });
    console.log(`Successfully updated Firestore document for ${uidMainAdmin}`);
};

// Example UIDs for demonstration
const uidAdminPC = "j84odvl9dhPFr0uBdlk5ZylM5NB3"; // Replace with actual UID
const uidAdminIS = "Yq9U3XqQ21W7kmwzpo7Q7XyV0Dp2"; // Replace with actual UID
const uidMainAdmin = "FB2iPd3ZmfRpd0TGbCsBjnje34F3"; // Replace with actual UID

(async () => {
    try {
        await assignAdminPC(uidAdminPC);
        await assignAdminIS(uidAdminIS);
        await assignMainAdmin(uidMainAdmin);
    } catch (error) {
        console.error("Error assigning roles:", error);
    }
})();
