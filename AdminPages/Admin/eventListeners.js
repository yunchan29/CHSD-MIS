// eventListeners.js
import { createUser, removeUser } from './userManagement.js';

document.addEventListener('DOMContentLoaded', function () {
    // Event listener for creating a user
    const createUserForm = document.querySelector('#createUserForm');
    createUserForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;
        const firstName = document.querySelector('#firstName').value;
        const lastName = document.querySelector('#lastName').value;
        
        createUser(email, password, firstName, lastName);
    });

    // Event listener for deleting a user
    const deleteUserButtons = document.querySelectorAll('.delete-user-btn');
    deleteUserButtons.forEach(button => {
        button.addEventListener('click', function () {
            const uid = this.dataset.uid;
            removeUser(uid);
        });
    });
});
