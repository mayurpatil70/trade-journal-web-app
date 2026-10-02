import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies
jest.unstable_mockModule('../config/supabase.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ error: null })
    }))
  }
}));

jest.unstable_mockModule('../utils/chainVerifier.js', () => ({
  verifyPayment: jest.fn().mockResolvedValue({ ok: true, status: 'pending' })
}));

jest.unstable_mockModule('../utils/discordWebhook.js', () => ({
  sendRevenueAlert: jest.fn().mockResolvedValue(true)
}));

jest.unstable_mockModule('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        // mock stream
        return {
          end: () => callback(null, { secure_url: 'http://example.com/image.png' })
        };
      })
    }
  }
}));

const app = express();
app.use(express.json());

let routes;

beforeAll(async () => {
  const mod = await import('../routes/subscriptionRoutes.js');
  routes = mod.default;
  app.use('/api/subscriptions', routes);
});

describe('Subscription Routes', () => {
  it('should process masterclass payment and return pending status', async () => {
    const res = await request(app)
      .post('/api/subscriptions/masterclass/verify')
      .send({
        userId: 'test-user-123',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        chain: 'BEP20'
      });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('admin approval');
  });

  it('should reject invalid transaction hash', async () => {
    const res = await request(app)
      .post('/api/subscriptions/masterclass/verify')
      .send({
        userId: 'test-user-123',
        txHash: 'invalid-hash',
        chain: 'BEP20'
      });
      
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid transaction hash format');
  });
});
