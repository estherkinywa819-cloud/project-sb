// Firebase Configuration
// Replace these with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyBcwhZIm4vk3IFcdP6xfeHBu16E0zQQGv0",
  authDomain: "susggestion-box.firebaseapp.com",
  databaseURL: "https://susggestion-box-default-rtdb.firebaseio.com",
  projectId: "susggestion-box",
  storageBucket: "susggestion-box.firebasestorage.app",
  messagingSenderId: "843235919924",
  appId: "1:843235919924:web:f2642689a7bd862f2b2261"
};

// Initialize Firebase (this assumes Firebase SDK is loaded in HTML)
// Add this to index.html: <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
// Then also add: <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js"></script>

let db = null;
let firebaseEnabled = false;

// Initialize Firebase Database
function initializeFirebase() {
  try {
    const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && !firebaseConfig.apiKey.includes("YOUR_");
    if (!isConfigured) {
      console.warn("Firebase credentials are not configured. Using localStorage only.");
      firebaseEnabled = false;
      return;
    }
    if (typeof firebase !== 'undefined') {
      firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      firebaseEnabled = true;
      console.log("Firebase initialized successfully");
      loadPostsFromFirebase();
    } else {
      console.warn("Firebase SDK not loaded. Using localStorage only.");
      firebaseEnabled = false;
    }
  } catch (error) {
    console.warn("Firebase initialization failed:", error);
    firebaseEnabled = false;
  }
}

// Load posts from Firebase
function loadPostsFromFirebase() {
  if (!firebaseEnabled || !db) return;
  
  db.ref('posts').once('value', (snapshot) => {
    if (snapshot.exists()) {
      const firebasePosts = snapshot.val();
      posts = Object.values(firebasePosts);
      console.log("Posts loaded from Firebase:", posts.length);
    }
  });
}

// Save posts to Firebase (syncs with localStorage)
function savePostsWithFirebase() {
  // Always save to localStorage first
  savePosts();
  
  if (!firebaseEnabled || !db) {
    console.log("Firebase not available, using localStorage only");
    return;
  }
  
  // Also sync to Firebase
  const postsObject = {};
  posts.forEach(post => {
    postsObject[post.id] = post;
  });
  
  db.ref('posts').set(postsObject)
    .then(() => {
      console.log("Posts synced to Firebase");
    })
    .catch((error) => {
      console.error("Firebase sync error:", error);
    });
}

// Real-time listener for Firebase changes
function startRealtimeSync() {
  if (!firebaseEnabled || !db) return;
  
  db.ref('posts').on('value', (snapshot) => {
    if (snapshot.exists()) {
      posts = Object.values(snapshot.val());
      console.log("Received updated posts from Firebase");
      // Re-render if user is viewing the board
      if (!document.getElementById("board")?.classList.contains("hidden")) {
        renderBoard();
      }
      if (!document.getElementById("admin")?.classList.contains("hidden")) {
        renderAdmin();
      }
      if (!document.getElementById("submit")?.classList.contains("hidden")) {
        renderMySubmissions();
      }
    }
  });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeFirebase, loadPostsFromFirebase, savePostsWithFirebase, startRealtimeSync };
}
