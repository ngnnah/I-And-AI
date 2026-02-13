# 🚀 Deployment Guide for Ito

Quick reference for deploying Ito to GitHub Pages.

## Prerequisites

- [x] Code complete and tested (✅ Done)
- [ ] Firebase project created
- [ ] Firebase config credentials ready

## Step-by-Step Deployment

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name: "ito-game" (or your choice)
4. Disable Google Analytics (not needed for MVP)
5. Create project

### 2. Set Up Realtime Database

1. In Firebase Console → Build → Realtime Database
2. Click "Create Database"
3. Choose location (closest to you)
4. Start in **test mode** for MVP
5. Update rules to:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   ⚠️ **Note**: These rules are for MVP testing only. Add proper security rules before public launch.

### 3. Get Firebase Config

1. In Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps" → Web app
3. If no app exists, click "Add app" → Web
4. Copy the config object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-app.firebaseapp.com",
     databaseURL: "https://your-app.firebaseio.com",
     projectId: "your-project-id",
     storageBucket: "your-app.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123:web:abc123"
   };
   ```

### 4. Update Firebase Config

Edit `projects/gaming/ito/js/game/firebase-config.js`:

```javascript
const firebaseConfig = {
  // Paste your config here
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_APP.firebaseapp.com",
  databaseURL: "https://YOUR_APP.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_APP.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 5. Test Locally

```bash
cd projects/gaming/ito

# Option 1: Open directly in browser
open index.html

# Option 2: Use a local server (recommended)
python3 -m http.server 8000
# Visit: http://localhost:8000

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

**Test checklist:**
- [ ] Create game works
- [ ] Join game with code works
- [ ] Start round generates theme and numbers
- [ ] Host can place players
- [ ] Reveal shows results correctly
- [ ] Next round works
- [ ] Game over shows stats

### 6. Sync to Public Directory

```bash
cd /Users/nhat/repo-fun/I-And-AI

# Sync files to public directory
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='tests' \
  --exclude='vitest.config.js' \
  --exclude='package.json' \
  --exclude='package-lock.json' \
  --exclude='*.test.js' \
  projects/gaming/ito/ public/projects/gaming/ito/
```

**What gets synced:**
- ✅ index.html
- ✅ css/styles.css
- ✅ js/ (all game code)
- ✅ README.md
- ❌ tests/ (excluded)
- ❌ node_modules/ (excluded)

### 7. Force-Add Data Files

Git ignores `data/` directories by default. Force-add them:

```bash
# Add game data files (themes)
git add -f projects/gaming/ito/js/data/*.js
git add -f public/projects/gaming/ito/js/data/*.js
```

### 8. Update Landing Page

Edit `public/index.html` and add Ito to the games section:

```html
<div class="game-card">
  <h3>🎴 Ito</h3>
  <p>Cooperative number game - Get to know each other!</p>
  <p>Play over video call with family and friends. Describe your secret number using creative themes.</p>
  <a href="projects/gaming/ito/" class="btn">Play Ito</a>
</div>
```

### 9. Commit and Push

```bash
# Add all changes
git add projects/gaming/ito/
git add public/projects/gaming/ito/
git add public/index.html

# Commit
git commit -m "feat: add Ito cooperative number game

- Kids mode (1-10) and Adults mode (1-100)
- 55 family-friendly themes across 6 categories
- Host-led placement for easy mobile play
- 100 comprehensive tests
- Full documentation"

# Push to main (triggers GitHub Pages deploy)
git push origin main
```

### 10. Verify Deployment

1. Wait 1-2 minutes for GitHub Actions to complete
2. Visit: `https://ngnnah.github.io/I-And-AI/projects/gaming/ito/`
3. Test all functionality again on live site
4. Test on mobile device

---

## Post-Deployment Testing

### Desktop Testing
- [ ] Chrome: Create and join game
- [ ] Safari: Mobile responsiveness
- [ ] Firefox: Game functionality

### Mobile Testing
- [ ] iPhone: Touch interactions
- [ ] Android: UI rendering
- [ ] iPad: Landscape mode

### Multiplayer Testing
- [ ] 2 players (you + wife)
- [ ] 3-4 players (family)
- [ ] 5-7 players (extended play)

### Gameplay Testing
- [ ] Kids mode (1-10) works correctly
- [ ] Adults mode (1-100) works correctly
- [ ] All themes display properly
- [ ] Number visibility toggle works
- [ ] Placement UI is intuitive
- [ ] Results show correctly
- [ ] Stats track properly

---

## Troubleshooting

### Issue: Firebase not connecting
**Solution**: Check Firebase config credentials, verify databaseURL is correct

### Issue: 404 on page load
**Solution**: 
- Verify files synced to `public/`
- Check relative paths in HTML
- Force-add data files with `git add -f`

### Issue: Game doesn't update in real-time
**Solution**: Check Firebase RTDB rules allow read/write, verify listeners are set up

### Issue: Themes not loading
**Solution**: 
- Check `js/data/themes.js` exists in both `projects/` and `public/`
- Force-add: `git add -f public/projects/gaming/ito/js/data/themes.js`

### Issue: Mobile UI issues
**Solution**: Clear browser cache, check viewport meta tag, test on actual device

---

## Firebase Security Rules (Future)

For production with more users, update Firebase RTDB rules:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": "!data.exists() || data.child('hostId').val() === auth.uid",
        "players": {
          "$playerId": {
            ".write": "$playerId === auth.uid"
          }
        }
      }
    }
  }
}
```

⚠️ **Note**: Requires Firebase Authentication setup.

---

## Quick Commands Reference

```bash
# Test locally
cd projects/gaming/ito && python3 -m http.server 8000

# Run tests
cd projects/gaming/ito && npm test

# Sync to public
rsync -av --delete --exclude='.git' --exclude='node_modules' \
  projects/gaming/ito/ public/projects/gaming/ito/

# Force-add data
git add -f projects/gaming/ito/js/data/*.js
git add -f public/projects/gaming/ito/js/data/*.js

# Deploy
git add . && git commit -m "deploy: update Ito" && git push
```

---

## Success Checklist

- [ ] Firebase project created
- [ ] Config credentials updated
- [ ] Local testing passed
- [ ] Synced to public/
- [ ] Data files force-added
- [ ] Landing page updated
- [ ] Committed and pushed
- [ ] Live site verified
- [ ] Mobile testing done
- [ ] Played with family ✅

**Ready to play!** 🎉
