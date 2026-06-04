import { body, param, query } from 'express-validator';

export const createTaskValidator = [
  body('title')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description too long')
    .trim(),
  body('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('assigneeId')
    .optional()
    .isUUID()
    .withMessage('Invalid assignee ID'),
];

export const updateTaskValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid task ID'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description too long')
    .trim(),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

export const taskIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid task ID'),
];

export const updateStatusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid task ID'),
  body('status')
    .isIn(['todo', 'in_progress', 'review', 'done'])
    .withMessage('Invalid status'),
];

export const assignTaskValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid task ID'),
  body('assigneeId')
    .isUUID()
    .withMessage('Invalid user ID'),
];

export const listTasksValidator = [
  query('projectId')
    .optional()
    .isUUID()
    .withMessage('Invalid project ID'),
  query('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done', 'all'])
    .withMessage('Invalid status'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  query('assigneeId')
    .optional()
    .isUUID()
    .withMessage('Invalid assignee ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
];