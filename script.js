import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_FGyYTdIMDQlogkjgHdeahoMMKp9w2Q",
  authDomain: "pure-honey-33616.firebaseapp.com",
  projectId: "pure-honey-33616",
  storageBucket: "pure-honey-33616.firebasestorage.app",
  messagingSenderId: "275030343750",
  appId: "1:275030343750:web:1403062f029c255a4b0a47",
  measurementId: "G-SM6X56RK74"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromFirebase();
    initCartEvents();
    initModalEvents();
});

// 1. Завантаження товарів із Firebase
async function loadProductsFromFirebase() {
    const productsContainer = document.getElementById('products-grid');
    if (!productsContainer) return;

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        
        if (querySnapshot.empty) {
            productsContainer.innerHTML = '<p class="section-desc">Товарів поки немає в наявності.</p>';
            return;
        }

        productsContainer.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productId = doc.id;
            const basePrice = product.price || 250;

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-img">
                    <img src="${product.image || 'img/may-honey.jpg'}" alt="${product.title}">
                </div>
                <div class="product-info">
                    <h3>${product.title}</h3>
                    <p class="product-desc">${product.description}</p>
                    
                    <div class="weight-selector" data-id="${productId}">
                        <label>Оберіть вагу:</label>
                        <div class="weight-options">
                            <button type="button" class="weight-btn active" data-weight="350g" data-price="${basePrice}">350g</button>
                            <button type="button" class="weight-btn" data-weight="700g" data-price="${basePrice * 2}">700g</button>
                            <button type="button" class="weight-btn" data-weight="1kg" data-price="${Math.round(basePrice * 2.8)}">1 кг</button>
                            <button type="button" class="weight-btn" data-weight="3l" data-price="${basePrice * 7}">3 л</button>
                        </div>
                    </div>

                    <div class="product-bottom">
                        <div class="product-price">
                            <span class="price-val" id="price-${productId}">${basePrice}</span> ₴
                        </div>
                        <button class="btn-add-cart" data-id="${productId}" data-title="${product.title}" data-img="${product.image || 'img/may-honey.jpg'}">В кошик</button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(productCard);
        });

        initWeightBtns();
        initAddToCartBtns();

    } catch (error) {
        console.error("Помилка завантаження товарів:", error);
    }
}

// 2. Перемикач ваги та ціни
function initWeightBtns() {
    document.querySelectorAll('.weight-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const parent = e.target.closest('.weight-options');
            parent.querySelectorAll('.weight-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const newPrice = e.target.getAttribute('data-price');
            const cardId = e.target.closest('.weight-selector').getAttribute('data-id');
            document.getElementById(`price-${cardId}`).textContent = newPrice;
        });
    });
}

// 3. Додавання в кошик
function initAddToCartBtns() {
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const id = btn.getAttribute('data-id');
            const title = btn.getAttribute('data-title');
            const img = btn.getAttribute('data-img');
            
            const activeWeightBtn = card.querySelector('.weight-btn.active');
            const weight = activeWeightBtn.getAttribute('data-weight');
            const price = Number(activeWeightBtn.getAttribute('data-price'));

            const cartItemId = `${id}-${weight}`;
            const existingItem = cart.find(item => item.cartItemId === cartItemId);

            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push({ cartItemId, id, title, img, weight, price, qty: 1 });
            }

            updateCartUI();
            openCart();
        });
    });
}

// 4. Оновлення кошика
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-message">Кошик порожній</p>';
        cartCount.textContent = '0';
        cartTotalPrice.textContent = '0';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        count += item.qty;

        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${item.img}" alt="${item.title}">
            <div class="cart-item-details">
                <h4>${item.title} (${item.weight})</h4>
                <p>${item.price} ₴ × ${item.qty} = ${item.price * item.qty} ₴</p>
            </div>
            <button class="remove-item" data-id="${item.cartItemId}">&times;</button>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartCount.textContent = count;
    cartTotalPrice.textContent = total;

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const removeId = e.target.getAttribute('data-id');
            cart = cart.filter(i => i.cartItemId !== removeId);
            updateCartUI();
        });
    });
}

// 5. Логіка відкриття/закриття кошика
function initCartEvents() {
    const trigger = document.getElementById('cart-trigger');
    const overlay = document.getElementById('cart-overlay');
    const sidebar = document.getElementById('cart-sidebar');
    const closeBtn = document.getElementById('close-cart');

    trigger.addEventListener('click', openCart);
    closeBtn.addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);
}

function openCart() {
    document.getElementById('cart-overlay').classList.add('active');
    document.getElementById('cart-sidebar').classList.add('active');
}

function closeCart() {
    document.getElementById('cart-overlay').classList.remove('active');
    document.getElementById('cart-sidebar').classList.remove('active');
}

// 6. Модальне вікно замовлення
function initModalEvents() {
    const checkoutBtn = document.getElementById('checkout-trigger');
    const modal = document.getElementById('checkout-modal');
    const closeModal = document.getElementById('close-modal');
    const orderForm = document.getElementById('order-form');

    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Спочатку додайте товари у кошик!');
            return;
        }
        closeCart();
        modal.classList.add('active');
    });

    closeModal.addEventListener('click', () => modal.classList.remove('active'));

    orderForm.addEventListener('submit', () => {
        let summaryText = cart.map(i => `${i.title} (${i.weight}) x${i.qty} - ${i.price * i.qty}грн`).join('\n');
        let total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

        document.getElementById('hidden-cart-data').value = summaryText;
        document.getElementById('hidden-total-price').value = `${total} ₴`;
    });
}

