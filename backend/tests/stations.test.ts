import request from 'supertest';
import app from '../src/index';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    policeStation: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Station routes', () => {
  const { prisma } = require('../src/lib/prisma');

  test('GET /api/stationen returns stations array', async () => {
    (prisma.policeStation.findMany as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Station 1' },
    ]);
    (prisma.policeStation.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app).get('/api/stationen');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.stations)).toBe(true);
    expect(res.body.stations.length).toBe(1);
  });
});
