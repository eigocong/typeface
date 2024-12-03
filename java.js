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
onlineUsersDiv.style.fontSize = "20px";
onlineUsersDiv.id = "online-users-count";
document.body.insertBefore(onlineUsersDiv, chatroom);


const divIds = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
let currentIndex = 0;
let userCount = 0;
let dontKnowVotes = 0;


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


    if (text.name && text.message) {

        const currentDiv = document.getElementById(divIds[currentIndex]);
        const isCorrect = currentDiv && messageInput.value.trim() === currentDiv.className;


        ref.push({ ...text, isCorrect });


        if (isCorrect) {

            messageInput.value = "";


            currentIndex = (currentIndex + 1) % divIds.length;
            currentDivRef.set(currentIndex);


            body.style.transition = "background-color 1s ease";
            body.style.backgroundColor = "#00ff99";
            setTimeout(() => {
                body.style.backgroundColor = "";
            }, 1000);
        }
    }
};


dontKnowButton.onclick = function () {
    dontKnowVotes++;
    dontKnowRef.set(dontKnowVotes);
};


ref.on("value", (snapshot) => {

    const data = snapshot.val();


    chatroom.innerHTML = "";


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


    chatroom.scrollTop = chatroom.scrollHeight;
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
    alert("Your vote has been received!");
};
