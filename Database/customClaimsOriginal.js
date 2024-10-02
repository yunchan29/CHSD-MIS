const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("./chsd-mis-79b43ccc3955.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chsd-mis.firebaseio.com"
});

// Update custom claims to make a user adminPC
const uidAdminPC = "j84odvl9dhPFr0uBdlk5ZylM5NB3";
admin.auth().setCustomUserClaims(uidAdminPC, { adminPC: true })
    .then(() => {
        console.log(`Successfully updated custom claims for ${uidAdminPC}`);
        // Update Firestore document
        const userRef = admin.firestore().collection('AdminPC').doc(uidAdminPC);
        return userRef.update({
            roles: {
                adminPC: true
            }
        });
    })
    .then(() => {
        console.log(`Successfully updated Firestore document for ${uidAdminPC}`);
    })
    .catch((error) => {
        console.error("Error updating custom claims for adminPC:", error);
    });

// Update custom claims to make another user adminIS
const uidAdminIS = "Yq9U3XqQ21W7kmwzpo7Q7XyV0Dp2";  // Replace with the actual UID for the adminIS user
admin.auth().setCustomUserClaims(uidAdminIS, { adminIS: true })
    .then(() => {
        console.log(`Successfully updated custom claims for ${uidAdminIS}`);
        // Update Firestore document
        const userRef = admin.firestore().collection('AdminIS').doc(uidAdminIS);
        return userRef.update({
            roles: {
                adminIS: true
            }
        });
    })
    .then(() => {
        console.log(`Successfully updated Firestore document for ${uidAdminIS}`);
    })
    .catch((error) => {
        console.error("Error updating custom claims for adminIS:", error);
    });

// Update custom claims to make a user mainAdmin
const uidMainAdmin = "FB2iPd3ZmfRpd0TGbCsBjnje34F3";  // The UID of the user to be set as Main Admin
admin.auth().setCustomUserClaims(uidMainAdmin, { mainAdmin: true })
    .then(() => {
        console.log(`Successfully updated custom claims for ${uidMainAdmin}`);
        // Update Firestore document
        const userRef = admin.firestore().collection('MainAdmin').doc(uidMainAdmin);
        return userRef.update({
            roles: {
                mainAdmin: true
            }
        });
    })
    .then(() => {
        console.log(`Successfully updated Firestore document for ${uidMainAdmin}`);
    })
    .catch((error) => {
        console.error("Error updating custom claims for mainAdmin:", error);
    });
