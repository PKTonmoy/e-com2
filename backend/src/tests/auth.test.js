import request from 'supertest';
import { app } from '../server.js';

describe('auth smoke', () => {
  it('responds health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});

