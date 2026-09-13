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
        productsContainer.innerHTML = '';

        if (querySnapshot.empty) {
            productsContainer.innerHTML = '<p class="section-desc">Товарів поки немає в наявності.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            product.id = doc.id;
            renderProductCard(product, productsContainer);
        });

        initProductCards();
    } catch (error) {
        console.error("Помилка завантаження товарів:", error);
    }
}

// 2. Рендер картки товару
function renderProductCard(product, container) {
    if (!product.variants || product.variants.length === 0) return;

    const weightButtonsHtml = product.variants.map((v, index) => `
        <button class="weight-btn ${index === 0 ? 'active' : ''}" 
                data-weight="${v.weight}" 
                data-price="${v.price}">
            ${v.weight}
        </button>
    `).join('');

    const firstVariant = product.variants[0];

    const cardHtml = `
        <div class="product-card" data-product-id="${product.id}" data-product-name="${product.name}">
            <div class="product-image">
                <img src="${product.imageUrl}" alt="${product.name}">
            </div>
            <h3>${product.name}</h3>
            <p class="product-meta">${product.description || 'Натуральний якісний мед'}</p>
            <div class="product-middle">
                <div class="product-middle-left">
                    <span class="current-weight-label">Ціна за ${firstVariant.weight}</span>
                    <div class="weight-buttons">${weightButtonsHtml}</div>
                </div>
                <div class="product-price">
                    <span class="price-value">${firstVariant.price}</span> ₴
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-cart add-to-cart-btn">У кошик</button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHtml);
}

// 3. Логіка перемикання ваги та ціни
function initProductCards() {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const weightButtons = card.querySelectorAll('.weight-btn');
        const priceValue = card.querySelector('.price-value');
        const currentWeightLabel = card.querySelector('.current-weight-label');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        
        weightButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                weightButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const price = btn.getAttribute('data-price');
                const weight = btn.getAttribute('data-weight');
                priceValue.textContent = price;
                currentWeightLabel.textContent = `Ціна за ${weight}`;
            });
        });

        addToCartBtn.addEventListener('click', () => {
            const productId = card.getAttribute('data-product-id');
            const productName = card.getAttribute('data-product-name');
            const activeWeightBtn = card.querySelector('.weight-btn.active');
            const selectedWeight = activeWeightBtn.getAttribute('data-weight');
            const selectedPrice = parseInt(activeWeightBtn.getAttribute('data-price'));

            addToCart(productId, productName, selectedWeight, selectedPrice);
        });
    });
}

// 4. Робота з кошиком
function addToCart(id, name, weight, price) {
    const existingItem = cart.find(item => item.id === id && item.weight === weight);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, weight, price, quantity: 1 });
    }
    
    updateCart();
    openCartSidebar();
}

function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalPriceElement = document.getElementById('cart-total-price');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-message">Кошик поки що порожній</p>';
        cartCountBadge.textContent = '0';
        cartTotalPriceElement.textContent = '0';
        return;
    }
    
    let totalItems = 0;
    let totalPrice = 0;
    let html = '';
    
    cart.forEach((item, index) => {
        totalItems += item.quantity;
        totalPrice += (item.price * item.quantity);
        
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.weight} — ${item.price} ₴ / шт.</p>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" data-action="decrease" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" data-action="increase" data-index="${index}">+</button>
                    <button class="cart-item-remove" data-action="remove" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = html;
    cartCountBadge.textContent = totalItems;
    cartTotalPriceElement.textContent = totalPrice;

    cartItemsContainer.querySelectorAll('.qty-btn, .cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget;
            const index = parseInt(target.getAttribute('data-index'));
            const action = target.getAttribute('data-action');

            if (action === 'increase') changeQuantity(index, 1);
            if (action === 'decrease') changeQuantity(index, -1);
            if (action === 'remove') removeCartItem(index);
        });
    });
}

function changeQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    updateCart();
}

function removeCartItem(index) {
    cart.splice(index, 1);
    updateCart();
}

function initCartEvents() {
    const trigger = document.getElementById('cart-trigger');
    const closeBtn = document.getElementById('close-cart');
    const overlay = document.getElementById('cart-overlay');
    
    if (trigger) trigger.addEventListener('click', openCartSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeCartSidebar);
    if (overlay) overlay.addEventListener('click', closeCartSidebar);
}

function openCartSidebar() {
    document.getElementById('cart-sidebar').classList.add('active');
    document.getElementById('cart-overlay').classList.add('active');
}

function closeCartSidebar() {
    document.getElementById('cart-sidebar').classList.remove('active');
    document.getElementById('cart-overlay').classList.remove('active');
}

// 5. Відправка замовлення
function initModalEvents() {
    const checkoutTrigger = document.getElementById('checkout-trigger');
    const modal = document.getElementById('checkout-modal');
    const closeModals = document.querySelectorAll('#close-modal');
    const orderForm = document.getElementById('order-form');

    if (checkoutTrigger) {
        checkoutTrigger.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Ваш кошик порожній! Додайте мед для замовлення.');
                return;
            }
            
            let cartSummaryText = '';
            let totalPrice = 0;
            
            cart.forEach(item => {
                const itemSum = item.price * item.quantity;
                totalPrice += itemSum;
                cartSummaryText += `• ${item.name} (${item.weight}) x ${item.quantity} шт. = ${itemSum} ₴\n`;
            });
            
            document.getElementById('hidden-cart-data').value = cartSummaryText;
            document.getElementById('hidden-total-price').value = `${totalPrice} ₴`;
            
            closeCartSidebar();
            modal.classList.add('active');
        });
    }

    closeModals.forEach(btn => btn.addEventListener('click', () => modal.classList.remove('active')));

    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-order-btn');
            submitBtn.textContent = 'Надсилається...';
            submitBtn.disabled = true;

            const formData = new FormData(orderForm);

            fetch(orderForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            })
            .then(response => {
                if (response.ok) {
                    alert('Дякуємо! Ваше замовлення успішно надіслано.');
                    cart = [];
                    updateCart();
                    orderForm.reset();
                    modal.classList.remove('active');
                } else {
                    alert('Помилка при відправці.');
                }
            })
            .catch(() => alert('Помилка з\'єднання.'))
            .finally(() => {
                submitBtn.textContent = 'Підтвердити та надіслати';
                submitBtn.disabled = false;
            });
        });
    }
}
