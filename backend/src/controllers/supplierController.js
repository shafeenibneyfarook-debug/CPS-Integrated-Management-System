const { body, validationResult } = require('express-validator');
const supplierService = require('../services/supplierService');
const { success, error } = require('../utils/response');

const validateSupplier = [
  body('supplierName').trim().notEmpty().withMessage('Supplier name is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('productCategory').trim().notEmpty().withMessage('Product category is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('status').trim().notEmpty().withMessage('Status is required'),
];

async function listSuppliers(req, res, next) {
  try {
    const suppliers = await supplierService.getAllSuppliers(req.query);
    res.status(200).json(success('Suppliers retrieved successfully', suppliers));
  } catch (err) {
    next(err);
  }
}

async function getSupplier(req, res, next) {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json(error('Supplier not found', 404));
    }
    res.status(200).json(success('Supplier retrieved successfully', supplier));
  } catch (err) {
    next(err);
  }
}

async function createSupplier(req, res, next) {
  try {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      return res.status(400).json(error('Validation failed', 400, validation.array()));
    }

    const result = await supplierService.createSupplier(req.body);
    res.status(201).json(success('Supplier created successfully', result));
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json(error(err.message, 409));
    }
    next(err);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      return res.status(400).json(error('Validation failed', 400, validation.array()));
    }

    const result = await supplierService.updateSupplier(req.params.id, req.body);
    res.status(200).json(success('Supplier updated successfully', result));
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json(error(err.message, 404));
    }
    if (err.statusCode === 409) {
      return res.status(409).json(error(err.message, 409));
    }
    next(err);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    const result = await supplierService.deleteSupplier(req.params.id);
    res.status(200).json(success('Supplier deleted successfully', result));
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json(error(err.message, 404));
    }
    next(err);
  }
}

async function getSupplierStats(req, res, next) {
  try {
    const stats = await supplierService.getSupplierStats();
    res.status(200).json(success('Supplier statistics retrieved successfully', stats));
  } catch (err) {
    next(err);
  }
}

module.exports = { validateSupplier, listSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getSupplierStats };
