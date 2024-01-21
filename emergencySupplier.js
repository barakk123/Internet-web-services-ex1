const fileSystem = require('fs');

class emergencySuppliers {
    constructor(jsonPath) {
        this.jsonPath = jsonPath;
        this.loadData();
    }

    loadData() {
        try {
            const data = fileSystem.readFileSync(this.jsonPath);
            this.data = JSON.parse(data);
        } catch (error) {
            console.error('Error loading data:', error.message);
            // Handle the error (e.g., provide default data)
        }
    }

    saveData() {
        try {
            fileSystem.writeFileSync(this.jsonPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving data:', error.message);
        }
    }

    createSupply(supply) {
        this.data.emergency_supplies.push(supply);
        this.saveData();
    }

    getSupply(supplyName) {
        const foundSupply = this.data.emergency_supplies.find(supply => supply.supply_name === supplyName);
        return foundSupply || null;
    }    

    updateSupply(supplyName, updatedSupply) {
        const index = this.data.emergency_supplies.findIndex(supply => supply.supply_name === supplyName);
    
        if (index !== -1) {
            this.data.emergency_supplies[index] = { ...this.data.emergency_supplies[index], ...updatedSupply };
            this.saveData();
        } else {
            console.error(`Supply with name ${supplyName} not found.`);
        }
    }
    

    deleteSupply(supplyName) {
        const index = this.data.emergency_supplies.findIndex(supply => supply.supply_name === supplyName);
    
        if (index !== -1) {
            this.data.emergency_supplies.splice(index, 1);
            this.saveData();
        } else {
            console.error(`Supply with name ${supplyName} not found.`);
        }
    }
    
}

class EmergencySupplierSession {
    constructor(supply_name, category, unit_price, quantity, expiration_date, supplier, location) {
        this.supply_name = supply_name;
        this.category = category;
        this.unit_price = unit_price;
        this.quantity = quantity;
        this.expiration_date = expiration_date;
        this.supplier = supplier;
        this.location = location;
    }
}

module.exports = {
    emergencySuppliers,
    EmergencySupplierSession,
};