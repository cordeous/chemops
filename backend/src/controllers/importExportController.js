// Thin controller - delegates to product/customer/order controllers
// This file satisfies the route /api/import and /api/export aliases

const productCtrl = require('./productController');
const customerCtrl = require('./customerController');
const orderCtrl = require('./orderController');

module.exports = { productCtrl, customerCtrl, orderCtrl };
