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
const firstNameIn = document.getElementById('firstName');
const lastNameIn = document.getElementById('lastName');
const otherNamesIn = document.getElementById('otherNames');
const dobIn = document.getElementById('dob');
const phoneIn = document.getElementById('phone');
const passwordIn = document.getElementById('password');
const confirmIn = document.getElementById('confirmPassword');
const registerBtn = document.getElementById('registerBtn');
const googleBtn = document.getElementById('googleSignUp');
const messageBox = document.getElementById('message');

function showMessage(text, type = 'error') {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  messageBox.style.display = 'block';
  setTimeout(() => messageBox.style.display = 'none', 7000);
}

function isAdult(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
}

function isStrongPassword(pw) {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
}

registerBtn.addEventListener('click', async () => {
  const email = emailIn.value.trim();
  const password = passwordIn.value;
  const confirm = confirmIn.value;
  const firstName = firstNameIn.value.trim();
  const lastName = lastNameIn.value.trim();
  const otherNames = otherNamesIn.value.trim();
  const dob = dobIn.value;
  const phone = phoneIn.value.trim();

  if (!email || !password || !firstName || !lastName || !dob || !phone) {
    return showMessage('Please fill in all required fields.');
  }
  if (password !== confirm) return showMessage('Passwords do not match.');
  if (!isStrongPassword(password)) return showMessage('Password must be 8+ chars with uppercase + number.');
  if (!isAdult(dob)) return showMessage('You must be 18 or older.');
  if (!/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) return showMessage('Invalid phone.');

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;

    await db.collection('users').doc(user.uid).set({
      personal: {
        firstName,
        lastName,
        otherNames: otherNames || '',
        dob,
        phone,
        email
      },
      contacts: {},
      settings: { notifications: true }
    });

    await user.updateProfile({ displayName: `${firstName} ${lastName}` });
    await user.sendEmailVerification();

    showMessage('Account created! Check email to verify.', 'success');
    setTimeout(() => window.location.href = 'verify.html', 2000);
  } catch (err) {
    showMessage(err.code === 'auth/email-already-in-use' ? 'Email in use.' : 'Registration failed.');
  }
});

googleBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  auth.signInWithPopup(provider)
    .then(async (result) => {
      const user = result.user;
      if (result.additionalUserInfo.isNewUser) {
        await db.collection('users').doc(user.uid).set({
          personal: { email: user.email },
          contacts: {},
          settings: { notifications: true }
        });
        window.location.href = 'complete-profile.html';
      } else {
        window.location.href = 'home.html';
      }
    })
    .catch(() => showMessage('Google sign-up failed.'));
});