const express = require('express');
const router = express.Router();
const { validateClient, listClients, getClient, createClient, updateClient, deleteClient, getClientStats } = require('../controllers/clientController');

router.get('/stats/summary', getClientStats);
router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', validateClient, createClient);
router.put('/:id', validateClient, updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
