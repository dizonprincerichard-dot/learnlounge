import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, increment, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let reportedPosts = [];
let reactedPosts = {};
let currentUsername = "";
let currentUserColor = "#FFA500";

// Quotes per day
const quotes = [
  "📚 Knowledge is power. – Francis Bacon",
  "🛋️ Take a moment for yourself today.",
  "💡 Creativity comes from curiosity.",
  "😊 Happiness is found in small things.",
  "✏️ Learning never exhausts the mind. – Leonardo da Vinci",
  "🌱 Growth begins outside the comfort zone.",
  "💬 Share, connect, and support each other."
];

// Initial load
window.onload = function() {
  document.getElementById("home").style.display = "block";
  document.getElementById("categoryPage").style.display = "none";
  const day = new Date().getDay();
  document.getElementById("quoteOfTheDay").innerText = quotes[day];
  loadCategoryStats();
};

// Load category stats
async function loadCategoryStats(){
  const categories = ["Rants","Academics","Confessions"];
  const stats = {};
  for(let cat of categories){
    const q = query(collection(db,"posts"),where("category","==",cat));
    const snapshot = await getDocs(q);
    stats[cat] = snapshot.size;
  }
  document.getElementById("categoryStats").innerHTML = 
    `Rants: ${stats["Rants"]} | Academics: ${stats["Academics"]} | Confessions: ${stats["Confessions"]}`;
}

// Open category
window.openCategory = function(category){
  currentCategory = category;
  document.getElementById("home").style.display="none";
  document.getElementById("categoryPage").style.display="block";
  document.getElementById("categoryTitle").innerText = category.toUpperCase();
  loadPosts();
};

// Go home
window.goHome = function(){
  document.getElementById("home").style.display="block";
  document.getElementById("categoryPage").style.display="none";
  loadCategoryStats();
};

// Post message
window.postMessage = async function(){
  currentUsername = document.getElementById("username").value || "Anonymous";
  currentUserColor = document.getElementById("userColor").value || "#FFA500";
  const font = document.getElementById("postFont").value;
  const bgColor = document.getElementById("postBg").value;
  const message = document.getElementById("message").value;
  if(message==="") return alert("Write something!");
  for(let word of badWords) if(message.includes(word)) return alert("Inappropriate word detected.");

  const now = new Date();
  await addDoc(collection(db,"posts"),{
    username:currentUsername,
    message,
    category:currentCategory,
    likes:0,
    hearts:0,
    sads:0,
    laughs:0,
    angrys:0,
    cools:0,
    reports:0,
    timestamp: now.toISOString(),
    color: currentUserColor,
    font: font,
    bg: bgColor
  });

  document.getElementById("message").value="";
  loadCategoryStats();
};

// Load posts
function loadPosts(){
  if(!currentCategory) return;
  const postsContainer = document.getElementById("posts");
  const q = query(collection(db,"posts"),where("category","==",currentCategory));

  onSnapshot(q,(snapshot)=>{
    postsContainer.innerHTML="";
    snapshot.forEach((docSnap)=>{
      const data = docSnap.data();
      const postId = docSnap.id;
      const msg = data.message.replace(/#(\w+)/g,'<span class="hashtag">#$1</span>')
                              .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

      let userMenu = '';
      if(data.username===currentUsername){
        userMenu = `
          <div class="menuDots" onclick="toggleMenu('${postId}')">⋮</div>
          <div class="menuContent" id="menu-${postId}">
            <button onclick="editPost('${postId}')">Edit</button>
            <button onclick="deleteOwnPost('${postId}')">Delete</button>
          </div>
        `;
      }

      postsContainer.innerHTML += `
        <div class="post" style="background:${data.bg}; font-family:${data.font}">
          <strong style="color:${data.color}">${data.username}</strong> 
          <small>${new Date(data.timestamp).toLocaleString()}</small>
          ${userMenu}
          <button class="adminDeleteBtn" onclick="deletePostAdmin('${postId}')">Admin Delete</button>
          <p>${msg}</p>
          <div class="reactions">
            <button onclick="react('${postId}','likes')">👍 ${data.likes}</button>
            <button onclick="react('${postId}','hearts')">❤️ ${data.hearts}</button>
            <button onclick="react('${postId}','sads')">😢 ${data.sads}</button>
            <button onclick="react('${postId}','laughs')">😂 ${data.laughs}</button>
            <button onclick="react('${postId}','angrys')">😡 ${data.angrys}</button>
            <button onclick="react('${postId}','cools')">😎 ${data.cools}</button>
            <button onclick="reportPost('${postId}')">🛑 Report</button>
          </div>
        </div>
      `;
    });
  });
}

// Toggle menu
window.toggleMenu = function(id){
  const menu = document.getElementById("menu-"+id);
  menu.style.display = menu.style.display==="block"?"none":"block";
};

// Edit post (own only)
window.editPost = async function(id){
  const newMsg = prompt("Edit your post:");
  if(!newMsg) return;
  await updateDoc(doc(db,"posts",id),{message:newMsg});
};

// Delete own post
window.deleteOwnPost = async function(id){
  if(!confirm("Delete your post?")) return;
  await deleteDoc(doc(db,"posts",id));
};

// Admin delete
window.deletePostAdmin = async function(id){
  const password = prompt("Enter admin password:");
  if(password!=="admin123") return alert("Wrong password.");
  await deleteDoc(doc(db,"posts",id));
};

// Reactions (no toggle)
window.react = async function(id,type){
  if(reactedPosts[id]) return alert("You already reacted!");
  reactedPosts[id] = true;
  const postRef = doc(db,"posts",id);
  await updateDoc(postRef,{[type]:increment(1)});
};

// Report posts
window.reportPost = async function(id){
  if(reportedPosts.includes(id)) return alert("You already reported this post.");
  reportedPosts.push(id);
  const postRef = doc(db,"posts",id);
  const postSnap = await getDocs(postRef);
  const reports = (postSnap.data()?.reports)||0;
  if(reports+1>=5){
    await deleteDoc(postRef);
    alert("Post removed due to reports.");
  } else {
    await updateDoc(postRef,{reports:increment(1)});
  }
};

// Leaderboard
window.showLeaderboard = async function() {
  const container = document.getElementById("leaderboardContainer");
  container.style.display = "block";

  const q = query(collection(db, "posts"), where("category", "==", currentCategory));
  const snapshot = await getDocs(q);
  let postsArr = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const totalReactions = data.likes + data.hearts + data.sads + data.laughs + data.angrys + data.cools;
    postsArr.push({...data, id: docSnap.id, totalReactions});
  });

  postsArr.sort((a,b) => b.totalReactions - a.totalReactions);
  const top10 = postsArr.slice(0,10);

  container.innerHTML = "<h3>🏆 Top 10 Posts</h3>";
  top10.forEach((p,i) => {
    const msg = p.message.replace(/#(\w+)/g,'<span class="hashtag">#$1</span>')
                         .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    container.innerHTML += `
      <div class="post topPost" style="background:${p.bg}; font-family:${p.font}">
        <strong style="color:${p.color}">${i+1}. ${p.username}</strong> 
        <small>${new Date(p.timestamp).toLocaleString()}</small>
        <p>${msg}</p>
        <small>Total Reactions: ${p.totalReactions}</small>
      </div>
    `;
  });
};