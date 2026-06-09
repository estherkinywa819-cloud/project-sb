# Firebase Setup Guide for University Suggestion Box

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `university-suggestion-box`
4. Click **"Continue"**
5. Disable Google Analytics (optional)
6. Click **"Create project"**

## Step 2: Set Up Realtime Database

1. In Firebase Console, click your project
2. Go to **"Build" → "Realtime Database"**
3. Click **"Create Database"**
4. Choose region: `us-central1` (or your region)
5. Start in **"Test mode"** (easier for development)
6. Click **"Enable"**

## Step 3: Get Your Firebase Credentials

1. In Firebase Console, go to **"Project Settings"** (gear icon)
2. Click **"Your apps"** section
3. Click **"Add app"** → **"Web"**
4. Register app as: `suggestion-box-web`
5. Copy the Firebase config object shown

## Step 4: Update firebase-config.js

Replace these values in `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};
```

## Step 5: Update index.html

Add these scripts **before** the closing `</body>` tag:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js"></script>

<!-- Firebase Config -->
<script src="firebase-config.js"></script>

<!-- Main Scripts -->
<script src="script.js"></script>

<!-- Initialize Firebase on page load -->
<script>
  window.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    startRealtimeSync();
  });
</script>
```

## Step 6: Update script.js

In `script.js`, replace all `savePosts()` calls with `savePostsWithFirebase()`:

**Example replacements:**
```javascript
// OLD:
savePosts();

// NEW:
savePostsWithFirebase();
```

**Lines to update:**
- Line 24: In `savePosts()` - NO CHANGE (keep as-is)
- Line 35: First `savePosts()` → `savePostsWithFirebase()`
- Line 138: `savePosts()` → `savePostsWithFirebase()`
- ... and all other instances

## Step 7: Firebase Database Security Rules

⚠️ **Important for production:**

Go to **Firebase Console → Realtime Database → Rules** and set:

```json
{
  "rules": {
    "posts": {
      ".read": true,
      ".write": true
    }
  }
}
```

**⚠️ TEST MODE ONLY!** For production, implement proper authentication:

```json
{
  "rules": {
    "posts": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Step 8: Test the Integration

1. Open your app in Chrome → F12 → Console
2. Check for message: **"Firebase initialized successfully"**
3. Submit a suggestion
4. Check Firebase Console: **Realtime Database → Data**
5. You should see your post in the database

## Step 9: Deploy to GitHub Pages with Firebase

GitHub Pages cannot run Node.js backend, but Firebase Realtime Database works fine!

### Update your deployment:

```bash
git add firebase-config.js
git commit -m "Add Firebase integration"
git push origin main
```

### If deploying to Vercel instead (better for Node.js):

1. Go to [Vercel.com](https://vercel.com)
2. Click **"Import Project"**
3. Select your GitHub repository
4. Add environment variables from Firebase config
5. Click **"Deploy"**

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Firebase SDK not loaded"** | Make sure Firebase scripts are loaded before script.js |
| **"Permission denied" errors** | Check Firebase Rules (may need authentication) |
| **Data not syncing** | Check browser console (F12) for error messages |
| **403 Forbidden** | Firebase Rules are too restrictive; update to test mode |

## Features After Firebase Setup

✅ **Real-time data sync** across all devices  
✅ **Automatic backups** (Firebase stores everything)  
✅ **Scale easily** (Firebase handles millions of users)  
✅ **No server maintenance** required  
✅ **Free tier** includes 100GB database storage  

## Firebase Pricing

- **Free Tier**: 
  - 100GB storage
  - 100 simultaneous connections
  - Good for universities with 500+ users

- **Pay-as-you-go**: $1 per GB stored after free tier

---

**Questions?** Check [Firebase Docs](https://firebase.google.com/docs/database)
