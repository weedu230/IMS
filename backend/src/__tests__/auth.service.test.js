/**
 * Unit Tests — Auth Service
 * All DB calls are mocked — no real DB connection needed.
 */

jest.mock('../repositories/auth.repository');

const authRepo   = require('../repositories/auth.repository');
const authService = require('../services/auth.service');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeEmployee = (overrides = {}) => ({
  emp_id:        1,
  name:          'Test Admin',
  email:         'admin@test.com',
  role:          'admin',
  is_active:     true,
  password_hash: bcrypt.hashSync('Password123!', 4),
  warehouse_id:  null,
  toJSON: () => ({ emp_id: 1, name: 'Test Admin', email: 'admin@test.com', role: 'admin' }),
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AuthService.login', () => {

  test('returns employee + token on valid credentials', async () => {
    const emp = makeEmployee();
    authRepo.findByEmail.mockResolvedValue(emp);
    authRepo.touchLogin.mockResolvedValue([1]);

    const result = await authService.login('admin@test.com', 'Password123!');

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('employee');
    expect(result.employee.password_hash).toBeUndefined(); // stripped
    expect(typeof result.token).toBe('string');

    // Token should be valid JWT
    const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
    expect(decoded.email).toBe('admin@test.com');
    expect(decoded.role).toBe('admin');
  });

  test('throws 401 when email not found', async () => {
    authRepo.findByEmail.mockResolvedValue(null);
    await expect(authService.login('nobody@test.com', 'pass'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  test('throws 401 when employee is inactive', async () => {
    authRepo.findByEmail.mockResolvedValue(makeEmployee({ is_active: false }));
    await expect(authService.login('admin@test.com', 'Password123!'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  test('throws 401 on wrong password', async () => {
    authRepo.findByEmail.mockResolvedValue(makeEmployee());
    await expect(authService.login('admin@test.com', 'WrongPassword1'))
      .rejects.toMatchObject({ statusCode: 401 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AuthService.getMe', () => {

  test('returns employee profile', async () => {
    const emp = makeEmployee();
    authRepo.findById.mockResolvedValue(emp);
    const result = await authService.getMe(1);
    expect(result.emp_id).toBe(1);
    expect(result.password_hash).toBeUndefined();
  });

  test('throws 404 if employee not found', async () => {
    authRepo.findById.mockResolvedValue(null);
    await expect(authService.getMe(999))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AuthService.changePassword', () => {

  test('throws 400 if current password is wrong', async () => {
    const emp = makeEmployee();
    authRepo.findById.mockResolvedValue(emp);
    authRepo.findByEmail.mockResolvedValue(emp);

    await expect(authService.changePassword(1, 'WrongOldPass1', 'NewPassword1!'))
      .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('incorrect') });
  });

  test('throws 400 if new password equals current', async () => {
    const emp = makeEmployee();
    authRepo.findById.mockResolvedValue(emp);
    authRepo.findByEmail.mockResolvedValue(emp);

    await expect(authService.changePassword(1, 'Password123!', 'Password123!'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('resolves with success message on valid change', async () => {
    const emp = makeEmployee();
    authRepo.findById.mockResolvedValue(emp);
    authRepo.findByEmail.mockResolvedValue(emp);
    authRepo.updatePassword.mockResolvedValue([1]);

    const result = await authService.changePassword(1, 'Password123!', 'NewPassword99!');
    expect(result.message).toContain('updated');
  });
});
