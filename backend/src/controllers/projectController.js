const { body, validationResult } = require('express-validator');
const projectService = require('../services/projectService');
const { success, error } = require('../utils/response');

const validateProject = [
  body('projectName').trim().notEmpty().withMessage('Project name is required'),
  body('clientId').notEmpty().withMessage('Client is required'),
  body('startDate').trim().notEmpty().withMessage('Start date is required'),
  body('deadline').trim().notEmpty().withMessage('Deadline is required'),
  body('budget').notEmpty().withMessage('Budget is required'),
  body('status').trim().notEmpty().withMessage('Status is required'),
];

async function listProjects(req, res, next) {
  try {
    const projects = await projectService.getAllProjects(req.query);
    res.status(200).json(success('Projects retrieved successfully', projects));
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json(error('Project not found', 404));
    }
    res.status(200).json(success('Project retrieved successfully', project));
  } catch (err) {
    next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      return res.status(400).json(error('Validation failed', 400, validation.array()));
    }

    const result = await projectService.createProject(req.body);
    res.status(201).json(success('Project created successfully', result));
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      return res.status(400).json(error('Validation failed', 400, validation.array()));
    }

    const result = await projectService.updateProject(req.params.id, req.body);
    res.status(200).json(success('Project updated successfully', result));
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json(error(err.message, 404));
    }
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const result = await projectService.deleteProject(req.params.id);
    res.status(200).json(success('Project deleted successfully', result));
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json(error(err.message, 404));
    }
    next(err);
  }
}

module.exports = { validateProject, listProjects, getProject, createProject, updateProject, deleteProject };
