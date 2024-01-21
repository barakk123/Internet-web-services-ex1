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
            this.data = { emergency_supplies: [] };
        }
    }

    saveData() {
        try {
            fileSystem.writeFileSync(this.jsonPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving data:', error.message);
        }
    }

    createSupply(supply, res) {
        try {
            // Validate input fields
            if (!supply.supply_name || !supply.category || supply.unit_price === undefined || supply.quantity === undefined || !supply.expiration_date || !supply.supplier || !supply.location) {
                console.error('Invalid input: Missing required fields.');
                if (res) {
                    return res.status(400).json({ message: 'Bad Request - Invalid input: Missing required fields.' });
                }
                return;
            }
    
            // Additional validation for numeric fields
            if (isNaN(supply.unit_price) || isNaN(supply.quantity) || supply.unit_price < 0 || supply.quantity < 0) {
                console.error('Invalid input: Numeric fields (unit_price, quantity) must be non-negative numbers.');
                if (res) {
                    return res.status(400).json({ message: 'Bad Request - Invalid input: Numeric fields (unit_price, quantity) must be non-negative numbers.' });
                }
                return;
            }
    
            const existingSupply = this.getSupply(supply.supply_name);
    
            if (existingSupply) {
                // Return 409 HTTP code with a JSON message
                console.error(`Supply with name ${supply.supply_name} already exists.`);
                if (res) {
                    return res.status(409).json({ message: 'Conflict - Supply already exists.' });
                }
                return;
            }
    
            this.data.emergency_supplies.push(supply);
            this.saveData();
        } catch (error) {
            // Handle other actions for error as needed
            console.error('Error creating supply:', error.message);
            if (res) {
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }
    }    

    getSupply(supplyName, res) {
        try {
            const foundSupply = this.data.emergency_supplies.find(supply => supply.supply_name === supplyName);
    
            if (foundSupply) {
                return foundSupply;
            } else {
                console.error(`Supply with name ${supplyName} not found.`);
                if (res) {
                    res.status(404).json({ message: 'Not Found - Supply not found.' });
                }
                return null;
            }
        } catch (error) {
            console.error('Error retrieving supply:', error.message);
            if (res) {
                res.status(500).json({ message: 'Internal Server Error' });
            }
            return null;
        }
    }
    updateSupply(supplyName, updatedSupply, res) {
        try {
            if (!supplyName || !updatedSupply || Object.keys(updatedSupply).length === 0) {
                throw new Error('Bad Request - Invalid input: Missing required parameters.');
            }
    
            // Additional validation for numeric fields
            ['unit_price', 'quantity'].forEach(field => {
                if (updatedSupply[field] !== undefined && (isNaN(updatedSupply[field]) || updatedSupply[field] < 0)) {
                    throw new Error(`Bad Request - Invalid input: Numeric field (${field}) must be a non-negative number.`);
                }
            });
    
            const index = this.data.emergency_supplies.findIndex(supply => supply.supply_name === supplyName);
    
            if (index !== -1) {
                this.data.emergency_supplies[index] = { ...this.data.emergency_supplies[index], ...updatedSupply };
                this.saveData();
                if (res) {
                    return res.status(200).json({ message: 'Supply updated successfully.' });
                }
            } else {
                throw new Error(`Not Found - Supply with name ${supplyName} not found.`);
            }
        } catch (error) {
            console.error('Error updating supply:', error.message);
            if (res) {
                const statusCode = error.message.includes('Bad Request') ? 400 : (error.message.includes('Not Found') ? 404 : 500);
                return res.status(statusCode).json({ message: error.message });
            }
        }
    }
    
    deleteSupply(supplyName, res) {
        try {
            // Validate input fields
            if (!supplyName) {
                console.error('Invalid input: Missing required parameter (supplyName).');
                if (res) {
                    return res.status(400).json({ message: 'Bad Request - Invalid input: Missing required parameter (supplyName).' });
                }
                return;
            }
    
            const index = this.data.emergency_supplies.findIndex(supply => supply.supply_name === supplyName);
    
            if (index !== -1) {
                this.data.emergency_supplies.splice(index, 1);
                this.saveData();
            } else {
                console.error(`Supply with name ${supplyName} not found.`);
                if (res) {
                    return res.status(404).json({ message: 'Not Found - Supply not found.' });
                }
            }
        } catch (error) {
            // Handle other actions for error as needed
            console.error('Error deleting supply:', error.message);
            if (res) {
                return res.status(500).json({ message: 'Internal Server Error' });
            }
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
