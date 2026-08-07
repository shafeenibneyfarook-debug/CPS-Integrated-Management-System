const { pool } = require('../config/db');

async function getAllClients(filters = {}) {
  const { search = '', status = '', clientType = '' } = filters;
  let query = `
    SELECT client_id, company_name, contact_person, phone, email, client_type, address, status, note, latitude, longitude, created_at, updated_at
    FROM clients
    WHERE 1=1
  `;
  const values = [];

  if (search) {
    query += ' AND (company_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const like = `%${search}%`;
    values.push(like, like, like);
  }

  if (status) {
    query += ' AND status = ?';
    values.push(status);
  }

  if (clientType) {
    query += ' AND client_type = ?';
    values.push(clientType);
  }

  query += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(query, values);
  return rows;
}

async function getClientById(id) {
  const [rows] = await pool.query('SELECT client_id, company_name, contact_person, phone, email, client_type, address, status, note, latitude, longitude, created_at, updated_at FROM clients WHERE client_id = ?', [id]);
  return rows[0] || null;
}

async function createClient(data) {
  const { companyName, contactPerson, phone, email, clientType, address, status, notes } = data;
  const [existing] = await pool.query('SELECT client_id FROM clients WHERE company_name = ? OR phone = ? OR email = ? LIMIT 1', [companyName, phone, email]);
  if (existing.length) {
    const err = new Error('A client with the same company name, phone, or email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO clients (company_name, contact_person, phone, email, client_type, address, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [companyName, contactPerson, phone, email, clientType, address, status, notes || null]
  );

  return { clientId: result.insertId };
}

async function updateClient(id, data) {
  const { companyName, contactPerson, phone, email, clientType, address, status, notes } = data;
  const [existing] = await pool.query('SELECT client_id FROM clients WHERE (company_name = ? OR phone = ? OR email = ?) AND client_id <> ? LIMIT 1', [companyName, phone, email, id]);
  if (existing.length) {
    const err = new Error('A client with the same company name, phone, or email already exists.');
    err.statusCode = 409;
    throw err;
  }

  await pool.query(
    'UPDATE clients SET company_name=?, contact_person=?, phone=?, email=?, client_type=?, address=?, status=?, note=? WHERE client_id=?',
    [companyName, contactPerson, phone, email, clientType, address, status, notes || null, id]
  );

  return { clientId: Number(id) };
}

async function deleteClient(id) {
  const [result] = await pool.query('DELETE FROM clients WHERE client_id = ?', [id]);
  if (!result.affectedRows) {
    const err = new Error('Client not found');
    err.statusCode = 404;
    throw err;
  }
  return { deleted: true };
}

async function getClientStats() {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS totalClients,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS activeClients,
      SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) AS inactiveClients
    FROM clients
  `);
  return rows[0];
}

module.exports = { getAllClients, getClientById, createClient, updateClient, deleteClient, getClientStats };
