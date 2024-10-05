const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Import the custom claims function
const setCustomClaims = require('./AdminPages/customClaims');

// Existing function to assign roles
exports.assignRole = functions.https.onCall(async (data, context) => {
  // Verify that the request is made by an authenticated user with admin privileges
  if (!(context.auth && context.auth.token.admin)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can assign roles.');
  }

  const { email, role } = data;

  try {
    const user = await admin.auth().getUserByEmail(email);

    // Define the custom claims (roles)
    const customClaims = {};
    customClaims[role] = true;

    // Set custom claims for the user
    await admin.auth().setCustomUserClaims(user.uid, customClaims);

    return { message: `Success! ${email} has been given the role of ${role}.` };
  } catch (error) {
    return { error: `Error assigning role: ${error.message}` };
  }
});

// New function to create users
exports.addUser = functions.https.onRequest(async (req, res) => {
  const { firstName, lastName, email, password, accountType } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    // Add user details to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      firstName: firstName,
      lastName: lastName,
      email: email,
      accountType: accountType || 'Applicant',
      enabled: true
    });

    res.status(200).json({ message: 'User created successfully', userId: userRecord.uid });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the custom claims function
exports.setCustomClaims = setCustomClaims;
