require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Batch = require('./src/models/Batch');
const Customer = require('./src/models/Customer');
const Order = require('./src/models/Order');
const Invoice = require('./src/models/Invoice');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Product.deleteMany({}), Batch.deleteMany({}),
    Customer.deleteMany({}), Order.deleteMany({}), Invoice.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // Users
  const hashPw = (pw) => bcrypt.hash(pw, 12);
  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@chemops.com', passwordHash: await hashPw('admin123'), role: 'Admin' },
    { name: 'Sarah Sales', email: 'sales@chemops.com', passwordHash: await hashPw('sales123'), role: 'Sales' },
    { name: 'Frank Finance', email: 'finance@chemops.com', passwordHash: await hashPw('finance123'), role: 'Finance' },
    { name: 'Carl Compliance', email: 'compliance@chemops.com', passwordHash: await hashPw('compliance123'), role: 'Compliance' }
  ]);
  console.log(`Created ${users.length} users`);

  // Products
  const products = await Product.insertMany([
    { name: 'Sulfuric Acid 98%', CASNumber: '7664-93-9', UNNumber: 'UN1830', hazardClassification: 'Class 8 - Corrosive', storageRequirements: 'Store in cool, dry, ventilated area. Segregate from bases.', sdsDocumentUrl: 'https://example.com/sds/sulfuric-acid.pdf', unitOfMeasure: 'L', inventoryLevel: 500, reorderThreshold: 50, price: 2.50, currency: 'USD', isHazardous: true },
    { name: 'Sodium Hydroxide', CASNumber: '1310-73-2', UNNumber: 'UN1823', hazardClassification: 'Class 8 - Corrosive', storageRequirements: 'Keep dry. Store away from acids and moisture.', sdsDocumentUrl: 'https://example.com/sds/sodium-hydroxide.pdf', unitOfMeasure: 'kg', inventoryLevel: 1200, reorderThreshold: 100, price: 1.20, currency: 'USD', isHazardous: true },
    { name: 'Ethanol 99.9%', CASNumber: '64-17-5', UNNumber: 'UN1170', hazardClassification: 'Class 3 - Flammable Liquid', storageRequirements: 'Keep away from heat and ignition sources.', sdsDocumentUrl: 'https://example.com/sds/ethanol.pdf', unitOfMeasure: 'L', inventoryLevel: 800, reorderThreshold: 100, price: 3.80, currency: 'USD', isHazardous: true },
    { name: 'Hydrochloric Acid 37%', CASNumber: '7647-01-0', UNNumber: 'UN1789', hazardClassification: 'Class 8 - Corrosive', storageRequirements: 'Store in fume hood. Segregate from alkalis.', sdsDocumentUrl: 'https://example.com/sds/hcl.pdf', unitOfMeasure: 'L', inventoryLevel: 300, reorderThreshold: 30, price: 3.10, currency: 'USD', isHazardous: true },
    { name: 'Acetone', CASNumber: '67-64-1', UNNumber: 'UN1090', hazardClassification: 'Class 3 - Flammable Liquid', storageRequirements: 'Keep cool and away from ignition sources.', sdsDocumentUrl: 'https://example.com/sds/acetone.pdf', unitOfMeasure: 'L', inventoryLevel: 600, reorderThreshold: 80, price: 2.90, currency: 'USD', isHazardous: true },
    { name: 'Sodium Chloride (Industrial)', CASNumber: '7647-14-5', UNNumber: null, hazardClassification: 'Not hazardous', storageRequirements: 'Keep in dry, sealed containers.', sdsDocumentUrl: null, unitOfMeasure: 'kg', inventoryLevel: 5000, reorderThreshold: 500, price: 0.35, currency: 'USD', isHazardous: false },
    { name: 'Methanol Technical Grade', CASNumber: '67-56-1', UNNumber: 'UN1230', hazardClassification: 'Class 3 - Flammable Liquid, Toxic', storageRequirements: 'Store away from heat. Highly toxic if ingested.', sdsDocumentUrl: 'https://example.com/sds/methanol.pdf', unitOfMeasure: 'L', inventoryLevel: 400, reorderThreshold: 50, price: 1.75, currency: 'USD', isHazardous: true },
    { name: 'Calcium Carbonate', CASNumber: '471-34-1', UNNumber: null, hazardClassification: 'Not hazardous', storageRequirements: 'Store in cool, dry place.', sdsDocumentUrl: null, unitOfMeasure: 'kg', inventoryLevel: 8000, reorderThreshold: 1000, price: 0.25, currency: 'USD', isHazardous: false },
    { name: 'Hydrogen Peroxide 35%', CASNumber: '7722-84-1', UNNumber: 'UN2014', hazardClassification: 'Class 5.1 - Oxidizer', storageRequirements: 'Keep refrigerated. Away from organic materials.', sdsDocumentUrl: 'https://example.com/sds/h2o2.pdf', unitOfMeasure: 'L', inventoryLevel: 150, reorderThreshold: 20, price: 5.60, currency: 'USD', isHazardous: true },
    { name: 'Isopropyl Alcohol 70%', CASNumber: '67-63-0', UNNumber: 'UN1219', hazardClassification: 'Class 3 - Flammable Liquid', storageRequirements: 'Store away from oxidizers and heat.', sdsDocumentUrl: 'https://example.com/sds/ipa.pdf', unitOfMeasure: 'L', inventoryLevel: 1000, reorderThreshold: 100, price: 2.20, currency: 'USD', isHazardous: true }
  ]);
  console.log(`Created ${products.length} products`);

  // Batches (3 per product)
  const batchData = [];
  const warehouses = ['Warehouse A - Rack 1', 'Warehouse A - Rack 2', 'Warehouse B - Cold Storage', 'Warehouse B - Hazmat Zone'];
  products.forEach((p, i) => {
    for (let b = 1; b <= 3; b++) {
      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() + (b * 4) + i);
      batchData.push({
        productId: p._id,
        batchNumber: `BATCH-${String(i + 1).padStart(3, '0')}-${String(b).padStart(2, '0')}`,
        quantity: Math.floor(p.inventoryLevel / 3),
        expirationDate: expDate,
        warehouseLocation: warehouses[b % warehouses.length]
      });
    }
  });
  const batches = await Batch.insertMany(batchData);
  console.log(`Created ${batches.length} batches`);

  // Customers
  const customers = await Customer.insertMany([
    { companyName: 'ChemTech Industries', taxId: 'TAX-001', creditLimit: 50000, complianceStatus: 'Verified', address: { street: '123 Industrial Blvd', city: 'Houston', state: 'TX', postalCode: '77001', country: 'USA' }, contactName: 'John Miller', contactEmail: 'john@chemtech.com', contactPhone: '+1-555-0101', currency: 'USD' },
    { companyName: 'NovaChem Labs', taxId: 'TAX-002', creditLimit: 30000, complianceStatus: 'Verified', address: { street: '456 Research Dr', city: 'Boston', state: 'MA', postalCode: '02101', country: 'USA' }, contactName: 'Lisa Chen', contactEmail: 'lisa@novachem.com', contactPhone: '+1-555-0102', currency: 'USD' },
    { companyName: 'Global Pharma Supply', taxId: 'TAX-003', creditLimit: 100000, complianceStatus: 'Verified', address: { street: '789 Pharma Way', city: 'Chicago', state: 'IL', postalCode: '60601', country: 'USA' }, contactName: 'Robert Davis', contactEmail: 'robert@globalpharma.com', contactPhone: '+1-555-0103', currency: 'USD' },
    { companyName: 'Apex Manufacturing', taxId: 'TAX-004', creditLimit: 20000, complianceStatus: 'Pending', address: { street: '321 Factory Rd', city: 'Detroit', state: 'MI', postalCode: '48201', country: 'USA' }, contactName: 'Amy Johnson', contactEmail: 'amy@apexmfg.com', contactPhone: '+1-555-0104', currency: 'USD' },
    { companyName: 'EcoClean Solutions', taxId: 'TAX-005', creditLimit: 15000, complianceStatus: 'Rejected', address: { street: '654 Green St', city: 'Seattle', state: 'WA', postalCode: '98101', country: 'USA' }, contactName: 'Tom Green', contactEmail: 'tom@ecoclean.com', contactPhone: '+1-555-0105', currency: 'USD' }
  ]);
  console.log(`Created ${customers.length} customers`);

  // Orders (10 orders in various statuses, only from verified customers)
  const verifiedCustomers = customers.filter(c => c.complianceStatus === 'Verified');
  const adminUser = users[0];
  const orderDefs = [
    { customerId: verifiedCustomers[0]._id, status: 'Paid', items: [{ productId: products[0]._id, batchId: batches[0]._id, quantity: 100, unitPrice: 2.50 }, { productId: products[1]._id, batchId: batches[3]._id, quantity: 50, unitPrice: 1.20 }], taxRate: 10 },
    { customerId: verifiedCustomers[1]._id, status: 'Invoiced', items: [{ productId: products[2]._id, batchId: batches[6]._id, quantity: 200, unitPrice: 3.80 }], taxRate: 8 },
    { customerId: verifiedCustomers[2]._id, status: 'Shipped', items: [{ productId: products[3]._id, batchId: batches[9]._id, quantity: 30, unitPrice: 3.10 }, { productId: products[4]._id, batchId: batches[12]._id, quantity: 100, unitPrice: 2.90 }], taxRate: 10 },
    { customerId: verifiedCustomers[0]._id, status: 'Approved', items: [{ productId: products[5]._id, batchId: batches[15]._id, quantity: 500, unitPrice: 0.35 }], taxRate: 5 },
    { customerId: verifiedCustomers[1]._id, status: 'Pending', items: [{ productId: products[6]._id, batchId: batches[18]._id, quantity: 80, unitPrice: 1.75 }], taxRate: 8 },
    { customerId: verifiedCustomers[2]._id, status: 'Paid', items: [{ productId: products[7]._id, batchId: batches[21]._id, quantity: 1000, unitPrice: 0.25 }, { productId: products[8]._id, batchId: batches[24]._id, quantity: 50, unitPrice: 5.60 }], taxRate: 10 },
    { customerId: verifiedCustomers[0]._id, status: 'Invoiced', items: [{ productId: products[9]._id, batchId: batches[27]._id, quantity: 150, unitPrice: 2.20 }], taxRate: 10 },
    { customerId: verifiedCustomers[1]._id, status: 'Approved', items: [{ productId: products[0]._id, batchId: batches[1]._id, quantity: 200, unitPrice: 2.50 }], taxRate: 8 },
    { customerId: verifiedCustomers[2]._id, status: 'Pending', items: [{ productId: products[1]._id, batchId: batches[4]._id, quantity: 300, unitPrice: 1.20 }], taxRate: 10 },
    { customerId: verifiedCustomers[0]._id, status: 'Shipped', items: [{ productId: products[2]._id, batchId: batches[7]._id, quantity: 120, unitPrice: 3.80 }, { productId: products[3]._id, batchId: batches[10]._id, quantity: 60, unitPrice: 3.10 }], taxRate: 10 }
  ];

  const createdOrders = [];
  for (const def of orderDefs) {
    const items = def.items.map(i => ({ ...i, total: i.quantity * i.unitPrice }));
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const taxAmount = subtotal * (def.taxRate / 100);
    const totalAmount = subtotal + taxAmount;
    const order = await Order.create({ ...def, items, subtotal, taxAmount, totalAmount, currency: 'USD', createdBy: adminUser._id });
    createdOrders.push(order);
  }
  console.log(`Created ${createdOrders.length} orders`);

  // Invoices for Invoiced and Paid orders
  let invCounter = 1;
  const invoiceOrders = createdOrders.filter(o => ['Invoiced', 'Paid'].includes(o.status));
  for (const order of invoiceOrders) {
    const year = new Date().getFullYear();
    const num = String(invCounter++).padStart(4, '0');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    await Invoice.create({
      orderId: order._id,
      invoiceNumber: `INV-${year}-${num}`,
      currency: order.currency,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      status: order.status === 'Paid' ? 'Paid' : 'Issued',
      dueDate,
      issuedAt: new Date(),
      ...(order.status === 'Paid' ? { paidAt: new Date() } : {})
    });
  }
  console.log(`Created ${invoiceOrders.length} invoices`);

  console.log('\n✅ Seed complete!');
  console.log('Login credentials:');
  console.log('  Admin:      admin@chemops.com      / admin123');
  console.log('  Sales:      sales@chemops.com      / sales123');
  console.log('  Finance:    finance@chemops.com    / finance123');
  console.log('  Compliance: compliance@chemops.com / compliance123');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
