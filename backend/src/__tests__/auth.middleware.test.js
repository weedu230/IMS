/**
 * Unit Tests — Auth Middleware
 * Tests JWT verification and RBAC role guard.
 */

const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../middleware/auth');

// ── Mock res/next ─────────────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const validToken = () => jwt.sign(
  { emp_id: 1, email: 'admin@ims.local', role: 'admin', name: 'Admin' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// ─────────────────────────────────────────────────────────────────────────────
describe('authenticate middleware', () => {

  test('calls next() and attaches req.user on valid Bearer token', () => {
    const req  = { headers: { authorization: `Bearer ${validToken()}` } };
    const res  = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith();   // called with no error
    expect(req.user).toMatchObject({ emp_id: 1, role: 'admin' });
  });

  test('returns 401 when Authorization header is missing', () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header is not Bearer format', () => {
    const req  = { headers: { authorization: 'Basic abc123' } };
    const res  = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('calls next(err) with JsonWebTokenError on invalid token', () => {
    const req  = { headers: { authorization: 'Bearer invalidtoken.abc.xyz' } };
    const res  = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'JsonWebTokenError' }));
  });

  test('calls next(err) with TokenExpiredError on expired token', () => {
    const expired = jwt.sign(
      { emp_id: 1, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }  // already expired
    );
    const req  = { headers: { authorization: `Bearer ${expired}` } };
    const res  = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'TokenExpiredError' }));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('authorize middleware', () => {

  test('calls next() when user role is in allowed list', () => {
    const req  = { user: { emp_id: 1, role: 'admin' } };
    const res  = mockRes();
    const next = jest.fn();

    authorize('admin', 'manager')(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('returns 403 when user role is NOT in allowed list', () => {
    const req  = { user: { emp_id: 2, role: 'viewer' } };
    const res  = mockRes();
    const next = jest.fn();

    authorize('admin', 'manager')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when req.user is missing', () => {
    const req  = {};   // no user — authenticate wasn't called first
    const res  = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('staff cannot access admin-only routes', () => {
    const req  = { user: { emp_id: 3, role: 'staff' } };
    const res  = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
