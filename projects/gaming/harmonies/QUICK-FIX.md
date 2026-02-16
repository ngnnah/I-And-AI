# Harmonies - Quick Diagnostic Steps

## Issue: Hex grid not rendering

### Step 1: Check Console for Errors

1. Open Chrome Dev

Tools: `Cmd + Option + J` (Mac) or `F12` (Windows) 2. Refresh the page: `Cmd + R` 3. Look for messages starting with `[BoardRenderer]` 4. Look for any **red error messages**

### Expected Console Output:

```
[BoardRenderer] 🔷 Rendering hex grid: { hexCount: 1, hexKeys: ["0_0"] }
[BoardRenderer] 🔷 Total hexes to render: 7
[BoardRenderer] ✅ Hex grid rendered! Container now has 7 hex elements
```

### Step 2: Check if Hexes Exist in DOM

In Chrome DevTools Console, run:

```javascript
document.getElementById("hex-grid-container").children.length;
```

**Expected:** Should return a number > 0 (e.g., 7 for 1 starting hex + 6 expansion hexes)
**If 0:** Hexes aren't being created
**If > 0:** Hexes exist but might be invisible/off-screen

### Step 3: Check CSS Visibility

In Console, run:

```javascript
const container = document.getElementById("hex-grid-container");
console.log({
  display: getComputedStyle(container).display,
  visibility: getComputedStyle(container).visibility,
  height: getComputedStyle(container).height,
  width: getComputedStyle(container).width,
});
```

**Expected:** `display: "grid"`, `visibility: "visible"`, height/width > 0

### Step 4: Manual Hex Test

Open the test file I created:

```
http://localhost:8080/test-hex-render.html
```

**Expected:** You should see 7 hexagons (1 center + 6 dashed expansion hexes)
**If you see hexes:** CSS works, issue is with game data
**If no hexes:** CSS issue

---

## Possible Issues & Fixes

### Issue A: Firebase Data Not Loading

**Symptom:** Console shows `hexCount: 0` or `hexGrid: {}`

**Fix:** Game state not initializing properly in Firebase

### Issue B: Hexes Created But Invisible

**Symptom:** Console shows `Container now has 7 hex elements` but screen is blank

**Fix:** CSS positioning issue or hexes off-screen

### Issue C: Container Not Found

**Symptom:** Console shows `hex-grid-container element not found`

**Fix:** HTML element ID mismatch

### Issue D: JavaScript Error Before Render

**Symptom:** Red error in console before `[BoardRenderer]` messages

**Fix:** Fix the JavaScript error first

---

## Quick Manual Test

If auto-diagnostics fail, try this:

1. Open Console
2. Paste this code:

```javascript
// Force render a test hex
const container = document.getElementById("hex-grid-container");
if (container) {
  container.innerHTML =
    '<div style="width: 80px; height: 80px; background: red; margin: 100px;">TEST HEX</div>';
  console.log("Test hex added!");
} else {
  console.error("Container not found!");
}
```

**Expected:** You should see a red square labeled "TEST HEX"
**If visible:** Container works, issue is with hex rendering logic
**If not visible:** Container CSS issue or element missing

---

## Report Back

Please share:

1. Console output (any `[BoardRenderer]` messages)
2. Any red error messages
3. Result of `document.getElementById("hex-grid-container").children.length`
4. Whether you can see hexes in `test-hex-render.html`

This will help me pinpoint the exact issue!
