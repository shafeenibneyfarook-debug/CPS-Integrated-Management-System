const express = require('express');
const router = express.Router();
const { validateProject, listProjects, getProject, createProject, updateProject, deleteProject } = require('../controllers/projectController');

router.get('/', listProjects);
router.get('/:id', getProject);
router.post('/', validateProject, createProject);
router.put('/:id', validateProject, updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
