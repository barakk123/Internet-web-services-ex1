const http = require('http');
const url = require('url');
const { emergencySuppliers, EmergencySupplierSession } = require('./emergencySupplier');

const emergencySuppliersInstance = new emergencySuppliers('data-base.json');
const port = 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Route to create a new supply
    if (req.method === 'POST' && parsedUrl.pathname === '/supplies') {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            try {
                const newSupplyData = JSON.parse(data);

                // Validate that the request body contains the required fields
                const requiredFields = ['supply_name', 'category', 'unit_price', 'quantity', 'expiration_date', 'supplier', 'location'];
                const missingFields = requiredFields.filter(field => newSupplyData === null || newSupplyData === undefined || !newSupplyData.hasOwnProperty(field));

                if (missingFields.length > 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: `Bad Request - Missing required fields: ${missingFields.join(', ')}.` }));
                    return;
                }

                // Additional validation for numeric fields
                const numericFields = ['unit_price', 'quantity'];
                const invalidNumericFields = numericFields.filter(field => isNaN(newSupplyData[field]) || newSupplyData[field] < 0);

                if (invalidNumericFields.length > 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: `Bad Request - Invalid input: Numeric fields (${invalidNumericFields.join(', ')}) must be non-negative numbers.` }));
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

                emergencySuppliersInstance.createSupply(newSupply);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'New supply created successfully.' }));
            } catch (error) {
                console.error('Error creating supply:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Internal Server Error' }));
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
        }
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
                    return;
                }

                // Additional validation for numeric fields
                const numericFields = ['unit_price', 'quantity'];
                const invalidNumericFields = numericFields.filter(field => updatedSupplyData[field] !== undefined && (isNaN(updatedSupplyData[field]) || updatedSupplyData[field] < 0));

                if (invalidNumericFields.length > 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: `Bad Request - Invalid input: Numeric fields (${invalidNumericFields.join(', ')}) must be non-negative numbers.` }));
                    return;
                }

                const updatedSupply = new EmergencySupplierSession(
                    existingSupply.supply_name,
                    existingSupply.category,
                    existingSupply.unit_price,
                    existingSupply.quantity,
                    existingSupply.expiration_date,
                    existingSupply.supplier,
                    existingSupply.location
                );

                emergencySuppliersInstance.updateSupply(supplyName, updatedSupplyData);
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
            return;
        }

        emergencySuppliersInstance.deleteSupply(supplyName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Supply deleted successfully.' }));
    }

    // Route not found
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not Found.' }));
    }
});

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
