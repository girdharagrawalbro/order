const dishPrices = {
    // Maggi section
    "Plain Maggi": 30,
    "Veg Maggi": 50,
    "Cheese Maggi": 70,
    "Sweet Corn Maggi": 50,
    "Chilli Garlic Maggi": 50,

    // Chinese section
    "Fried Rice": 60,
    "Chowmein": 40,
    "Manchurian": 50,

    // Sandwiches section
    "Franky": 30,
    "Veg Sandwich": 30,
    "Paneer Sandwich": 50,
    "Veg Frankie": 30,
    "Cheese Frankie": 50,
    "Paneer Frankie": 50,
    "Masala Sandwich": 40,
    "Veg Cheese Sandwich": 50,
    "Cheese Masala Sandwich": 60,
    "Cheese Garlic Sandwich": 50,
    "Mexican Sandwich": 60,
    "Bombay Masala": 60,
    "Corn Cheese": 50,
    "Mumbai Club Sandwich": 80,

    // Dosa section
    "Plain Dosa": 20,
    "Masala Dosa": 30,
    "Uttapam Dosa": 40,
    "Cheese Dosa": 50,
    "Butter Dosa": 40,
    "Cut piece Dosa": 35,

    // Pasta section
    "White Sauce Pasta": 70,
    "Red Sauce Pasta": 70,
    "Mexican Sauce Pasta": 70,

    // Pizza section
    "Classic Pizza": 100,
    "Paneer Pizza": 120,
    "Sweet Corn Pizza": 120,
    "Overload Cheese Pizza": 150,

    // Chilli
    "Sweet Corn Chilli": 60,
    "Paneer Chilli": 100,
    "Soya Chilli": 60,
    "Pav Bhaji": 50,

    // Shakes
    "Cold Coffee": 50,
    "Strawberry Shake": 70,
    "Black Current Shake": 70,
    "Mango Shake": 70,
    "Oreo Shake": 80,
    "Kitkat Shake": 80,
    "Blue Lagoon Mojito": 50,
    "Mint Mojito": 50,

    // Breakfast
    "Chole Bhatura": 50,
    "Samosa (per plate)": 20,
    "Aloo Gunda (per plate)": 20,
    "Pyaaz Vada": 20,
    "Poha": 20,
    "Idli": 20,
    "Sambar Vada": 30,
    "Idli Fry": 30,

    // Paratha
    "Aloo Paratha": 40,
    "Gobi Paratha": 40,
    "Paneer Paratha": 60,

    "Tea": 5,
    "Special Tea": 10,
    "Hot Coffee": 15,

    "Water bottle": 10
};

const dishes = Object.keys(dishPrices);

function updatePrice(row) {
    const quantity = row.querySelector(".quantity").value;
    const dish = row.querySelector(".dish-input").value;
    const price = dishPrices[dish] || 0;
    const totalPrice = quantity * price;
    row.querySelector(".price").textContent = price.toFixed(2);
    row.querySelector(".totalPrice").textContent = totalPrice.toFixed(2);
    updateOverallTotal();
}

function updateOverallTotal() {
    const rows = document.querySelectorAll(".orderRow");
    let overallTotal = 0;
    rows.forEach(row => {
        const totalPrice = parseFloat(row.querySelector(".totalPrice").textContent) || 0;
        overallTotal += totalPrice;
    });
    document.querySelector(".overallTotal").textContent = overallTotal.toFixed(2);
}

function addRow() {
    const table = document.querySelector("table tbody");
    const newRow = document.createElement("tr");
    newRow.className = "orderRow";
    const serialNumber = table.querySelectorAll(".orderRow").length + 1;
    newRow.innerHTML = `
        <td><input type="text" class="serialNumber" size="5" value="${serialNumber}" readonly></td>
        <td>
            <div class="autocomplete">
                <input type="text" class="dish-input" placeholder="Type to search..." />
                <div class="autocomplete-items"></div>
            </div>
        </td>
        <td><input type="number" class="quantity" value="0" min="0"></td>
        <td class="price">0.00</td>
        <td class="totalPrice">0.00</td>
        <td><button onclick="deleteRow(this)">Delete</button></td>
    `;
    table.appendChild(newRow);
    newRow.querySelector(".dish-input").addEventListener("input", function () {
        autocomplete(this);
    });
    newRow.querySelector(".quantity").addEventListener("change", function () {
        updatePrice(this.closest('tr'));
    });
}

function deleteRow(button) {
    const row = button.closest('tr');
    row.parentNode.removeChild(row);
    updateOverallTotal();
}

