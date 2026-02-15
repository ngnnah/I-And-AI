/**
 * Harmonies - Firebase Configuration
 *
 * Firebase Realtime Database for multiplayer sync
 */

// Firebase configuration (Harmonies v3.0 - Correct database URL)
const firebaseConfig = {
  apiKey: "AIzaSyBEEp5L9Y8vKf0xQJ5X8wQ7jF0y5kV8zY8",
  authDomain: "board-games-fun.firebaseapp.com",
  databaseURL: "https://harmonies-game-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "board-games-fun",
  storageBucket: "board-games-fun.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

// Initialize Firebase (assumes firebase-app.js is loaded via CDN)
let app, database;

export function initializeFirebase() {
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK not loaded. Include firebase CDN scripts in HTML.");
    return null;
  }

  try {
    app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log("Firebase initialized successfully");
    return database;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return null;
  }
}

export function getDatabase() {
  if (!database) {
    return initializeFirebase();
  }
  return database;
}

// Helper to get a database reference
export function ref(path) {
  const db = getDatabase();
  return db ? firebase.database().ref(path) : null;
}

// Helper to get data once
export async function get(reference) {
  if (!reference) return { val: () => null };
  return reference.once("value");
}

// Helper to set data
export async function set(reference, data) {
  if (!reference) return;
  return reference.set(data);
}

// Helper to update data
export async function update(reference, updates) {
  if (!reference) return;
  return reference.update(updates);
}

// Helper to push new data
export function push(reference) {
  if (!reference) return null;
  return reference.push();
}

// Helper to remove data
export async function remove(reference) {
  if (!reference) return;
  return reference.remove();
}

// Helper to listen for value changes
export function onValue(reference, callback) {
  if (!reference) return () => {};
  reference.on("value", callback);
  return () => reference.off("value", callback);
}
