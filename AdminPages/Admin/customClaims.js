// mainAdminClaims.js (Cloud Function)
const functions = require('firebase-functions'); // Import Firebase Functions
const admin = require('firebase-admin'); // Import Firebase Admin SDK
const serviceAccount = require('./chsd-mis-79b43ccc3955.json'); // Adjusted path to the service account file

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Cloud Function to set custom claims for Main Admin
exports.setMainAdminClaims = functions.https.onCall(async (data, context) => {
    // Check if the user is authenticated and has admin privileges
    if (!(context.auth && context.auth.token.mainAdmin)) {
        throw new functions.https.HttpsError('permission-denied', 'Only main admins can set custom claims.');
    }

    const uid = data.uid; // User UID
    const claims = data.claims; // Example: { isAdmin: true }

    try {
        await admin.auth().setCustomUserClaims(uid, claims); // Set custom claims
        return { message: 'Custom claims set successfully' }; // Return success message
    } catch (error) {
        console.error('Error setting custom claims:', error);
        throw new functions.https.HttpsError('internal', error.message); // Return error
    }
});
