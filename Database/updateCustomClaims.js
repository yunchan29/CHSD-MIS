const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("./chsd-mis-firebase-adminsdk-zwcv4-c37b5b4525.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chsd-mis.firebaseio.com"
});    

// Update custom claims to make a user adminPC
const uid = "j84odvl9dhPFr0uBdlk5ZylM5NB3";
admin.auth().setCustomUserClaims(uid, { adminPC: true })
    .then(() => {
        console.log(`Successfully updated custom claims for ${uid}`);
        // Now, you can also update Firestore to reflect this change if needed
        const userRef = admin.firestore().collection('users').doc(uid);
        return userRef.update({
            roles: {
                adminPC: true
            }
        });
    })
    .then(() => {
        console.log(`Successfully updated Firestore document for ${uid}`);
    })
    .catch((error) => {
        console.error("Error updating custom claims:", error);
    });

    