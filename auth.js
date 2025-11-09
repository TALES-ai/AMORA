// auth.js — SHARED & BULLETPROOF
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

// === GLOBAL REDIRECTION ===
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    if (!location.pathname.includes('index.html') && !location.pathname.includes('register.html')) {
      location.href = 'index.html';
    }
    return;
  }

  const path = location.pathname;
  const doc = await db.collection('users').doc(user.uid).get();
  const data = doc.exists ? doc.data() : {};

  if (!data.dob || !data.phone) {
    if (!path.includes('complete-profile.html')) location.href = 'complete-profile.html';
    return;
  }

  if (!user.emailVerified) {
    if (!path.includes('verify.html')) location.href = 'verify.html';
    return;
  }

  if (!path.includes('home.html')) location.href = 'home.html';
});

// === GOOGLE SIGN-IN (WORKS ON index & register) ===
function initGoogleSignIn() {
  const googleBtn = document.getElementById('googleBtn');
  if (!googleBtn) return;

  googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(async (result) => {
        const user = result.user;
        if (result.additionalUserInfo.isNewUser) {
          const p = result.additionalUserInfo.profile;
          await db.collection('users').doc(user.uid).set({
            email: user.email,
            firstName: p.given_name || '',
            lastName: p.family_name || '',
            fullName: `${p.given_name || ''} ${p.family_name || ''}`.trim(),
            dob: '',
            phone: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            verified: true,
            onboarded: false
          }, { merge: true });
        }
        // Let global redirect handle flow
      })
      .catch(err => {
        if (err.code !== 'auth/popup-closed-by-user') {
          const msg = document.getElementById('msg');
          if (msg) {
            msg.textContent = 'Google sign-in failed.';
            msg.style.display = 'block';
          }
        }
      });
  };
}

// === RUN PAGE-SPECIFIC LOGIC ===
const page = location.pathname;

if (page.includes('index.html')) {
  const emailIn = document.getElementById('email');
  const passIn = document.getElementById('password');
  const signInBtn = document.getElementById('signInBtn');
  const msg = document.getElementById('msg');
  const forgot = document.getElementById('forgot');

  signInBtn.onclick = () => {
    const email = emailIn.value.trim();
    const pass = passIn.value;
    if (!email || !pass) return showMsg('Enter email and password.');
    auth.signInWithEmailAndPassword(email, pass)
      .catch(err => showMsg(err.code.includes('wrong-password') || err.code.includes('user-not-found') 
        ? 'Invalid email or password.' : 'Sign in failed.'));
  };

  forgot.onclick = (e) => {
    e.preventDefault();
    const email = prompt('Enter your email:');
    if (!email || !email.includes('@')) return showMsg('Enter a valid email.');
    auth.sendPasswordResetEmail(email)
      .then(() => showMsg('Reset link sent. Check inbox + spam.'))
      .catch(() => showMsg('No account found.'));
  };

  function showMsg(text) {
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 5000);
  }

  initGoogleSignIn();
}

if (page.includes('register.html')) {
  // Register logic here (same as before)
  // ... (use your existing register code)
  initGoogleSignIn();
}