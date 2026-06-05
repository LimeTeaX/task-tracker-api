import { body, param, query } from 'express-validator';

export const createCommentValidator = [
  param('taskId')
    .isUUID()
    .withMessage('Invalid task ID'),
  body('comment')
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters')
    .trim(),
];

export const taskIdParamValidator = [
  param('taskId')
    .isUUID()
    .withMessage('Invalid task ID'),
];

export const deleteCommentValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid comment ID'),
];
