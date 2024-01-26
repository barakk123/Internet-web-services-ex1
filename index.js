const http = require('http');
const url = require('url');
const console = require('console');
const conf = require('./config');

const { emergencySuppliers, EmergencySupplierSession } = require('./emergencySupplier');

const emergencySuppliersInstance = new emergencySuppliers('data-base.json');

const enableCors = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    next();
};

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


const handleRequests = (req, res) => {
    enableCors(req, res, () => {
        let parsedUrl = url.parse(req.url, true);
        res.setHeader('Access-Control-Allow-Origin', '*');

        console.log(`Received a ${req.method} request to ${parsedUrl.pathname}`);

        // Route to create a new supply
        if (req.method === 'POST' && parsedUrl.pathname === '/supplies') {
            let data = '';

            req.on('data', chunk => {
                data += chunk;
            });

            req.on('end', () => {
                try {
                    const newSupplyData = JSON.parse(data);

                    console.log(`Creating supply: ${newSupplyData.supply_name}`);
                    console.log('Valid expiration date formats: YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD or keep empty');

                    // Validate that the request body contains the required fields
                    const requiredFields = ['supply_name', 'category', 'unit_price', 'quantity', 'supplier', 'location'];
                    const missingFields = requiredFields.filter(field =>
                        !newSupplyData ||
                        !newSupplyData.hasOwnProperty(field) ||
                        (typeof newSupplyData[field] === 'string' && newSupplyData[field].trim() === '')
                    );

                    if (missingFields.length > 0) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: `Bad Request - Missing required fields: ${missingFields.join(', ')}.` }));
                        console.error(`Missing required fields: ${missingFields.join(', ')}.`);
                        return;
                    }

                    // Check if quantity is a non-negative number
                    if (isNaN(newSupplyData.quantity) || newSupplyData.quantity < 0) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Bad Request - Invalid input: Quantity must be a non-negative number.' }));
                        console.error('Invalid input: Quantity must be a non-negative number.');
                        return;
                    }

                    // Additional validation for numeric fields
                    const numericFields = ['unit_price', 'quantity'];
                    const invalidNumericFields = numericFields.filter(field => isNaN(newSupplyData[field]) || newSupplyData[field] < 0);

                    if (invalidNumericFields.length > 0) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: `Bad Request - Invalid input: Numeric fields (${invalidNumericFields.join(', ')}) must be non-negative numbers.` }));
                        console.error(`Invalid input: Numeric fields (${invalidNumericFields.join(', ')}) must be non-negative numbers.`);
                        return;
                    }

                    if (newSupplyData.expiration_date !== undefined) {
                        if (newSupplyData.expiration_date === '') {
                            newSupplyData.expiration_date = null;
                        } else if (!isValidDate(newSupplyData.expiration_date)) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: 'Bad Request - Invalid input: Invalid date format for expiration_date.\nValid expiration date formats: YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD' }));
                            console.error('Invalid input: Invalid date format for expiration_date.');
                            return;
                        }
                    } else {
                        newSupplyData.expiration_date = null;
                    }

                    const existingSupply = emergencySuppliersInstance.getSupply(newSupplyData.supply_name);

                    if (existingSupply) {
                        // If supply with the same name already exists
                        res.writeHead(409, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Conflict - Supply already exists.' }));
                        console.error(`Supply with name ${newSupplyData.supply_name} already exists.`);
                        return;
                    }

                    const newSupply = new EmergencySupplierSession(
                        newSupplyData.supply_name,
                        newSupplyData.category,
                        newSupplyData.unit_price,
                        newSupplyData.quantity,
                        newSupplyData.expiration_date,
                        newSupplyData.supplier,
                        newSupplyData.location
                    );

                    emergencySuppliersInstance.createSupply(newSupply, res);
                    console.log(`Supply with name ${newSupplyData.supply_name} created successfully.`);
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: `Internal Server Error - ${error.message}` }));
                }
            });
        }   

        // Route for the main address
        else if (req.method === 'GET' && parsedUrl.pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Hello, this is the main route!');
        }

        // Route to get a supply by name
        else if (req.method === 'GET' && parsedUrl.pathname.startsWith('/supplies/')) {
            const supplyName = decodeURIComponent(parsedUrl.pathname.slice('/supplies/'.length));
            const supply = emergencySuppliersInstance.getSupply(supplyName);

            if (supply) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(supply));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Supply not found.' }));
                console.error(`Supply with name ${supplyName} not found.`);
            }
        }

        // Route to get supplies
        else if (req.method === 'GET' && parsedUrl.pathname === '/supplies') {
            const allSupplies = emergencySuppliersInstance.getAllSupplies();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(allSupplies));
        }


        // Route to update an existing supply
        else if (req.method === 'PUT' && parsedUrl.pathname.startsWith('/supplies/')) {
            const supplyName = decodeURIComponent(parsedUrl.pathname.slice('/supplies/'.length));

            let data = '';
            req.on('data', chunk => {
                data += chunk;
            });

            req.on('end', () => {
                try {
                    const updatedSupplyData = JSON.parse(data);
                    const existingSupply = emergencySuppliersInstance.getSupply(supplyName);

                    if (!existingSupply) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Supply not found.' }));
                        console.error(`Supply with name ${supplyName} not found.`);
                        return;
                    }
                    
                    // Additional validation for numeric fields
                    const numericFields = ['unit_price', 'quantity'];
                    const invalidNumericFields = numericFields.filter(field => updatedSupplyData[field] !== undefined && (isNaN(updatedSupplyData[field]) || updatedSupplyData[field] < 0));
                    
                    if (invalidNumericFields.length > 0) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: `Bad Request - Invalid input: Numeric fields (${invalidNumericFields.join(', ')}) must be non-negative numbers.` }));
                        console.error(`Invalid input: Numeric fields (${invalidNumericFields.join(', ')}) must be non-negative numbers.`);
                        return;
                    }
                    
                    // Check expiration_date
                    if (updatedSupplyData.expiration_date !== undefined && updatedSupplyData.expiration_date !== null && updatedSupplyData.expiration_date !== '' && !isValidDate(updatedSupplyData.expiration_date)) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Bad Request - Invalid input: Expiration date is not valid.\nValid expiration date formats: YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD or keep empty' }));
                        console.error('Invalid input: Expiration date is not valid.');
                        return;
                    }

                    
                    // Update only the supplied fields
                    Object.keys(updatedSupplyData).forEach(key => {
                        const value = updatedSupplyData[key];

                        // Skip if the value is an empty string
                        if (value === '') {
                            return;
                        }

                        if (key === 'quantity' || key === 'unit_price') {
                            existingSupply[key] = parseFloat(value);
                        } else {
                            existingSupply[key] = value;
                        }
                    });

                    
                    
                    emergencySuppliersInstance.saveData();
                    console.log(`Supply with name ${supplyName} updated successfully.`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Supply updated successfully.' }));
                } catch (error) {
                    console.error('Error updating supply:', error.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Internal Server Error' }));
                }
            });
        }

        // Route to delete an existing supply
        else if (req.method === 'DELETE' && parsedUrl.pathname.startsWith('/supplies/')) {
            const supplyName = decodeURIComponent(parsedUrl.pathname.slice('/supplies/'.length));
            const existingSupply = emergencySuppliersInstance.getSupply(supplyName);

            if (!existingSupply) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Supply not found.' }));
                console.error(`Supply with name ${supplyName} not found.`);
                return;
            }

            emergencySuppliersInstance.deleteSupply(supplyName);
            console.log(`Supply with name ${supplyName} deleted successfully.`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Supply deleted successfully.' }));
        }

        // Route not found
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Not Found.' }));
            console.error(`Route not found: ${parsedUrl.pathname}`);
        }
    });
};

const server = http.createServer(handleRequests);
console.log('Starting the server...');

server.listen(conf.PORT, () => {
    console.log(`Server is running at http://localhost:${conf.PORT}`);
});