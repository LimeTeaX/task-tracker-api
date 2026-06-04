import { body, param } from 'express-validator';

export const linkRepoValidator = [
  body('repoUrl')
    .isURL().withMessage('Must be a valid URL')
    .matches(/github\.com/).withMessage('Must be a GitHub repository URL'),
  body('projectId').isUUID().withMessage('Invalid project ID format'),
];

export const syncCommitsValidator = [
  param('id').isUUID().withMessage('Invalid project ID format'),
];

export const getCommitsValidator = [
  param('id').isUUID().withMessage('Invalid project ID format'),
];
