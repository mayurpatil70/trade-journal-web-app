import { verifyCryptoPayment } from '../controllers/paymentController.js';
import { supabase } from '../config/supabase.js';
import { ethers } from 'ethers';

jest.mock('../config/supabase.js', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }
}));

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers');
  return {
    ...original,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getTransaction: jest.fn(),
      getTransactionReceipt: jest.fn(),
    })),
  };
});

describe('verifyCryptoPayment', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { txHash: '0x123', plan: 'monthly' },
      user: { id: 'user-1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return 401 if unauthorized', async () => {
    req.user = null;
    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 400 for invalid transaction', async () => {
    // Provider mock returns null by default
    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or failed transaction' });
  });
});
