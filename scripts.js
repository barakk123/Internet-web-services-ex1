document.getElementById("createSupplyForm").addEventListener("submit", function (event) {
    event.preventDefault();
    // Your existing code for handling the form submission...

    // Additional code to reset the form after submission
    this.reset();
});

function createSupply() {
    const formData = new FormData(document.getElementById("createSupplyForm"));
    const jsonData = {};

    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    fetch("http://localhost:3000/supplies", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("messages").innerText = data.message;
        fetchSupplies(); // Refresh supplies list after creating a new supply
    })
    .catch(error => {
        document.getElementById("messages").innerText = "Error creating supply.";
    });
}

function fetchSupplies() {
    // Your existing code for fetching and displaying supplies...
}



async function fetchSupplies() {
    // כאן אתה יכול להוסיף לוגיקה נוספת לפני או אחרי שאתה שולף את רשימת הספקים מהשרת
    // לדוגמה, הצגת הודעה למשתמש או ניהול שגיאות

    try {
        const response = await fetch('http://localhost:3000/supplies');
        const supplies = await response.json();

        const suppliesList = document.getElementById('supplies-list');
        suppliesList.innerHTML = '';  // Clear previous content

        supplies.forEach(supply => {
            const supplyElement = document.createElement('div');
            supplyElement.textContent = `Name: ${supply.supply_name}, Category: ${supply.category}, Quantity: ${supply.quantity}`;
            suppliesList.appendChild(supplyElement);
        });
    } catch (error) {
        console.error('Error fetching and displaying supplies:', error.message);
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
}
