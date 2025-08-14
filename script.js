        /* ---------- Core data & helpers ---------- */
        const initialDishPrices = {
            "Plain Maggi": 30, "Veg Maggi": 50, "Cheese Maggi": 70, "Sweet Corn Maggi": 50, "Chilli Garlic Maggi": 50,
            "Fried Rice": 60, "Paneer Rice": 80, "Chowmein": 50, "Manchurian": 50, "Manchurian Rice": 70, "Schezwan Rice": 70, "Schezwan Chowmein": 60,
            "Franky": 30, "Veg Sandwich": 30, "Paneer Sandwich": 50, "Veg Frankie": 30, "Cheese Frankie": 50, "Paneer Frankie": 50, "Paneer Roll": 50,
            "Masala Sandwich": 40, "Veg Cheese Sandwich": 50, "Cheese Masala Sandwich": 60, "Cheese Garlic Sandwich": 50, "Mexican Sandwich": 60,
            "Bombay Masala": 60, "Corn Cheese": 50, "Mumbai Club Sandwich": 80,
            "Plain Dosa": 20, "Masala Dosa": 30, "Uttapam Dosa": 50, "Cheese Dosa": 50, "Butter Dosa": 40, "Cut piece Dosa": 40,
            "White Sauce Pasta": 70, "Red Sauce Pasta": 70, "Mexican Sauce Pasta": 70,
            "Classic Pizza": 100, "Paneer Pizza": 120, "Sweet Corn Pizza": 120, "Overload Cheese Pizza": 150,
            "Sweet Corn Chilli": 60, "Paneer Chilli": 100, "Soya Chilli": 60, "Pav Bhaji": 50,
            "Cold Coffee": 50, "Strawberry Shake": 70, "Black Current Shake": 70, "Mango Shake": 70, "Oreo Shake": 80, "Kitkat Shake": 80,
            "Blue Lagoon Mojito": 50, "Mint Mojito": 50, "Chole Bhatura": 50, "Samosa (per plate)": 20, "Samosa (per peice)": 10,
            "Aloo Gunda (per plate)": 20, "Pyaaz Vada": 20, "Poha": 20, "Idli": 20, "Sambar Vada": 30, "Bread Pakoda": 10, "Idli Fry": 30,
            "Aloo Paratha": 40, "Gobi Paratha": 40, "Paneer Paratha": 60, "Tea": 5, "Special Tea": 10, "Hot Coffee": 15, "Water bottle": 10,
            "Aloo Patties": 20, "Paneer Patties": 30, "Hot Dog": 40, "Paneer Hot Dog": 50, "Cream Roll": 15, "Samosa Chat": 40,
            "Chips (medium)": 10, "Chips (large)": 20, "Lassi": 30, "Cutlet": 30, "Kachori": 30
        };

        function getStored(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch (e) { return fallback } }
        function setStored(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

        const DISH_KEY = 'dishPrices';
        const HISTORY_KEY = 'orderHistory';
        const ORDERID_KEY = 'orderIdDateKey';

        /* ---------- Initialize data ---------- */
        function ensureInitialData() {
            if (!getStored(DISH_KEY)) {
                setStored(DISH_KEY, initialDishPrices);
            }
        }
        ensureInitialData();

        /* ---------- Utilities ---------- */
        function formatCurrency(n) { return Number(n || 0).toFixed(2) }
        function todayISO() { return new Date().toISOString().slice(0, 10) }
        function generateOrderId() {
            // resets daily (YYYY-MM-DD)
            const today = todayISO();
            const meta = getStored(ORDERID_KEY, { date: today, id: 0 });
            if (meta.date !== today) {
                meta.date = today; meta.id = 1;
            } else meta.id = (meta.id || 0) + 1;
            setStored(ORDERID_KEY, meta);
            return `${today.replace(/-/g, '')}-${String(meta.id).padStart(3, '0')}`;
        }

        /* ---------- DOM refs ---------- */
        const orderBody = document.getElementById('orderBody');
        const overallTotalEl = document.getElementById('overallTotal');
        const addRowBtn = document.getElementById('addRowBtn');
        const dishForm = document.getElementById('dishForm');
        const dishNameInput = document.getElementById('dishName');
        const dishPriceInput = document.getElementById('dishPrice');
        const dishList = document.getElementById('dishList');
        const orderHistoryEl = document.getElementById('orderHistory');
        const saveBtn = document.getElementById('saveBtn');
        const savePdfBtn = document.getElementById('savePdfBtn');
        const clearBtn = document.getElementById('clearBtn');
        const newOrderBtn = document.getElementById('newOrderBtn');
        const exportAllBtn = document.getElementById('exportAllBtn');
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        const todayDateEl = document.getElementById('todayDate');
        const customerNameInput = document.getElementById('customerName');
        const modal = document.getElementById('modal');
        const modalClose = document.getElementById('modalClose');
        const modalBody = document.getElementById('modalBody');
        const modalPrint = document.getElementById('modalPrint');
        const modalSave = document.getElementById('modalSave');

        /* ---------- Autocomplete helpers ---------- */
        function createAutocomplete(input, items) {
            let list;
            input.addEventListener('input', function () {
                closeAllLists();
                const val = this.value.trim();
                if (!val) return;
                list = document.createElement('div');
                list.className = 'autocomplete-items';
                this.parentNode.appendChild(list);
                const filtered = items.filter(d => d.toLowerCase().includes(val.toLowerCase()));
                filtered.forEach(name => {
                    const div = document.createElement('div');
                    // highlight
                    const idx = name.toLowerCase().indexOf(val.toLowerCase());
                    if (idx >= 0) {
                        div.innerHTML = `${name.slice(0, idx)}<strong>${name.slice(idx, idx + val.length)}</strong>${name.slice(idx + val.length)}`;
                    } else div.textContent = name;
                    div.addEventListener('click', () => {
                        input.value = name;
                        closeAllLists();
                        // trigger change for price update if in row
                        const tr = input.closest('tr');
                        if (tr) updatePriceRow(tr);
                    });
                    list.appendChild(div);
                });
            });

            document.addEventListener('click', function (e) { if (e.target !== input) closeAllLists() });

            function closeAllLists() { const els = input.parentNode.querySelectorAll('.autocomplete-items'); els.forEach(x => x.remove()) }
        }

        /* ---------- Order row management ---------- */
        function addOrderRow(data = { dish: '', quantity: 1, price: 0 }) {
            // remove "addRow" element so we can insert before it
            const addRowEl = document.getElementById('addRow');

            const tr = document.createElement('tr');
            tr.className = 'orderRow';
            tr.innerHTML = `
    <td class="sno">-</td>
    <td>
      <div class="autocomplete">
        <input type="text" class="dish-input" placeholder="Type dish name" value="${escapeHtml(data.dish || '')}"/>
      </div>
    </td>
    <td><input type="number" class="qty" min="0" step="1" value="${data.quantity || 0}" /></td>
    <td class="priceCell">Rs. <span class="price">${formatCurrency(data.price)}</span></td>
    <td class="totalCell">Rs. <span class="rowTotal">${formatCurrency((data.quantity || 0) * (data.price || 0))}</span></td>
    <td>
      <button class="small btn secondary deleteRowBtn">Delete</button>
    </td>
  `;
            orderBody.insertBefore(tr, addRowEl);

            // wire up events
            const dishInput = tr.querySelector('.dish-input');
            const qtyInput = tr.querySelector('.qty');
            createAutocomplete(dishInput, Object.keys(getStored(DISH_KEY, {})));

            dishInput.addEventListener('change', () => updatePriceRow(tr));
            dishInput.addEventListener('blur', () => updatePriceRow(tr));
            qtyInput.addEventListener('change', () => updatePriceRow(tr));
            qtyInput.addEventListener('input', () => updatePriceRow(tr));
            tr.querySelector('.deleteRowBtn').addEventListener('click', () => { tr.remove(); refreshSerials(); updateOverall(); });

            refreshSerials();
            updatePriceRow(tr);
        }

        function refreshSerials() {
            const rows = document.querySelectorAll('.orderRow');
            rows.forEach((r, i) => r.querySelector('.sno').textContent = i + 1);
        }

        function updatePriceRow(tr) {
            const dish = tr.querySelector('.dish-input').value.trim();
            const qty = parseFloat(tr.querySelector('.qty').value) || 0;
            const price = getStored(DISH_KEY, {})[dish] || 0;
            tr.querySelector('.price').textContent = formatCurrency(price);
            tr.querySelector('.rowTotal').textContent = formatCurrency(qty * price);
            updateOverall();
        }

        function updateOverall() {
            let total = 0;
            document.querySelectorAll('.orderRow').forEach(tr => {
                total += parseFloat(tr.querySelector('.rowTotal').textContent) || 0;
            });
            overallTotalEl.textContent = formatCurrency(total);
        }

        /* ---------- Admin: menu rendering ---------- */
        function renderDishList() {
            const prices = getStored(DISH_KEY, {});
            dishList.innerHTML = '';
            const names = Object.keys(prices).sort((a, b) => a.localeCompare(b));
            names.forEach(name => {
                const div = document.createElement('div');
                div.className = 'listRow';
                div.innerHTML = `<div><strong>${escapeHtml(name)}</strong><div class="meta">Rs. ${formatCurrency(prices[name])}</div></div>
      <div style="display:flex;gap:6px">
        <button class="small btn secondary editDishBtn" data-name="${escapeHtml(name)}">Edit</button>
        <button class="small btn danger deleteDishBtn" data-name="${escapeHtml(name)}">Delete</button>
      </div>`;
                dishList.appendChild(div);
            });

            // hook buttons
            dishList.querySelectorAll('.editDishBtn').forEach(btn => btn.addEventListener('click', e => {
                const name = e.currentTarget.dataset.name;
                const prices = getStored(DISH_KEY, {});
                dishNameInput.value = name;
                dishPriceInput.value = prices[name];
                dishNameInput.focus();
            }));
            dishList.querySelectorAll('.deleteDishBtn').forEach(btn => btn.addEventListener('click', e => {
                const name = e.currentTarget.dataset.name;
                if (confirm(`Delete "${name}" from menu? This cannot be undone.`)) {
                    const prices = getStored(DISH_KEY, {});
                    delete prices[name];
                    setStored(DISH_KEY, prices);
                    renderDishList();
                }
            }));
        }

        /* ---------- Dish form submit ---------- */
        dishForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = dishNameInput.value.trim();
            const price = parseFloat(dishPriceInput.value);
            if (!name || isNaN(price) || price < 0) return alert('Please provide valid name & price');
            const prices = getStored(DISH_KEY, {});
            prices[name] = price;
            setStored(DISH_KEY, prices);
            dishForm.reset();
            dishNameInput.focus();
            renderDishList();
            // refresh autocomplete for any existing dish-inputs
            document.querySelectorAll('.dish-input').forEach(inp => createAutocomplete(inp, Object.keys(prices)));
        });

        /* ---------- Order history ---------- */
        function saveOrderToHistory(order) {
            const history = getStored(HISTORY_KEY, []);
            history.push(order);
            setStored(HISTORY_KEY, history);
            renderOrderHistory();
        }

        function renderOrderHistory() {
            const history = getStored(HISTORY_KEY, []);
            orderHistoryEl.innerHTML = '';
            if (history.length === 0) { orderHistoryEl.innerHTML = '<div class="muted">No orders yet</div>'; return; }
            // newest first
            history.slice().reverse().forEach(o => {
                const div = document.createElement('div');
                div.className = 'listRow';
                div.innerHTML = `<div>
        <strong>Order #${o.orderId}</strong>
        <div class="meta">${o.date} • Rs. ${formatCurrency(o.total)} ${o.customer ? '• ' + escapeHtml(o.customer) : ''}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="small btn" data-id="${o.orderId}" data-action="view">View</button>
        <button class="small btn secondary" data-id="${o.orderId}" data-action="download">PDF</button>
      </div>`;
                orderHistoryEl.appendChild(div);
            });

            // attach handlers
            orderHistoryEl.querySelectorAll('button').forEach(btn => {
                const aid = btn.dataset.action, id = btn.dataset.id;
                btn.addEventListener('click', () => {
                    if (aid === 'view') openOrderModal(id);
                    if (aid === 'download') downloadOrderPDF(id);
                });
            });
        }

        /* ---------- Modal & order rendering ---------- */
        function openOrderModal(orderId) {
            const history = getStored(HISTORY_KEY, []);
            const order = history.find(x => x.orderId == orderId);
            if (!order) return alert('Order not found');
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            modalBody.innerHTML = renderOrderHtml(order);
            modalPrint.onclick = () => downloadOrderObjectAsPDF(order);
            modalSave.onclick = () => { saveOrderToHistory(Object.assign({}, order)); alert('Order saved again'); };
        }

        modalClose.addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); });

        function renderOrderHtml(order) {
            let items = order.items.map(i => `<tr>
    <td style="padding:6px 8px">${escapeHtml(i.serialNumber)}</td>
    <td style="padding:6px 8px">${escapeHtml(i.dish)}</td>
    <td style="padding:6px 8px">${escapeHtml(i.quantity)}</td>
    <td style="padding:6px 8px">Rs. ${formatCurrency(i.price)}</td>
    <td style="padding:6px 8px">Rs. ${formatCurrency(i.totalPrice)}</td>
  </tr>`).join('');
            return `<div style="font-size:0.95rem">
    <div style="display:flex;justify-content:space-between"><strong>Order #${order.orderId}</strong><span>${order.date}</span></div>
    <div style="margin:8px 0" class="meta">Customer: ${order.customer ? escapeHtml(order.customer) : '<span class="muted">—</span>'} • Total: Rs. ${formatCurrency(order.total)}</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f1f5f9"><th style="padding:8px">Sno</th><th>Dish</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
  </div>`;
        }

        /* ---------- Save & PDF ---------- */
        function collectCurrentOrder() {
            const rows = Array.from(document.querySelectorAll('.orderRow'));
            const items = [];
            rows.forEach((r, i) => {
                const sn = i + 1;
                const dish = r.querySelector('.dish-input').value.trim();
                const qty = parseFloat(r.querySelector('.qty').value) || 0;
                const price = parseFloat(r.querySelector('.price').textContent) || 0;
                const totalPrice = parseFloat(r.querySelector('.rowTotal').textContent) || 0;
                if (!dish) return; // ignore empty
                items.push({ serialNumber: sn, dish, quantity: qty, price, totalPrice });
            });
            const total = items.reduce((s, it) => s + it.totalPrice, 0);
            return { items, total };
        }

        saveBtn.addEventListener('click', () => {
            const { items, total } = collectCurrentOrder();
            if (items.length === 0) return alert('Add at least one dish before saving.');
            const orderId = generateOrderId();
            const order = { orderId, date: todayISO(), items, total: formatCurrency(total), customer: customerNameInput.value.trim() || '' };
            saveOrderToHistory(order);
            alert('Order saved locally.');
        });

        savePdfBtn.addEventListener('click', () => {
            const { items, total } = collectCurrentOrder();
            if (items.length === 0) return alert('Add at least one dish before saving.');
            const orderId = generateOrderId();
            const order = { orderId, date: todayISO(), items, total: formatCurrency(total), customer: customerNameInput.value.trim() || '' };
            downloadOrderObjectAsPDF(order);
            saveOrderToHistory(order);
        });

        function downloadOrderObjectAsPDF(order) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            console.log(order);

            // Add logo (scaled nicely)
            const imgWidth = 60;
            const imgHeight = 20;
            doc.addImage('canteen.png', 'PNG', (210 - imgWidth) / 2, 10, imgWidth, imgHeight);

            // Title
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("Order Bill", 105, 40, { align: "center" });

            // Date
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text("Date: " + new Date().toLocaleString(), 10, 50);

            // Table headers
            let y = 60;
            doc.setFont("helvetica", "bold");
            doc.text("No.", 10, y);
            doc.text("Item", 30, y);
            doc.text("Qty", 110, y);
            doc.text("Price", 130, y);
            doc.text("Total", 160, y);

            // Table data
            doc.setFont("helvetica", "normal");
            order.items.forEach((item, i) => {
                y += 8;
                doc.text((i + 1).toString(), 10, y);
                doc.text(item.dish, 30, y);
                doc.text(item.quantity.toString(), 110, y);
                doc.text(Number(item.price).toFixed(2), 130, y);
                doc.text(Number(item.totalPrice).toFixed(2), 160, y);
            });

            // Total
            y += 10;
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`Overall Total: Rs. ${order.total}`, 10, y);

            doc.save("Restaurant_Bill.pdf");
        }

        /* ---------- Order history PDF by ID ---------- */
        function downloadOrderPDF(orderId) {
            const history = getStored(HISTORY_KEY, []);
            const order = history.find(o => o.orderId == orderId);
            if (!order) return alert('Order not found for PDF');
            downloadOrderObjectAsPDF(order);
        }

        /* ---------- Utility: export all as JSON ---------- */
        exportAllBtn.addEventListener('click', () => {
            const history = getStored(HISTORY_KEY, []);
            const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `order_history_${todayISO()}.json`;
            document.body.appendChild(a); a.click(); a.remove();
        });

        /* ---------- Clear history ---------- */
        clearHistoryBtn.addEventListener('click', () => {
            if (!confirm('Clear full order history? This cannot be undone.')) return;
            setStored(HISTORY_KEY, []);
            renderOrderHistory();
        });

        /* ---------- New order & clear UI ---------- */
        newOrderBtn.addEventListener('click', () => {
            if (!confirm('Start a new order? Current unsaved rows will be cleared.')) return;
            resetOrderUI();
        });

        clearBtn.addEventListener('click', () => {
            if (!confirm('Clear current order rows?')) return;
            resetOrderUI();
        });

        function resetOrderUI() {
            // remove existing order rows
            document.querySelectorAll('.orderRow').forEach(r => r.remove());
            // ensure addRow placeholder present
            if (!document.getElementById('addRow')) {
                const tr = document.createElement('tr'); tr.id = 'addRow';
                tr.innerHTML = `<td colspan="6"><button class="add-btn" id="addRowBtn">+ Add Dish</button></td>`;
                orderBody.appendChild(tr);
            }
            // re-bind addRowBtn
            bindAddRowBtn();
            customerNameInput.value = '';
            overallTotalEl.textContent = '0.00';
        }

        /* ---------- Add row binding ---------- */
        function bindAddRowBtn() {
            const btn = document.getElementById('addRowBtn');
            if (btn) btn.onclick = () => addOrderRow();
        }
        bindAddRowBtn();

        /* ---------- Helpers escape HTML ---------- */
        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
        }

        /* ---------- Modal print from history ---------- */
        /* implemented above in openOrderModal */

        /* ---------- Bootstrapping UI ---------- */
        (function init() {
            todayDateEl.textContent = (new Date()).toLocaleDateString();
            renderDishList();
            renderOrderHistory();
            resetOrderUI();

            // add one empty row for convenience
            addOrderRow({ dish: '', quantity: 1, price: 0 });

            // click events delegated to dynamically created items
            document.addEventListener('click', function (e) {
                if (e.target && e.target.matches('#addRowBtn')) addOrderRow();
            });

            // keyboard: Enter on dish form acts as submit (handled naturally)
        })();
