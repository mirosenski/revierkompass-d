import request from 'supertest';
import app from '../src/index';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Auth routes', () => {
  const { prisma } = require('../src/lib/prisma');

  test('POST /api/auth/login returns 401 for unknown user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: 'secret' });

    expect(res.status).toBe(401);
  });
});
