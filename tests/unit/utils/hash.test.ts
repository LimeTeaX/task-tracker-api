import { hashPassword, comparePassword } from '../../../src/utils/hash.util';

describe('hash.util', () => {
  it('should hash a password correctly', async () => {
    const password = 'TestPass@123';
    const hashed = await hashPassword(password);
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
  });

  it('should compare password correctly', async () => {
    const password = 'TestPass@123';
    const hashed = await hashPassword(password);
    const isMatch = await comparePassword(password, hashed);
    expect(isMatch).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hashed = await hashPassword('TestPass@123');
    const isMatch = await comparePassword('Wrong@123', hashed);
    expect(isMatch).toBe(false);
  });
});
