const { body, validationResult } = require('express-validator');
const clientService = require('../services/clientService');
const { success, error } = require('../utils/response');

const validateClient = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('clientType').trim().notEmpty().withMessage('Client type is required'),
  body('status').trim().notEmpty().withMessage('Status is required'),
];

async function listClients(req, res, next) {
  try {
    const clients = await clientService.getAllClients(req.query);
    res.status(200).json(success('Clients retrieved successfully', clients));
  } catch (err) {
    next(err);
  }
}

async function getClient(req, res, next) {
  try {
    const client = await clientService.getClientById(req.params.id);
    if (!client) {
      return res.status(404).json(error('Client not found', 404));
    }
    res.status(200).json(success('Client retrieved successfully', client));
  } catch (err) {
    next(err);
  }
}

async function createClient(req, res, next) {
  try {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      return res.status(400).json(error('Validation failed', 400, validation.array()));
    }

    const result = await clientService.createClient(req.body);
    res.status(201).json(success('Client created successfully', result));
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json(error(err.message, 409));
    }
    next(err);
  }
}

async function updateClient(req, res, next) {
  try {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      return res.status(400).json(error('Validation failed', 400, validation.array()));
    }

    const result = await clientService.updateClient(req.params.id, req.body);
    res.status(200).json(success('Client updated successfully', result));
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

async function deleteClient(req, res, next) {
  try {
    const result = await clientService.deleteClient(req.params.id);
    res.status(200).json(success('Client deleted successfully', result));
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json(error(err.message, 404));
    }
    next(err);
  }
}

async function getClientStats(req, res, next) {
  try {
    const stats = await clientService.getClientStats();
    res.status(200).json(success('Client statistics retrieved successfully', stats));
  } catch (err) {
    next(err);
  }
}

module.exports = { validateClient, listClients, getClient, createClient, updateClient, deleteClient, getClientStats };
