# Firebase Realtime Database Rules

To enable game history functionality, update your Firebase Realtime Database rules:

## Rules Configuration

```json
{
  "rules": {
    "games": {
      ".read": true,
      ".write": true
    },
    "gameHistory": {
      ".read": true,
      ".write": true
    }
  }
}
```

## How to Apply Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **codenames-game-f4ff8**
3. Navigate to **Realtime Database** > **Rules** tab
4. Replace the rules with the configuration above
5. Click **Publish**

## Security Note

These rules allow public read/write access, which is acceptable for a game with room codes. For production apps with sensitive data, implement authentication and user-specific rules.

## Testing

After updating rules:
1. Complete a game (trigger win condition or hit assassin)
2. Return to lobby
3. Game should appear in "Game History" section
4. Check browser console for any Firebase permission errors
