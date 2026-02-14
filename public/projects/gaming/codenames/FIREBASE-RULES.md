# Firebase Realtime Database Rules

To enable game history functionality, update your Firebase Realtime Database rules:

## Recommended Rules (Secure)

```json
{
  "rules": {
    "games": {
      ".read": true,
      "$gameId": {
        ".write": true,
        "status": {
          ".validate": "newData.isString() && (newData.val() === 'setup' || newData.val() === 'playing' || newData.val() === 'finished')"
        }
      }
    },
    "gameHistory": {
      ".read": true,
      "$gameId": {
        ".write": true,
        ".validate": "newData.hasChildren(['gameId', 'finishedAt', 'winner'])"
      }
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

## Security Improvements

✅ **Scoped writes** - Write access per game ID, not entire collection  
✅ **Field validation** - Status and gameHistory fields are validated  
✅ **Default deny** - Everything else is blocked by `$other`  
✅ **Public read** - Needed for room codes and lobby listings

## How to Apply Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **codenames-game-f4ff8**
3. Navigate to **Realtime Database** > **Rules** tab
4. Replace the rules with the configuration above
5. Click **Publish**

## What Changed vs Your Current Rules

**Added:** `gameHistory` path with validation (your rules were missing this)  
**Kept:** All your existing security (scoped writes, status validation, default deny)

## Testing

After updating rules:
1. Complete a game (trigger win condition or hit assassin)
2. Return to lobby
3. Game should appear in "Game History" section
4. Check browser console for any Firebase permission errors
