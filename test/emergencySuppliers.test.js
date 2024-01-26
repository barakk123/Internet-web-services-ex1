const { emergencySuppliers, EmergencySupplierSession } = require('../emergencySupplier');

describe('Emergency Suppliers CRUD Operations', () => {
    let emergencySuppliersInstance;

    beforeEach(() => {
        // Set up a new instance before each test
        emergencySuppliersInstance = new emergencySuppliers('data-base.json');
    });

    test('Create a new supply', () => {
        const newSupply = new EmergencySupplierSession(
            'Test Supply',
            'Test Category',
            10.99,
            50,
            '2024-12-31',
            'Test Supplier',
            'Test Location'
        );

        const resMock = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        emergencySuppliersInstance.createSupply(newSupply, resMock);

        const savedSupply = emergencySuppliersInstance.getSupply('Test Supply');
        expect(savedSupply).toEqual(newSupply);
    });

    test('Update an existing supply', () => {
        const existingSupply = {
            supply_name: 'Existing Supply',
            category: 'Existing Category',
            unit_price: 15.99,
            quantity: 30,
            expiration_date: '2023-06-30',
            supplier: 'Existing Supplier',
            location: 'Existing Location',
        };

        emergencySuppliersInstance.createSupply(existingSupply);

        const updatedSupply = {
            quantity: 50,
            location: 'Updated Location',
        };

        emergencySuppliersInstance.updateSupply('Existing Supply', updatedSupply);

        const savedSupply = emergencySuppliersInstance.getSupply('Existing Supply');
        expect(savedSupply.quantity).toEqual('50');
        expect(savedSupply.location).toEqual('Updated Location');
    });

    test('Delete an existing supply', () => {
        emergencySuppliersInstance.deleteSupply('Existing Supply');
        const deletedSupply = emergencySuppliersInstance.getSupply('Existing Supply');
        expect(deletedSupply).toBeNull();
    });

    test('Get an existing supply', () => {
        const existingSupply = {
            supply_name: 'Existing Supply',
            category: 'Existing Category',
            unit_price: 15.99,
            quantity: 30,
            expiration_date: '2023-06-30',
            supplier: 'Existing Supplier',
            location: 'Existing Location',
        };
    
        emergencySuppliersInstance.createSupply(existingSupply);
    
        const resMock = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    
        const retrievedSupply = emergencySuppliersInstance.getSupply('Existing Supply', resMock);
        expect(retrievedSupply).toEqual(existingSupply);
    });
    
    test('Get a non-existing supply', () => {
        const resMock = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    
        const retrievedSupply = emergencySuppliersInstance.getSupply('Non-Existing Supply', resMock);
        expect(retrievedSupply).toBeNull();
        expect(resMock.status).toHaveBeenCalledWith(404);
        expect(resMock.json).toHaveBeenCalledWith({ message: 'Not Found - Supply not found.' });
    });
    
    test('Update a non-existing supply', () => {
        const resMock = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    
        emergencySuppliersInstance.updateSupply('Non-Existing Supply', {}, resMock);
    
        expect(resMock.status).toHaveBeenCalledWith(400);
        expect(resMock.json).toHaveBeenCalledWith({ message: 'Bad Request - Invalid input: Missing required parameters.' });
    });
    
    
    
    test('Delete a non-existing supply', () => {
        const resMock = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    
        emergencySuppliersInstance.deleteSupply('Non-Existing Supply', resMock);
    
        expect(resMock.status).toHaveBeenCalledWith(404);
        expect(resMock.json).toHaveBeenCalledWith({ message: 'Not Found - Supply not found.' });
    });
    
    
});
