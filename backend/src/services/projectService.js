const { pool } = require('../config/db');

async function getAllProjects(filters = {}) {
  const { search = '', status = '', clientId = '' } = filters;
  let query = `
    SELECT
      p.project_id,
      p.project_name,
      p.client_id,
      c.company_name AS client_name,
      p.start_date,
      p.deadline,
      p.budget,
      p.assigned_user_id,
      p.status,
      p.description,
      p.location_name,
      p.latitude,
      p.longitude,
      p.created_at,
      p.updated_at
    FROM projects p
    LEFT JOIN clients c ON c.client_id = p.client_id
    WHERE 1=1
  `;
  const values = [];

  if (search) {
    query += ' AND (p.project_name LIKE ? OR c.company_name LIKE ? OR p.location_name LIKE ?)';
    const like = `%${search}%`;
    values.push(like, like, like);
  }

  if (status) {
    query += ' AND p.status = ?';
    values.push(status);
  }

  if (clientId) {
    query += ' AND p.client_id = ?';
    values.push(clientId);
  }

  query += ' ORDER BY p.created_at DESC';
  const [rows] = await pool.query(query, values);
  return rows;
}

async function getProjectById(id) {
  const [rows] = await pool.query(`
    SELECT
      p.project_id,
      p.project_name,
      p.client_id,
      c.company_name AS client_name,
      p.start_date,
      p.deadline,
      p.budget,
      p.assigned_user_id,
      p.status,
      p.description,
      p.location_name,
      p.latitude,
      p.longitude,
      p.created_at,
      p.updated_at
    FROM projects p
    LEFT JOIN clients c ON c.client_id = p.client_id
    WHERE p.project_id = ?
  `, [id]);
  return rows[0] || null;
}

async function createProject(data) {
  const { projectName, clientId, startDate, deadline, budget, assignedEmployee, status, description, projectLocation, latitude, longitude } = data;
  const [result] = await pool.query(
    'INSERT INTO projects (project_name, client_id, start_date, deadline, budget, assigned_user_id, status, description, location_name, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [projectName, clientId, startDate, deadline, budget, assignedEmployee || null, status, description || null, projectLocation || null, latitude || null, longitude || null]
  );

  return { projectId: result.insertId };
}

async function updateProject(id, data) {
  const { projectName, clientId, startDate, deadline, budget, assignedEmployee, status, description, projectLocation, latitude, longitude } = data;
  await pool.query(
    'UPDATE projects SET project_name=?, client_id=?, start_date=?, deadline=?, budget=?, assigned_user_id=?, status=?, description=?, location_name=?, latitude=?, longitude=? WHERE project_id=?',
    [projectName, clientId, startDate, deadline, budget, assignedEmployee || null, status, description || null, projectLocation || null, latitude || null, longitude || null, id]
  );

  return { projectId: Number(id) };
}

async function deleteProject(id) {
  const [result] = await pool.query('DELETE FROM projects WHERE project_id = ?', [id]);
  if (!result.affectedRows) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  return { deleted: true };
}

module.exports = { getAllProjects, getProjectById, createProject, updateProject, deleteProject };
