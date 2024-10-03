const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setCustomClaims = functions.https.onRequest((req, res) => {
    const uid = req.body.uid; // User UID
    const claims = req.body.claims; // Example: { isAdmin: true }

    admin.auth().setCustomUserClaims(uid, claims)
        .then(() => {
            res.status(200).send('Custom claims set successfully');
        })
        .catch((error) => {
            console.error('Error setting custom claims:', error);
            res.status(500).send(error);
        });
});
