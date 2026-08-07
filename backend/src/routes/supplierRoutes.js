const express = require('express');
const router = express.Router();
const { validateSupplier, listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getSupplierStats } = require('../controllers/supplierController');

router.get('/stats/summary', getSupplierStats);
router.get('/', listSuppliers);
router.get('/:id', getSupplier);
router.post('/', validateSupplier, createSupplier);
router.put('/:id', validateSupplier, updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;
