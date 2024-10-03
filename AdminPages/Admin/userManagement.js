// userManagement.js
import { auth, db } from './firebaseconfig.js';
import { createUserWithEmailAndPassword, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Function to create new user
async function createUser(email, password, firstName, lastName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Add user details to Firestore
        await setDoc(doc(db, "users", uid), {
            email: email,
            firstName: firstName,
            lastName: lastName,
            accountType: "User",
            enabled: true
        });

        console.log("User created and saved to Firestore");

    } catch (error) {
        console.error("Error creating user:", error);
    }
}

// Function to delete user
async function removeUser(uid) {
    try {
        // Delete user from Firebase Auth
        const user = auth.currentUser;
        await deleteUser(user);

        // Remove user from Firestore
        await deleteDoc(doc(db, "users", uid));

        console.log("User deleted successfully");

    } catch (error) {
        console.error("Error deleting user:", error);
    }
}
