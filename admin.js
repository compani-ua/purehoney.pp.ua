import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Конфігурація вашого Firebase проєкту
const firebaseConfig = {
  apiKey: "AIzaSyA_FGyYTaIMDQlogkjgHdeahoMHMp9w2Q",
  authDomain: "pure-honey-33616.firebaseapp.com",
  projectId: "pure-honey-33616",
  storageBucket: "pure-honey-33616.firebasestorage.app",
  messagingSenderId: "275030343750",
  appId: "1:275030343750:web:1403062f029c256400a047",
  measurementId: "G-5M0C56RK74"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginBlock = document.getElementById('login-block');
const adminPanel = document.getElementById('admin-panel');

// Відстеження авторизації власнику
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (loginBlock) loginBlock.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
    } else {
        if (loginBlock) loginBlock.style.display = 'block';
        if (adminPanel) adminPanel.style.display = 'none';
    }
});

// Авторизація адміна
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert('Помилка входу: Перевірте Email та пароль');
        }
    });
}

// Вихід
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => signOut(auth));
}

// Додавання нового товару у Firestore
const addProductForm = document.getElementById('add-product-form');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const variants = [];
        const w1 = document.getElementById('w1').value;
        const p1 = document.getElementById('p1').value;
        const w2 = document.getElementById('w2').value;
        const p2 = document.getElementById('p2').value;
        const w3 = document.getElementById('w3').value;
        const p3 = document.getElementById('p3').value;

        if (w1 && p1) variants.push({ weight: w1, price: Number(p1) });
        if (w2 && p2) variants.push({ weight: w2, price: Number(p2) });
        if (w3 && p3) variants.push({ weight: w3, price: Number(p3) });

        const newProduct = {
            name: document.getElementById('prod-name').value,
            description: document.getElementById('prod-desc').value || 'Натуральний якісний мед',
            imageUrl: document.getElementById('prod-image').value,
            variants: variants,
            createdAt: new Date()
        };

        try {
            await addDoc(collection(db, "products"), newProduct);
            alert('Мед успішно додано у каталог!');
            addProductForm.reset();
        } catch (error) {
            alert('Помилка при додаванні: ' + error.message);
        }
    });
}
