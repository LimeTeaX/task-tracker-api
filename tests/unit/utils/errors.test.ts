import {
  AppError, BadRequestError, UnauthorizedError,
  ForbiddenError, NotFoundError, ConflictError, ValidationError,
} from '../../../src/utils/errors';

describe('errors.util', () => {
  it('should create AppError with correct status code', () => {
    const error = new AppError('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('should create BadRequestError with 400', () => {
    const error = new BadRequestError('Bad request');
    expect(error.statusCode).toBe(400);
  });

  it('should create UnauthorizedError with 401', () => {
    const error = new UnauthorizedError('Unauthorized');
    expect(error.statusCode).toBe(401);
  });

  it('should create ForbiddenError with 403', () => {
    const error = new ForbiddenError('Forbidden');
    expect(error.statusCode).toBe(403);
  });

  it('should create NotFoundError with 404', () => {
    const error = new NotFoundError('Not found');
    expect(error.statusCode).toBe(404);
  });

  it('should create ConflictError with 409', () => {
    const error = new ConflictError('Conflict');
    expect(error.statusCode).toBe(409);
  });

  it('should create ValidationError with 422', () => {
    const error = new ValidationError('Validation failed', [{ msg: 'Invalid field' }]);
    expect(error.statusCode).toBe(422);
    expect(error.errors).toHaveLength(1);
  });
});
