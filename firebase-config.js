// Firebase web config for the Build Lab (project efootballbuild-4a791).
// This is not a secret — Firebase web apps ship it in the page; access is enforced by
// firestore.rules. Leave apiKey empty to run the site without cloud sync.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB9CYU72RqKDNEnS6agqQE9kfAI2jAr2SQ",
  authDomain: "efootballbuild-4a791.firebaseapp.com",
  projectId: "efootballbuild-4a791",
  storageBucket: "efootballbuild-4a791.firebasestorage.app",
  messagingSenderId: "322334277904",
  appId: "1:322334277904:web:50625215c0408c53932595",
};

// The account whose squad is data/players.js. Anyone else who signs in gets an empty
// "My squad" instead of this one. Empty = everyone sees the repo squad.
export const OWNER_UID = "GI1MLGbsl2a81ILmlr88OvtHocm2";
