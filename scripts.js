document.getElementById("createSupplyForm").addEventListener("submit", function (event) {
    event.preventDefault();
    this.reset();
});

function handleServerResponse(response) {
    if (response.ok) {
        return response.json();
    } else {
        throw new Error(`Server error: ${response.statusText}`);
    }
}

function createSupply(res) {
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
    .then(handleServerResponse)
    .then(data => {
        document.getElementById("messages").innerText = data.message;
        fetchSupplies(); // Refresh supplies list after creating a new supply
    })
    .catch(error => {
        document.getElementById("messages").innerText = "Error creating supply.";
        if (res) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });
}

async function fetchSupplies() {
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

function updateSupplyKeepTheEmptyVals() {
    const formData = new FormData(document.getElementById("createSupplyForm"));
    const jsonData = {};
    
        formData.forEach((value, key) => {
            // רק אם יש ערך, נוסיף ל־jsonData
            if (value.trim() !== "") {
                jsonData[key] = value;
            }
        });
    
    const supplyName = jsonData.supply_name;

    fetch(`http://localhost:3000/supplies/${encodeURIComponent(supplyName)}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("messages").innerText = data.message;
        fetchSupplies(); // Refresh supplies list after updating a supply
    })
    .catch(error => {
        document.getElementById("messages").innerText = "Error updating supply.";
    });
}

function deleteSupply() {
    const formData = new FormData(document.getElementById("createSupplyForm"));
    const jsonData = {};

    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    const supplyName = jsonData.supply_name;

    fetch(`http://localhost:3000/supplies/${encodeURIComponent(supplyName)}`, {
        method: "DELETE"
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("messages").innerText = data.message;
        fetchSupplies(); // Refresh supplies list after deleting a supply
    })
    .catch(error => {
        document.getElementById("messages").innerText = "Error deleting supply.";
    });
}
