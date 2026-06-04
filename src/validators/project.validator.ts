import { body, param, query } from 'express-validator';

export const createProjectValidator = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters')
    .trim(),
];

export const updateProjectValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters')
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'archived'])
    .withMessage('Status must be active or archived'),
];

export const projectIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
];

export const addMemberValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
  body('userId')
    .notEmpty().withMessage('User ID or email is required')
    .isString().withMessage('User ID must be a string'),
  body('role')
    .optional()
    .isIn(['manager', 'member'])
    .withMessage('Role must be manager or member')
    .default('member'),
];

export const removeMemberValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

export const listProjectsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('status')
    .optional()
    .isIn(['active', 'archived', 'all'])
    .withMessage('Status must be active, archived, or all'),
];