function autocomplete(input) {
    const autocompleteItems = input.parentElement.querySelector(".autocomplete-items");
    const val = input.value;
    autocompleteItems.innerHTML = '';

    if (!val) return false;

    dishes.forEach(dish => {
        if (dish.toLowerCase().includes(val.toLowerCase())) {
            const item = document.createElement("div");
            item.innerHTML = `<strong>${dish.substring(0, val.length)}</strong>${dish.substring(val.length)}`;
            item.innerHTML += `<input type='hidden' value='${dish}'>`;
            item.addEventListener("click", function () {
                input.value = this.getElementsByTagName("input")[0].value;
                updatePrice(input.closest('tr'));
                autocompleteItems.innerHTML = '';
            });
            autocompleteItems.appendChild(item);
        }
    });
}

function generateOrderId() {
    const today = new Date().toLocaleDateString();
    let lastResetDate = localStorage.getItem('lastResetDate');

    if (!lastResetDate || lastResetDate !== today) {
        localStorage.setItem('orderId', '1');
        localStorage.setItem('lastResetDate', today);
        return 1;
    } else {
        let orderId = Number(localStorage.getItem('orderId'));
        orderId++;
        localStorage.setItem('orderId', orderId);
        return orderId;
    }
}

function printBill() {
    const billContent = document.querySelector(".billContent");
    const rows = document.querySelectorAll(".orderRow");
    let billRows = '';

    rows.forEach(row => {
        const serialNumber = row.querySelector(".serialNumber").value;
        const dish = row.querySelector(".dish-input").value;
        const quantity = row.querySelector(".quantity").value;
        const price = row.querySelector(".price").textContent;
        const totalPrice = row.querySelector(".totalPrice").textContent;
        if (dish) {
            billRows += `
                <tr>
                    <td>${serialNumber}</td>
                    <td>${dish}</td>
                    <td>${quantity}</td>
                    <td>${price}</td>
                    <td>${totalPrice}</td>
                </tr>
            `;
        }
    });

    billContent.innerHTML = `
        <p id='orderID'>Order ID: ${generateOrderId()}</p>
        <img src="canteen.png" alt="Restaurant Logo" width="150" height="auto" />
        <p><strong>Bill Details:</strong></p>
        <table style="width: 100%; font-size: 25px;">
            <thead>
                <tr>
                    <th>Serial Number</th>
                    <th>Dish</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${billRows}
            </tbody>
        </table>
        <p class="total">Overall Total: Rs. <span class="overallTotal">${document.querySelector(".overallTotal").textContent}</span></p>
        <button onclick="saveOrderDetails()">Save</button>
    `;

    const printWindow = window.open('', '', 'width=200,height=600');
    printWindow.document.write('<html><head><title>Print Bill</title><style>body { font-size: 18px; margin: 0; } @media print { body { margin: 0; }</style></head><body>');
    printWindow.document.write(`
    <p style="font-weight: bold;">Date: ${new Date().toISOString().slice(0, 10)}</p>
    <img src="canteen.png" alt="Restaurant Logo" width="150" height="auto" />
    <p><strong>Bill Details:</strong></p>
    <table style="width: 50%; font-size: 20px;">
        <thead>
            <tr>
                <th>Sno.</th>
                <th>Dish</th>
                <th>Qnt</th>
            </tr>
        </thead>
        <tbody>
            ${billRows}
        </tbody>
    </table>
    <p class="total">Overall Total: Rs. <span class="overallTotal">${document.querySelector(".overallTotal").textContent}</span></p>
    <p id='orderID'>Order ID: ${generateOrderId()}</p>
`);
    printWindow.document.close();
    printWindow.print();
}

function saveOrderDetails() {
    const orderId = document.querySelector("#orderID").textContent.split(": ")[1];
    const overallTotal = document.querySelector(".overallTotal").textContent;
    const orderRows = Array.from(document.querySelectorAll(".orderRow")).map(row => {
        const cells = row.querySelectorAll("td");
        return [
            cells[0].querySelector(".serialNumber").value,
            cells[1].querySelector(".dish-input").value,
            cells[2].querySelector(".quantity").value,
            cells[3].textContent,
            cells[4].textContent
        ];
    });

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Order ID: ${orderId}`, 10, 10);
    doc.text(`Date: ${new Date().toISOString().slice(0, 10)}`, 10, 20);
    doc.setFontSize(14);
    doc.text("Serial Number, Dish, Quantity, Price per Unit, Total Price", 10, 30);
    orderRows.forEach((row, index) => {
        doc.text(row.join(", "), 10, 40 + index * 10);
    });
    doc.text(`Overall Total: ${overallTotal}`, 10, 40 + orderRows.length * 10);

    const now = new Date();
    const timezoneOffsetInMilliseconds = now.getTimezoneOffset() * 60 * 1000;
    const adjustedDate = new Date(now.getTime() - timezoneOffsetInMilliseconds);
    const currentDate = adjustedDate.toISOString().slice(0, 10);
    doc.save(`Order_${orderId}_${currentDate}.pdf`);
}