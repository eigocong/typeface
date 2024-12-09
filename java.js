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
const presenceRef = database.ref(".info/connected");
const onlineUsersRef = database.ref("onlineUsers");
const leaderboardRef = database.ref("leaderboard");


const nameInput = document.getElementById("name-input");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const dontKnowButton = document.createElement("button");
dontKnowButton.textContent = "I don't know";
dontKnowButton.className = "dont-know-button";
document.body.appendChild(dontKnowButton);
const chatroom = document.getElementById("chatroom");
const body = document.body;


const onlineUsersDiv = document.createElement("div");
onlineUsersDiv.style.fontSize = "15px";
onlineUsersDiv.id = "online-users-count";
document.body.insertBefore(onlineUsersDiv, chatroom);


const divIds = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
let currentIndex = 0;
let userCount = 0;
let dontKnowVotes = 0;

divIds.forEach((id) => {
    const div = document.getElementById(id);
    if (div) {
        div.addEventListener("input", () => {
            console.log(`Div ${id} content changed to: ${div.textContent}`);
        });
    }
});


function showCurrentDiv() {
    divIds.forEach((id, index) => {
        const div = document.getElementById(id);
        if (div) {
            div.style.display = index === currentIndex ? "block" : "none";
        }
    });
}


currentDivRef.on("value", (snapshot) => {
    currentIndex = snapshot.val() || 0;
    showCurrentDiv();
});


sendButton.onclick = function (event) {
    event.preventDefault();

    const text = { name: nameInput.value.trim(), message: messageInput.value.trim() };
    const messageInnn = messageInput.value.replaceAll(' ', '-').toUpperCase();

    if (text.name && text.message) {
        const currentDiv = document.getElementById(divIds[currentIndex]);
        const isCorrect = currentDiv && messageInnn.trim() === currentDiv.className;

        ref.push({ ...text, isCorrect });

        if (isCorrect) {
            messageInput.value = "";
            currentIndex = (currentIndex + 1) % divIds.length;
            currentDivRef.set(currentIndex);

            // Update leaderboard
            leaderboardRef.child(text.name).transaction((score) => (score || 0) + 1);

            // Apply background color change
            body.style.transition = "background-color 0.5s ease";
            body.style.backgroundColor = "#00ff99";

            // Clear background color after 1 second
            setTimeout(() => {
                body.style.backgroundColor = "";
            }, 500);
        }
    }
};



dontKnowButton.onclick = function () {
    dontKnowVotes++;
    dontKnowRef.set(dontKnowVotes);
};

document.addEventListener("DOMContentLoaded", function() {
    const editableDivs = document.querySelectorAll('[contenteditable="true"]');
    editableDivs.forEach(div => {
        const caretSpan = document.createElement('span');
        caretSpan.className = 'caret';
        div.insertBefore(caretSpan, div.firstChild);
    });
});


ref.on("value", (snapshot) => {

    const data = snapshot.val();

    chatroom.innerHTML = "";

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const messageData = data[key];
            const liBackgroundColor = messageData.isCorrect ? "#00ff99" : "#ffd2d2";
            chatroom.innerHTML += `
                <li style="position: relative; background-color: ${liBackgroundColor}; padding: 10px; margin-bottom: 8px;">
                    <strong>${messageData.name}</strong>: ${messageData.message}
                </li>`;
        }
    }

    


    setTimeout(() => {
        chatroom.scrollTop = chatroom.scrollHeight;
    }, 100);
});


presenceRef.on("value", (snapshot) => {
    if (snapshot.val()) {

        const userRef = onlineUsersRef.push(true);

        userRef.onDisconnect().remove();
    }
});


onlineUsersRef.on("value", (snapshot) => {
    userCount = snapshot.numChildren();
    userCountRef.set(userCount); 



    onlineUsersDiv.textContent = `Online Users: ${userCount}`;
});


dontKnowRef.on("value", (snapshot) => {
    dontKnowVotes = snapshot.val() || 0;
    if (dontKnowVotes > userCount / 2) {

        const currentDiv = document.getElementById(divIds[currentIndex]);
        if (currentDiv) {
            chatroom.innerHTML += `
                <li style="background-color: #00ff99;">
                <strong>Correct Answer:</strong>
                ${currentDiv.className}
                </li>`;
            chatroom.scrollTop = chatroom.scrollHeight;
        }

        dontKnowVotes = 0;
        dontKnowRef.set(dontKnowVotes);
    }
})

dontKnowButton.onclick = function () {
    dontKnowVotes++;
    dontKnowRef.set(dontKnowVotes);
};


const dontKnowCountDiv = document.getElementById("dont-know-count");

// Update the display of "I don't know" button clicks and online user count
function updateCounts() {
    dontKnowCountDiv.textContent = `${dontKnowVotes}/${userCount}`;
}

// Update counts whenever there's a change in don't know votes or online users
dontKnowRef.on("value", (snapshot) => {
    dontKnowVotes = snapshot.val() || 0;
    updateCounts();
});

onlineUsersRef.on("value", (snapshot) => {
    userCount = snapshot.numChildren();
    updateCounts();
});

// Initial update
updateCounts();


function updateLeaderboard() {
    leaderboardRef.orderByValue().limitToLast(5).on("value", (snapshot) => {
        const data = snapshot.val();
        const leaderboardDiv = document.getElementById("leaderboard");

        // Clear the leaderboard
        leaderboardDiv.innerHTML = "<h3>Leaderboard</h3><ol></ol>";
        const leaderboardList = leaderboardDiv.querySelector("ol");

        // Sort and display the top 5 players
        const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]); // Sort by score in descending order
        entries.forEach(([name, score], index) => {
            const listItem = document.createElement("li");
            const textSpan = document.createElement("em");

            // Apply rainbow animation to the top user
            if (index === 0) {
                textSpan.classList.add("rainbow");
            }

            textSpan.textContent = `${name}: ${score}`;
            listItem.appendChild(textSpan);
            leaderboardList.appendChild(listItem);
        });

        // Handle case where leaderboard is empty
        if (entries.length === 0) {
            const emptyMessage = document.createElement("li");
            emptyMessage.textContent = "No data available";
            leaderboardList.appendChild(emptyMessage);
        }
    });
}


// Initialize real-time leaderboard updates
updateLeaderboard();


function refreshLeaderboard() {
    const leaderboardDiv = document.getElementById("leaderboard");

    // Clear the leaderboard visually
    leaderboardDiv.innerHTML = "<h3>Leaderboard</h3><p>Clearing leaderboard...</p>";

    // Delete leaderboard data from Firebase
    leaderboardRef.set(null).then(() => {
        console.log("Leaderboard data cleared.");

        // Show empty leaderboard message
        leaderboardDiv.innerHTML = "<h3>Leaderboard</h3><ol><li>No data available</li></ol>";

        // Reinitialize the leaderboard listener
        updateLeaderboard();
    }).catch((error) => {
        console.error("Error clearing leaderboard data:", error);
        leaderboardDiv.innerHTML = "<h3>Leaderboard</h3><p>Error clearing data.</p>";
    });
}


// Add event listener to refresh button for clearing leaderboard
document
    .getElementById("refresh-leaderboard-button")
    .addEventListener("click", refreshLeaderboard);










