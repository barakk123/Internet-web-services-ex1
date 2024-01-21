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

        emergencySuppliersInstance.createSupply(newSupply);

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
            quantity: 40,
            location: 'Updated Location',
        };

        emergencySuppliersInstance.updateSupply('Existing Supply', updatedSupply);

        const savedSupply = emergencySuppliersInstance.getSupply('Existing Supply');
        expect(savedSupply.quantity).toEqual(40);
        expect(savedSupply.location).toEqual('Updated Location');
    });

    
    
});
