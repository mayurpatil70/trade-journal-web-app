import { jest } from '@jest/globals';

const mockSupabaseChain = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  upsert: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ error: null }),
  update: jest.fn().mockReturnThis(),
};

jest.unstable_mockModule('../config/supabase.js', () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseChain),
  },
}));

const mockSendRevenueAlert = jest.fn().mockResolvedValue(true);
jest.unstable_mockModule('../utils/discordWebhook.js', () => ({
  sendRevenueAlert: mockSendRevenueAlert,
}));

const mockGetTransaction = jest.fn();
const mockGetTransactionReceipt = jest.fn();
const mockGetBlock = jest.fn();

const originalEthers = await import('ethers');
jest.unstable_mockModule('ethers', () => ({
  ...originalEthers,
  ethers: {
    ...originalEthers.ethers,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getTransaction: mockGetTransaction,
      getTransactionReceipt: mockGetTransactionReceipt,
      getBlock: mockGetBlock,
    })),
  },
}));

const { verifyCryptoPayment } = await import('../controllers/paymentController.js');
const { ethers } = await import('ethers');

describe('verifyCryptoPayment', () => {
  let req, res;
  const VALID_HASH = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const MERCHANT_WALLET = '0xeee0dcbddd4cf94913dd2e69ca1009290f5b076e';
  const USDT_ADDRESS = '0x55d398326f99059ff775485246999027b3197955';

  beforeEach(() => {
    process.env.BEP20_ADDRESS = MERCHANT_WALLET;
    req = {
      body: { txHash: VALID_HASH, plan: 'monthly' },
      userId: 'user-123',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
    mockSupabaseChain.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabaseChain.single.mockResolvedValue({ data: null, error: null });
    mockSupabaseChain.insert.mockResolvedValue({ error: null });
    mockGetBlock.mockResolvedValue({ timestamp: Math.floor(Date.now() / 1000) - 60 });
  });

  it('should return 401 if unauthorized (missing user)', async () => {
    req.userId = null;
    req.user = null;
    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 400 for invalid transaction hash format', async () => {
    req.body.txHash = 'invalid-hash';
    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid transaction hash format' });
  });

  it('should return 409 if transaction hash was already used (replay attack prevention)', async () => {
    mockSupabaseChain.maybeSingle.mockResolvedValueOnce({
      data: { id: 'sub-existing', status: 'paid' },
      error: null,
    });
    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('already been used') })
    );
  });

  it('should return 400 if transaction not found or receipt status is 0', async () => {
    mockGetTransaction.mockResolvedValueOnce(null);
    mockGetTransactionReceipt.mockResolvedValueOnce(null);

    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or failed transaction' });
  });

  it('should return 400 if transaction is older than 48 hours', async () => {
    mockGetTransaction.mockResolvedValueOnce({ to: USDT_ADDRESS });
    mockGetTransactionReceipt.mockResolvedValueOnce({ status: 1, blockNumber: 12345 });
    // Block timestamp from 50 hours ago
    mockGetBlock.mockResolvedValueOnce({ timestamp: Math.floor(Date.now() / 1000) - 50 * 3600 });

    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Transaction is too old. Payments must be verified within 48 hours.',
    });
  });

  it('should return 400 if tx.to is not the official USDT contract', async () => {
    mockGetTransaction.mockResolvedValueOnce({ to: '0x000000000000000000000000000000000000dead' });
    mockGetTransactionReceipt.mockResolvedValueOnce({ status: 1, blockNumber: 12345, logs: [] });

    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Transaction was not sent to the BSC USDT contract',
    });
  });

  it('should return 400 if Transfer log is from a fake token address', async () => {
    mockGetTransaction.mockResolvedValueOnce({ to: USDT_ADDRESS });

    const iface = new ethers.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]);
    const fakeLogData = iface.encodeEventLog(
      iface.getEvent('Transfer'),
      ['0x1111111111111111111111111111111111111111', MERCHANT_WALLET, ethers.parseUnits('14.0', 18)]
    );

    mockGetTransactionReceipt.mockResolvedValueOnce({
      status: 1,
      blockNumber: 12345,
      logs: [
        {
          address: '0xfakeTokenContractAddress1234567890abcdef', // NOT USDT!
          data: fakeLogData.data,
          topics: fakeLogData.topics,
        },
      ],
    });

    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid amount or recipient',
    });
  });

  it('should return 400 if transferred amount is less than plan price', async () => {
    mockGetTransaction.mockResolvedValueOnce({ to: USDT_ADDRESS });

    const iface = new ethers.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]);
    // Send only 5 USDT instead of 14 USDT
    const logData = iface.encodeEventLog(
      iface.getEvent('Transfer'),
      ['0x1111111111111111111111111111111111111111', MERCHANT_WALLET, ethers.parseUnits('5.0', 18)]
    );

    mockGetTransactionReceipt.mockResolvedValueOnce({
      status: 1,
      blockNumber: 12345,
      logs: [
        {
          address: USDT_ADDRESS,
          data: logData.data,
          topics: logData.topics,
        },
      ],
    });

    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid amount or recipient',
    });
  });

  it('should successfully verify legitimate payment and activate Pro Trader', async () => {
    mockGetTransaction.mockResolvedValueOnce({ to: USDT_ADDRESS });

    const iface = new ethers.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]);
    // Send 14.0 USDT
    const logData = iface.encodeEventLog(
      iface.getEvent('Transfer'),
      ['0x1111111111111111111111111111111111111111', MERCHANT_WALLET, ethers.parseUnits('14.0', 18)]
    );

    mockGetTransactionReceipt.mockResolvedValueOnce({
      status: 1,
      blockNumber: 12345,
      logs: [
        {
          address: USDT_ADDRESS,
          data: logData.data,
          topics: logData.topics,
        },
      ],
    });

    await verifyCryptoPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('Pro Trader activated'),
      })
    );
  });
});
