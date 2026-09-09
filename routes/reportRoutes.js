// This file sets up the report routes for stock, popularity, and sales data.


const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getStockReport, getPopularityReport, getSalesReport } = require('../controllers/reportController');
const router = express.Router();


// make sure only logged-in users with the right role can see these reports
router.use(authenticate);
router.use(authorize('admin', 'clerk', 'manager'));

// getting  pages for  stock, popularity, and sales data
router.get('/stock', getStockReport);
router.get('/popularity', getPopularityReport);
router.get('/sales', getSalesReport);

module.exports = router;