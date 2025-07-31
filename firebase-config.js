// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyAQHj9r8c57128AvWT-o7ha3AbPy4W-0xI",
  authDomain: "datastaffupv2.firebaseapp.com",
  projectId: "datastaffupv2",
  storageBucket: "datastaffupv2.firebasestorage.app",
  messagingSenderId: "754508864683",
  appId: "1:754508864683:web:5fd4e6a5f7205729946bee",
  measurementId: "G-D3RH1HY3VB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
