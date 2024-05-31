/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();

// Twilio credentials
const accountSid = 'AC61400b5e5c92dcfba1ff121492f04bd8';  // Replace with your Twilio Account SID
const authToken = 'e01b5e15c2ede3b0098f7df260ec3af2';    // Replace with your Twilio Auth Token
const twilioNumber = '+13186978270';  // Replace with your Twilio phone number

const client = new twilio(accountSid, authToken);

exports.sendSmsNotification = functions.https.onCall((data, context) => {
  const { phoneNumber, message } = data;

  return client.messages.create({
    body: message,
    to: phoneNumber,
    from: twilioNumber
  })
  .then((message) => {
    console.log(`Message sent: ${message.sid}`);
    return { success: true };
  })
  .catch((error) => {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  });
});

