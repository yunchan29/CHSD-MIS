const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./chsd-mis-79b43ccc3955.json'); // Adjusted path to the service account file
const cors = require('cors'); // Import CORS package

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Use the CORS middleware
const corsHandler = cors({ 
    origin: 'http://192.168.100.72:5500', // Your frontend URL
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});

exports.addCustomClaims = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === 'OPTIONS') {
            // Handle the CORS preflight request
            res.set('Access-Control-Allow-Origin', 'http://192.168.100.72:5500');
            res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.set('Access-Control-Allow-Credentials', 'true');
            res.status(204).send(''); // Send back an empty response for OPTIONS requests
            return;
        }

        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const data = req.body;
        const context = { auth: { token: req.headers.authorization } }; // Mocked context for example
        
        // Check if the user has Main Admin permissions
        if (!(context.auth && context.auth.token.mainAdmin)) {
            return res.status(403).send('Only main admins can set custom claims.');
        }

        const uid = data.uid; // User UID
        const accountType = data.accountType; // Account type (e.g., "Permits Officer", "Housing Officer")
        
        let claims = {};
        if (accountType === 'Permits Officer') {
            claims = { isAdmin: true };
            await admin.firestore().collection('AdminPC').doc(uid).set({ isAdmin: true });
        } else if (accountType === 'Housing Officer') {
            claims = { isAdmin: true };
            await admin.firestore().collection('AdminIS').doc(uid).set({ isAdmin: true });
        }

        try {
            await admin.auth().setCustomUserClaims(uid, claims); // Set custom claims

            // Set CORS response headers
            res.set('Access-Control-Allow-Origin', 'http://192.168.100.72:5500');
            res.set('Access-Control-Allow-Credentials', 'true');

            return res.status(200).send({ message: 'Custom claims set successfully' });
        } catch (error) {
            console.error('Error setting custom claims:', error);

            // Set CORS response headers
            res.set('Access-Control-Allow-Origin', 'http://192.168.100.72:5500');
            res.set('Access-Control-Allow-Credentials', 'true');

            return res.status(500).send(error.message);
        }
    });
});
