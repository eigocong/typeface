// Firebase configuration (kept as it is)
const firebaseConfig = {
    apiKey: "AIzaSyDYr-po01nni6Rb_eAC1Tz3CmTBq5w8xhg",
    authDomain: "coding-4405b.firebaseapp.com",
    projectId: "coding-4405b",
    storageBucket: "coding-4405b.firebasestorage.app",
    messagingSenderId: "476128285541",
    appId: "1:476128285541:web:9d54efd7391c7f41ef478c",
    measurementId: "G-HW0WMHLSKF"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const ref = database.ref("chatroom");
const dontKnowRef = database.ref("dontKnowVotes");
const userCountRef = database.ref("userCount");
const currentDivRef = database.ref("currentDivIndex");

// Get references to the DOM elements
const nameInput = document.getElementById("name-input");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const dontKnowButton = document.createElement("button");
dontKnowButton.textContent = "I don't know";
dontKnowButton.className = "dont-know-button";

document.body.appendChild(dontKnowButton);
const chatroom = document.getElementById("chatroom");
const body = document.body;

// Array to store div ids from 1 to 31
const divIds = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
let currentIndex = 0;
let userCount = 0;
let dontKnowVotes = 0;

// Function to show the current div and hide all others
function showCurrentDiv() {
    divIds.forEach((id, index) => {
        const div = document.getElementById(id);
        if (div) {
            div.style.display = index === currentIndex ? "block" : "none";
        }
    });
}

// Firebase listener for the current div index
currentDivRef.on("value", (snapshot) => {
    currentIndex = snapshot.val() || 0;
    showCurrentDiv();
});

// Unified event listener for the send button
sendButton.onclick = function (event) {
    // Prevent the default form submission
    event.preventDefault();

    // Get the values from user input
    const text = { name: nameInput.value.trim(), message: messageInput.value.trim() };

    // Ensure name and message are not empty
    if (text.name && text.message) {
        // Check if the message matches the class of the currently showing div
        const currentDiv = document.getElementById(divIds[currentIndex]);
        const isCorrect = currentDiv && messageInput.value.trim() === currentDiv.className;

        // Push the data to firebase with an indication of correctness
        ref.push({ ...text, isCorrect });

        // If the answer is correct, show the next div and change body background color temporarily
        if (isCorrect) {
            // Clear the message
            messageInput.value = "";

            // Update the current div index in Firebase
            currentIndex = (currentIndex + 1) % divIds.length;
            currentDivRef.set(currentIndex);

            // Change body background color with easing effect for 1 second
            body.style.transition = "background-color 1s ease";
            body.style.backgroundColor = "#00ff99";
            setTimeout(() => {
                body.style.backgroundColor = "";
            }, 1000);
        }
    }
};

// Event listener for the "I don't know" button
dontKnowButton.onclick = function () {
    dontKnowVotes++;
    dontKnowRef.set(dontKnowVotes);
};

// Firebase listener to update the chatroom
ref.on("value", (snapshot) => {
    // Get the data from firebase
    const data = snapshot.val();

    // Clear out the old chatroom HTML
    chatroom.innerHTML = "";

    // Use a for ... in loop to populate the chatroom
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const messageData = data[key];
            const backgroundColor = messageData.isCorrect ? "#00ff99" : "#ffd2d2";
            chatroom.innerHTML += `
                <li style="background-color: ${backgroundColor};">
                <strong>${messageData.name}</strong>:
                ${messageData.message}
                </li>`;
        }
    }

    // Scroll to the bottom of the chatroom
    chatroom.scrollTop = chatroom.scrollHeight;
});

// Firebase listener to keep track of user count
userCountRef.on("value", (snapshot) => {
    userCount = snapshot.val() || 0;
});

// Firebase listener for "I don't know" votes
dontKnowRef.on("value", (snapshot) => {
    dontKnowVotes = snapshot.val() || 0;
    if (dontKnowVotes > userCount / 2) {
        // Reveal the correct answer in the chatroom
        const currentDiv = document.getElementById(divIds[currentIndex]);
        if (currentDiv) {
            chatroom.innerHTML += `
                <li style="background-color: #00ff99;">
                <strong>Correct Answer:</strong>
                ${currentDiv.className}
                </li>`;
            chatroom.scrollTop = chatroom.scrollHeight;
        }
    }
});
