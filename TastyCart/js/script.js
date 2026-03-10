// ------------------
// Load Saved Data
// ------------------
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let total = JSON.parse(localStorage.getItem("total")) || [];

const API_URL = "http://localhost:3000/foods";

// ------------------
// Fetch Foods
// ------------------
async function fetchFoods() {
  const res = await fetch(API_URL);
  const foods = await res.json();

  renderFoods(foods);

  const skeleton = document.getElementById("skeleton");
  if (skeleton) skeleton.style.display = "none";
}

// ------------------
// Render Foods
// ------------------
function renderFoods(foods) {
  const container = document.getElementById("food-list");
  container.innerHTML = "";

  const favourites = JSON.parse(localStorage.getItem("favourites")) || [];

  foods.forEach(food => {
    const nameKey = food.name.toLowerCase(); // normalize
    const isFav = favourites.includes(nameKey);

    const div = document.createElement("div");
    div.className = "col-md-4 food-item";
    div.dataset.name = nameKey;
    div.dataset.type = food.type;

    div.innerHTML = `
      <div class="food-card h-100">
        <div class="food-img">
          <img src="images/${food.image}" alt="${food.name}">
          <span class="offer-badge">${food.offer}</span>

          <span class="fav-icon ${isFav ? "active" : ""}"
                onclick="toggleFav(this)">
            ${isFav ? "♥" : "♡"}
          </span>
        </div>

        <div class="food-info">
          <h5>${food.restaurant}</h5>
          <div class="food-meta">
            <span class="rating">★ ${food.rating}</span>
            <span>${food.time}</span>
          </div>
          <p class="category">${food.category}</p>
          <p class="location">${food.location}</p>
          <button class="btn btn-danger w-100 mt-2"
                  onclick="addToCart('${food.name}', ${food.price})">
            Add to Cart
          </button>
        </div>
      </div>
    `;

    container.appendChild(div);
  });
}

// ------------------
// Favourite Logic
// ------------------
function toggleFav(el) {
  const foodItem = el.closest(".food-item");
  const nameKey = foodItem.dataset.name; // already lowercase

  let favs = JSON.parse(localStorage.getItem("favourites")) || [];

  if (favs.includes(nameKey)) {
    favs = favs.filter(f => f !== nameKey);
    el.textContent = "♡";
    el.classList.remove("active");
  } else {
    favs.push(nameKey);
    el.textContent = "♥";
    el.classList.add("active");
  }

  localStorage.setItem("favourites", JSON.stringify(favs));
}

// ------------------
// Filters
// ------------------
function filterType(type) {
  document.querySelectorAll(".food-item").forEach(item => {
    const itemType = item.dataset.type;
    item.style.display =
      type === "all" || itemType === type ? "block" : "none";
  });
}

function filterFood() {
  const value = document.getElementById("search").value.toLowerCase();

  document.querySelectorAll(".food-item").forEach(item => {
    item.style.display =
      item.dataset.name.includes(value) ? "block" : "none";
  });
}

// ------------------
// Cart Logic
// ------------------
function addToCart(name, price) {
  const item = cart.find(i => i.name === name);

  if (item) item.qty++;
  else cart.push({ name, price, qty: 1 });

  saveCart();
  updateCart();
}

function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const totalEl = document.getElementById("total");

  cartItems.innerHTML = "";
  total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;

    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";

    li.innerHTML = `
      <div>
        <strong>${item.name}</strong><br>
        ₹${item.price} × ${item.qty}
      </div>

      <div>
        <button class="btn btn-sm btn-secondary"
          onclick="changeQty('${item.name}', -1)">−</button>

        <span class="mx-2">${item.qty}</span>

        <button class="btn btn-sm btn-secondary"
          onclick="changeQty('${item.name}', 1)">+</button>
      </div>
    `;

    cartItems.appendChild(li);
  });

  totalEl.textContent = total;
}

function changeQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.name !== name);

  saveCart();
  updateCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  localStorage.setItem("total", JSON.stringify(total));
}

// ------------------
// Orders Logic
// ------------------
function validateOrder() {
  if (cart.length === 0) {
    alert("Your cart is empty");
    return false;
  }

  let history = JSON.parse(localStorage.getItem("orderHistory")) || [];

  const order = {
    items: [...cart],
    total,
    date: new Date().toLocaleString()
  };

  history.push(order);
  localStorage.setItem("orderHistory", JSON.stringify(history));

  // ✅ Close the order details modal before showing success
  const orderModal = bootstrap.Modal.getInstance(document.getElementById("orderModal"));
  if (orderModal) orderModal.hide();

  showOrderSuccess(order);

  cart = [];
  total = 0;
  localStorage.removeItem("cart");
  localStorage.removeItem("total");

  updateCart();
  renderOrderHistory();
  updateOrderCount();

  return false;
}

function showOrderSuccess(order) {
  const body = document.getElementById("successModalBody");

  body.innerHTML = `
    <p><strong>Total:</strong> ₹${order.total}</p>
    <ul>
      ${order.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join("")}
    </ul>
  `;

  new bootstrap.Modal(document.getElementById("successModal")).show();
}

// ------------------
// Order History
// ------------------
function updateOrderCount() {
  const orders = JSON.parse(localStorage.getItem("orderHistory")) || [];
  document.getElementById("order-count").textContent = orders.length;
}

function renderOrderHistory() {
  const dropdown = document.getElementById("order-history-dropdown");
  const orders = JSON.parse(localStorage.getItem("orderHistory")) || [];

  dropdown.innerHTML = `
    <li class="mb-2">
      <button class="btn btn-sm btn-outline-danger w-100"
              onclick="clearOrderHistory()">
        Clear Order History
      </button>
    </li>
    <hr>
  `;

  if (!orders.length) {
    dropdown.innerHTML += `<li class="text-muted text-center">No orders yet</li>`;
    return;
  }

  orders.slice().reverse().forEach(order => {
    dropdown.innerHTML += `
      <li class="px-2 py-1">
        <small>${order.date}</small>
        <ul>
          ${order.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join("")}
        </ul>
        <strong>Total: ₹${order.total}</strong>
        <hr>
      </li>
    `;
  });
}

function clearOrderHistory() {
  if (!confirm("Clear order history?")) return;
  localStorage.removeItem("orderHistory");
  renderOrderHistory();
  updateOrderCount();
}

// ------------------
// Init
// ------------------
document.addEventListener("DOMContentLoaded", () => {
  fetchFoods();
  updateCart();
  renderOrderHistory();
  updateOrderCount();
});