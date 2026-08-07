const { pool } = require('../config/db');

async function getAllSuppliers(filters = {}) {
  const { search = '', status = '', productCategory = '' } = filters;
  let query = `
    SELECT supplier_id, supplier_name, country, contact_person, product_category, phone, email, address, status, created_at, updated_at
    FROM suppliers
    WHERE 1=1
  `;
  const values = [];

  if (search) {
    query += ' AND (supplier_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const like = `%${search}%`;
    values.push(like, like, like);
  }

  if (status) {
    query += ' AND status = ?';
    values.push(status);
  }

  if (productCategory) {
    query += ' AND product_category = ?';
    values.push(productCategory);
  }

  query += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(query, values);
  return rows;
}

async function getSupplierById(id) {
  const [rows] = await pool.query('SELECT supplier_id, supplier_name, country, contact_person, product_category, phone, email, address, status, created_at, updated_at FROM suppliers WHERE supplier_id = ?', [id]);
  return rows[0] || null;
}

async function createSupplier(data) {
  const { supplierName, country, contactPerson, productCategory, phone, email, address, status } = data;
  const [existing] = await pool.query('SELECT supplier_id FROM suppliers WHERE supplier_name = ? OR phone = ? OR email = ? LIMIT 1', [supplierName, phone, email]);
  if (existing.length) {
    const err = new Error('A supplier with the same name, phone, or email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO suppliers (supplier_name, country, contact_person, product_category, phone, email, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [supplierName, country, contactPerson, productCategory, phone, email, address, status]
  );

  return { supplierId: result.insertId };
}

async function updateSupplier(id, data) {
  const { supplierName, country, contactPerson, productCategory, phone, email, address, status } = data;
  const [existing] = await pool.query('SELECT supplier_id FROM suppliers WHERE (supplier_name = ? OR phone = ? OR email = ?) AND supplier_id <> ? LIMIT 1', [supplierName, phone, email, id]);
  if (existing.length) {
    const err = new Error('A supplier with the same name, phone, or email already exists.');
    err.statusCode = 409;
    throw err;
  }

  await pool.query(
    'UPDATE suppliers SET supplier_name=?, country=?, contact_person=?, product_category=?, phone=?, email=?, address=?, status=? WHERE supplier_id=?',
    [supplierName, country, contactPerson, productCategory, phone, email, address, status, id]
  );

  return { supplierId: Number(id) };
}

async function deleteSupplier(id) {
  const [result] = await pool.query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);
  if (!result.affectedRows) {
    const err = new Error('Supplier not found');
    err.statusCode = 404;
    throw err;
  }
  return { deleted: true };
}

async function getSupplierStats() {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS totalSuppliers,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS activeSuppliers,
      SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) AS inactiveSuppliers
    FROM suppliers
  `);
  return rows[0];
}

module.exports = { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier, getSupplierStats };
