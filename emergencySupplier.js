const fileSystem = require('fs');

function getMissingFields(supply) {
    const requiredFields = ['supply_name', 'category', 'unit_price', 'quantity', 'supplier', 'location'];
    return requiredFields.filter(field =>
        !supply.hasOwnProperty(field) ||
        supply[field] === null ||
        supply[field] === undefined ||
        (typeof supply[field] === 'string' && supply[field].trim() === '')
    );
}

function getInvalidNumericFields(supply) {
    const numericFields = ['unit_price', 'quantity'];

    return numericFields.filter(field => {
        const value = supply[field];
        const isNumericString = typeof value === 'string' && !isNaN(parseFloat(value));
        return (isNaN(value) || +value < 0) && !isNumericString;
    });
}


function handleValidationError(res, status, message) {
    if (res) {
        console.error(`Bad Request - Invalid input: ${message}`);
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Bad Request - Invalid input: ${message}` }));
        throw new Error(`Bad Request - Invalid input: ${message}`);
    }
}

function handleConflictError(res, status, message) {
    if (res) {
        console.error(`Conflict - ${message}`);
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Conflict - ${message}` }));
        throw new Error(`Conflict - ${message}`);
    }
}

function handleInternalServerError(res, status, message) {
    if (res) {
        console.error(`Internal Server Error - ${message}`);
        return res.status(status).json({ message: `Internal Server Error - ${message}` });
    }
    throw new Error(`Internal Server Error - ${message}`);
}


function isValidDate(dateString) {
    const regex = /^(\d{4}([./-])\d{2}\2\d{2})$/;
    if (!regex.test(dateString)) {
        return false;
    }

    const [year, month, day] = dateString.split(/[-./]/);

    if (parseInt(month, 10) > 12 || parseInt(day, 10) > 31) {
        return false;
    }

    return true;
}

function convertToNumberIfDefined(obj, fields) {
    fields.forEach(field => {
        if (obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
            obj[field] = parseFloat(obj[field]);
        }
    });
}


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
            const missingFields = getMissingFields(supply);
            Object.keys(supply).forEach(key => { if (['quantity', 'unit_price'].includes(key)) supply[key] = parseFloat(supply[key]); });
            if (missingFields.length > 0) {
                handleValidationError(res, `Missing required fields: ${missingFields.join(', ')}`);
                return;
            }
            const existingSupply = this.getSupply(supply.supply_name);
    
            if (existingSupply) {
                // If supply with the same name already exists
                return handleConflictError(res, 409, `Supply with name ${supply.supply_name} already exists.`);
            }
            
            // Additional validation for numeric fields
            const invalidNumericFields = getInvalidNumericFields(supply);
    
            if (invalidNumericFields.length > 0 && invalidNumericFields.every(field => supply[field] === undefined)) {
                handleValidationError(res, `Invalid input: Numeric fields (${invalidNumericFields.join(', ')}) must be non-negative numbers.`);
                return;
            }
    
            // Check expiration_date
            if (supply.expiration_date !== undefined && supply.expiration_date !== null && !isValidDate(supply.expiration_date)) {
                handleValidationError(res, 'Invalid input: Invalid date format for expiration_date.\nValid expiration date formats: YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD');
                return;
            }
    
            const newSupply = new EmergencySupplierSession(
                supply.supply_name,
                supply.category,
                supply.unit_price,
                supply.quantity,
                supply.expiration_date,
                supply.supplier,
                supply.location
            );
    
            this.data.emergency_supplies.push(newSupply);
            this.saveData();
    
            if (res) {
                console.log(`New supply created successfully.`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'New supply created successfully.' }));
            }
        } catch (error) {
            if (res) {
                // Handle other actions for error as needed
                handleInternalServerError(res, error.message);
            }
        }
    }
    
    getAllSupplies() {
        return this.data.emergency_supplies;
    }
    getSupply(supplyName, res) {
        try {
            const foundSupply = this.data.emergency_supplies.find(supply => supply.supply_name === supplyName);
    
            if (foundSupply) {
                return foundSupply;
            } else {
                if (res) {
                    res.status(404).json({ message: 'Not Found - Supply not found.' });
                    console.error(`Supply with name ${supplyName} not found.`);
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
    
             // Remove empty and undefined values
            Object.keys(updatedSupply).forEach(key => (updatedSupply[key] === '' || updatedSupply[key] === undefined) && delete updatedSupply[key]);

            convertToNumberIfDefined(updatedSupply, ['quantity', 'unit_price']);

            const invalidNumericFields = getInvalidNumericFields(updatedSupply);
    
            if (invalidNumericFields.length > 0 && invalidNumericFields.every(field => updatedSupply[field] !== undefined))
            {
                handleValidationError(res, `Invalid input: Numeric fields (${invalidNumericFields.join(', ')}) must be non-negative numbers.`);
                return;
            }

            // Check expiration_date
            if (updatedSupply.expiration_date !== undefined && updatedSupply.expiration_date !== null && !isValidDate(updatedSupply.expiration_date)) {
                console.error('Invalid input: Expiration date is not valid.\nValid expiration date formats: YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD or keep empty');
                return res.status(400).json({ message: 'Bad Request - Invalid input: Expiration date is not valid.\nValid expiration date formats: YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD or keep empty' });
            }
    
            const index = this.data.emergency_supplies.findIndex(supply => supply.supply_name === supplyName);
    
            if (index !== -1) {
                this.data.emergency_supplies[index] = { ...this.data.emergency_supplies[index], ...updatedSupply };
                this.saveData();
                if (res) {
                    console.log(`Supply with name ${supplyName} updated successfully.`);
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
                if (res) {
                    console.error(`Supply with name ${supplyName} not found.`);
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
