// src/firebase.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR KEY",
  authDomain: "YOUR DOMAIN",
  projectId: "YOUR PROJECT ID",
  storageBucket: "YOUR BUCKET",
  messagingSenderId: "YOUR ID",
  appId: "YOUR APP ID"
};

export const app = initializeApp(firebaseConfig);
