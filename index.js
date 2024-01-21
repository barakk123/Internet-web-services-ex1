const myEmergencySupplier = require('./emergencySupplier.js');

const sessions = new myEmergencySupplier.emergencySuppliers('data-base.json');

console.log(sessions.data);