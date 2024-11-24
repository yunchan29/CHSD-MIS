import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhvoPidRWGeJmnN2E11SBS5n8oyxVLJ0M",
    authDomain: "chsd-mis.firebaseapp.com",
    projectId: "chsd-mis",
    storageBucket: "chsd-mis.appspot.com",
    messagingSenderId: "694967679357",
    appId: "1:694967679357:web:65cffd50f13739f934f414",
    measurementId: "G-XBQTQFRLJ5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fetch unread notifications
export async function fetchUnreadNotifications() {
    try {
        // Retrieve the last checked timestamp from localStorage
        const lastChecked = localStorage.getItem("lastChecked")
            ? Timestamp.fromMillis(Number(localStorage.getItem("lastChecked")))
            : Timestamp.fromDate(new Date(0)); // Default to a very old date

        console.log("Last checked timestamp:", lastChecked.toDate());

        // Check for new notifications in all relevant collections
        const collections = ["buildingPermits", "OccupancyPermits", "ElectricalCert"];
        const promises = collections.map((col) => {
            const colRef = collection(db, col);
            const q = query(colRef, where("createdAt", ">", lastChecked), orderBy("createdAt", "asc"));
            return getDocs(q);
        });

        // Wait for all queries to resolve
        const snapshots = await Promise.all(promises);

        let unreadCount = 0;
        snapshots.forEach((snapshot, index) => {
            console.log(`Collection ${collections[index]}: ${snapshot.size} new documents`);
            unreadCount += snapshot.size;
        });

        return unreadCount;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return 0; // Return 0 if there is an error
    }
}

// Update the badge without marking notifications as read
export async function updateNotificationsBadge() {
    const unreadCount = await fetchUnreadNotifications();

    // Update the badge UI
    const badge = document.getElementById("notification-badge");
    if (!badge) {
        console.error("Notification badge element not found in the DOM.");
        return;
    }

    if (unreadCount >= 1) {
        badge.textContent = unreadCount;
        badge.style.display = "inline-block"; // Show badge
        badge.classList.add("visible"); // Optional: Add a CSS class for visibility
        console.log("Notification badge updated:", unreadCount);
    } 
}

// Mark notifications as read when the badge is clicked
export function markNotificationsAsRead() {
    const now = Timestamp.now();
    localStorage.setItem("lastChecked", now.toMillis());
    console.log("Notifications marked as read:", now.toDate());

    // Hide the badge
    const badge = document.getElementById("notification-badge");
    if (badge) {
        badge.style.display = "inline-block";
       
    }
}

// Ensure DOM is fully loaded before executing the script
document.addEventListener("DOMContentLoaded", () => {
    const badge = document.getElementById("notification-badge");
    if (badge) {
        badge.addEventListener("click", markNotificationsAsRead);
        console.log("Badge click event listener added.");
    } else {
        console.error("Notification badge element not found in DOMContentLoaded.");
    }

    // Update the notification badge
    updateNotificationsBadge();
});
