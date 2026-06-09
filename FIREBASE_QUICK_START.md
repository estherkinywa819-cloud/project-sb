# Quick Start: Enable Firebase Data Sync

## 3-Step Setup (5 minutes)

### 1️⃣ Get Firebase Credentials

1. Go to [firebase.google.com](https://firebase.google.com)
2. Sign in with Google
3. Click **"Go to console"** → Create new project
4. Name it: `university-suggestion-box`
5. After project created, click **"Build"** → **"Realtime Database"**
6. Create database in **Test Mode**
7. Go to **Settings** (⚙️ icon) → **Project Settings**
8. Scroll to **"Your apps"** section
9. Click **Web app** icon and copy your config

Example config (yours will be different):
```javascript
apiKey: "AIzaSyDxC_1a2b3c4d5e6f7g8h9i0j",
authDomain: "my-app-12345.firebaseapp.com",
projectId: "my-app-12345",
storageBucket: "my-app-12345.appspot.com",
messagingSenderId: "123456789012",
appId: "1:123456789012:web:abcdef1234567890"
```

### 2️⃣ Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values with your actual Firebase config.

### 3️⃣ Enable in index.html

In `index.html`, find the Firebase section and **uncomment** these lines:

```html
<!-- Change from -->
<!--
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
...
-->

<!-- To -->
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
...
```

✅ **Done!** Your app now syncs data across devices.

---

## Testing

1. Open app on **Device A** (e.g., desktop)
2. Submit a suggestion
3. Check Firebase Console: **Realtime Database → Data**
4. You should see your post
5. Open app on **Device B** (e.g., phone)
6. The suggestion should appear automatically!

---

## Troubleshooting

**Problem**: "Firebase SDK not loaded"
**Solution**: Make sure Firebase scripts load before script.js

**Problem**: "Permission denied" errors  
**Solution**: Check Firebase Rules allow read/write:
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

**Problem**: Data not showing in Firebase Console
**Solution**: Check browser console (F12) for error messages

---

## More Security (For Production)

Change Firebase Rules to require authentication:

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

Then implement Firebase Authentication in the code.

---

See **FIREBASE_SETUP.md** for detailed setup with screenshots.
