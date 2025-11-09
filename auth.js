// auth.js
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

const emailIn = document.getElementById('email');
const firstIn = document.getElementById('first');
const lastIn = document.getElementById('last');
const dobIn = document.getElementById('dob');
const phoneIn = document.getElementById('phone');
const passIn = document.getElementById('pass');
const confirmIn = document.getElementById('confirm');
const msg = document.getElementById('msg');
const registerBtn = document.getElementById('registerBtn');
const googleBtn = document.getElementById('googleBtn');

function show(text, type = 'error') {
  msg.textContent = text;
  msg.className = `message ${type}`;
  msg.style.display = 'block';
  setTimeout(() => msg.style.display = 'none', 6000);
}

function isAdult(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
}

function isStrong(pw) {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
}

function isValidPhone(phone) {
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
}

async function saveProfile(user, data) {
  await db.collection('users').doc(user.uid).set({
    email: data.email,
    firstName: data.first,
    lastName: data.last,
    fullName: `${data.first} ${data.last}`.trim(),
    dob: data.dob,
    age: new Date().getFullYear() - new Date(data.dob).getFullYear(),
    phone: data.phone,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    verified: false,
    onboarded: false
  }, { merge: true });
}

// === REDIRECTION ON LOAD ===
auth.onAuthStateChanged(user => {
  if (user) {
    if (user.emailVerified) {
      window.location.href = 'home.html';
    } else {
      window.location.href = 'verify.html';
    }
  }
});

// === EMAIL REGISTER ===
registerBtn.addEventListener('click', async () => {
  const email = emailIn.value.trim();
  const first = firstIn.value.trim();
  const last = lastIn.value.trim();
  const dob = dobIn.value;
  const phone = phoneIn.value.trim();
  const pass = passIn.value;
  const confirm = confirmIn.value;

  if (!email || !first || !last || !dob || !phone || !pass || !confirm) return show('Fill all fields.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return show('Invalid email.');
  if (pass !== confirm) return show('Passwords don’t match.');
  if (!isStrong(pass)) return show('Password: 8+ chars, 1 uppercase, 1 number.');
  if (!isAdult(dob)) return show('You must be 18+.');
  if (!isValidPhone(phone)) return show('Valid phone required (e.g. +1234567890).');

  try {
    const methods = await auth.fetchSignInMethodsForEmail(email);
    if (methods.length > 0) return show('Email already registered.');

    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const user = cred.user;

    await user.updateProfile({ displayName: `${first} ${last}` });
    await saveProfile(user, { email, first, last, dob, phone });
    await user.sendEmailVerification();

    show('Account created! Check your email.', 'success');
    setTimeout(() => window.location.href = 'verify.html', 2000);
  } catch (err) {
    show('Registration failed. Try again.');
  }
});

// === GOOGLE SIGN-UP ===
googleBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(async result => {
      const user = result.user;
      if (result.additionalUserInfo.isNewUser) {
        const p = result.additionalUserInfo.profile;
        await saveProfile(user, {
          email: user.email,
          first: p.given_name || '',
          last: p.family_name || '',
          dob: '',
          phone: ''
        });
        window.location.href = 'complete-profile.html';
      } else {
        window.location.href = 'home.html';
      }
    })
    .catch(() => show('Google sign-up failed.'));
});