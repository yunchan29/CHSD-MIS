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

// Export the custom claims function
exports.setCustomClaims = setCustomClaims;
