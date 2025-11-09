// auth.js — SHARED ACROSS ALL PAGES
const firebaseConfig = {
  apiKey: "AIzaSyBvrSpU_UsLdrwsG6h8OrQ2GinKZkP-nps",
  authDomain: "amora-bytales.firebaseapp.com",
  projectId: "amora-bytales",
  storageBucket: "amora-bytales.firebasestorage.app",
  messagingSenderId: "378090826699",
  appId: "1:378090826699:web:cf4cbd3f3b3afe65d5644e",
  measurementId: "G-PB6EX99N2Y"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// === GLOBAL REDIRECTION LOGIC ===
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    if (!window.location.pathname.includes('index.html')) {
      window.location.href = 'index.html';
    }
    return;
  }

  const path = window.location.pathname;

  // Get user doc
  const doc = await db.collection('users').doc(user.uid).get();
  const data = doc.exists ? doc.data() : {};

  // CASE 1: Google user with missing DOB/phone → complete profile
  if (!data.dob || !data.phone) {
    if (!path.includes('complete-profile.html')) {
      window.location.href = 'complete-profile.html';
    }
    return;
  }

  // CASE 2: Email not verified → verify.html
  if (!user.emailVerified) {
    if (!path.includes('verify.html')) {
      window.location.href = 'verify.html';
    }
    return;
  }

  // CASE 3: All good → home
  if (!path.includes('home.html')) {
    window.location.href = 'home.html';
  }
});

// === PAGE-SPECIFIC LOGIC ===
if (window.location.pathname.includes('verify.html')) {
  const emailDisplay = document.getElementById('emailDisplay');
  const resendBtn = document.getElementById('resendBtn');
  const continueBtn = document.getElementById('continueBtn');
  const resendLink = document.getElementById('resendLink');
  const msg = document.getElementById('msg');

  function show(text, type = 'error') {
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 5000);
  }

  // Show email
  auth.onAuthStateChanged(user => {
    if (user) emailDisplay.textContent = user.email;
  });

  // Resend
  async function resend() {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await user.sendEmailVerification();
      show('Verification email sent!', 'success');
    } catch {
      show('Failed to resend. Try later.');
    }
  }

  resendBtn.onclick = resend;
  resendLink.onclick = (e) => { e.preventDefault(); resend(); };

  // Continue
  continueBtn.onclick = () => {
    auth.currentUser.reload().then(() => {
      if (auth.currentUser.emailVerified) {
        window.location.href = 'home.html';
      } else {
        show('Email not verified yet.');
      }
    });
  };

  // Auto-check every 3s
  const interval = setInterval(() => {
    auth.currentUser?.reload().then(() => {
      if (auth.currentUser?.emailVerified) {
        clearInterval(interval);
        show('Email verified! Redirecting...', 'success');
        setTimeout(() => window.location.href = 'home.html', 1500);
      }
    });
  }, 3000);
}