import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBFLh9UrPj9-tZwDuiKmCQrhJzZ_8IXPsk",
  authDomain: "learnlounge-682f5.firebaseapp.com",
  projectId: "learnlounge-682f5",
  storageBucket: "learnlounge-682f5.firebasestorage.app",
  messagingSenderId: "1085021166526",
  appId: "1:1085021166526:web:679257fd1dc1b9d82637ef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentCategory = "";
const badWords = ["badword1","badword2"];

// Create userID if it doesn't exist
if (!localStorage.getItem("userID")) {
    localStorage.setItem("userID", Math.random().toString(36).substring(2,12));
}
const userID = localStorage.getItem("userID");

window.openCategory = function(category) {
    currentCategory = category;
    document.getElementById("home").style.display = "none";
    document.getElementById("categoryPage").style.display = "block";
    document.getElementById("categoryTitle").innerText = category.toUpperCase();
    loadPosts();
};

window.goHome = function() {
    document.getElementById("home").style.display = "flex";
    document.getElementById("categoryPage").style.display = "none";
};

window.postMessage = async function() {
    const username = document.getElementById("username").value || "Anonymous";
    const message = document.getElementById("message").value;
    if (!message) return alert("Write something!");

    for (let word of badWords) {
        if (message.includes(word)) return alert("Inappropriate word detected.");
    }

    const timestamp = new Date();

    await addDoc(collection(db, "posts"), {
        username,
        message,
        category: currentCategory,
        likes: 0,
        hearts: 0,
        sads: 0,
        time: timestamp,
        userID
    });

    document.getElementById("message").value = "";
};

function loadPosts() {
    const postsContainer = document.getElementById("posts");
    const q = query(collection(db,"posts"), where("category","==",currentCategory));

    onSnapshot(q, snapshot => {
        postsContainer.innerHTML = "";
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const timeString = data.time?.toDate ? data.time.toDate().toLocaleString() : new Date(data.time).toLocaleString();
            const isOwner = data.userID === userID;

            postsContainer.innerHTML += `
                <div class="post">
                    <strong>${data.username}</strong>
                    <p id="msg-${docSnap.id}">${data.message}</p>
                    <div class="timestamp">${timeString}</div>
                    <div class="reactions">
                        <button onclick="react('${docSnap.id}','likes')">👍 ${data.likes}</button>
                        <button onclick="react('${docSnap.id}','hearts')">❤️ ${data.hearts}</button>
                        <button onclick="react('${docSnap.id}','sads')">😢 ${data.sads}</button>
                        ${isOwner ? `<button onclick="editPost('${docSnap.id}')">✏️ Edit</button>
                                      <button onclick="deleteOwnPost('${docSnap.id}')">🗑 Delete</button>` : ''}
                    </div>
                </div>
            `;
        });
    });
}

window.react = async function(id,type){
    const postRef = doc(db,"posts",id);
    await updateDoc(postRef, {[type]: increment(1)});
}

window.deleteOwnPost = async function(id){
    if(!confirm("Do you really want to delete this post?")) return;
    await deleteDoc(doc(db,"posts",id));
}

window.editPost = async function(id){
    const msgElement = document.getElementById(`msg-${id}`);
    const newMessage = prompt("Edit your post:", msgElement.innerText);
    if(newMessage === null || newMessage.trim() === "") return;
    await updateDoc(doc(db,"posts",id), {message: newMessage});
}