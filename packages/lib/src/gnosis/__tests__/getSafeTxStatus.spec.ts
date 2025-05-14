import type { Mock } from 'vitest';
import { vi } from 'vitest';

describe('getSafeTxStatus', () => {
  let getTransactionMock: Mock;
  let getAllTransactionsMock: Mock;
  let getMantleTransactionMock: Mock;
  let getAllMantleTransactionsMock: Mock;

  beforeAll(() => {
    getTransactionMock = vi.fn();
    getAllTransactionsMock = vi.fn();

    getMantleTransactionMock = vi.fn();
    getAllMantleTransactionsMock = vi.fn();

    vi.doMock('@packages/blockchain/getSafeApiClient', () => ({
      getSafeApiClient: () => ({
        getTransaction: getTransactionMock,
        getAllTransactions: getAllTransactionsMock
      })
    }));

    vi.doMock('../mantleClient.ts', () => ({
      getMantleSafeTransaction: getMantleTransactionMock,
      getAllMantleSafeTransactions: getAllMantleTransactionsMock
    }));
  });

  describe('mantle mainnet and testnet', () => {
    it('should not return status if tx was not found (error was thrown)', async () => {
      getMantleTransactionMock.mockImplementationOnce(() => {
        throw new Error('Not found');
      });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 5001 });
      expect(status).toBe(null);
    });

    it('should return processing status when tx was found, but not yet executed', async () => {
      getMantleTransactionMock.mockResolvedValue({
        txStatus: 'AWAITING_EXECUTION',
        txHash: '0x456'
      });
      getAllMantleTransactionsMock.mockResolvedValue([]);
      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 5001 });

      expect(status?.status).toBe('processing');
      expect(status?.chainTxHash).toBe('0x456');
      expect(status?.safeTxHash).toBe('0x123');
    });

    it('should return cancelled status when txStatus is SUCCESS but the tx value is 0', async () => {
      getMantleTransactionMock.mockResolvedValue({
        txStatus: 'SUCCESS',
        txData: {
          value: '0',
          operation: 0
        },
        txHash: '0x456'
      });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 5001 });
      expect(status?.status).toBe('cancelled');
      expect(status?.chainTxHash).toBe('0x456');
      expect(status?.safeTxHash).toBe('0x123');
    });

    it('should return cancelled status when txStatus is CANCELLED', async () => {
      getMantleTransactionMock.mockResolvedValue({
        txStatus: 'CANCELLED',
        txHash: '0x456'
      });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 5001 });
      expect(status?.status).toBe('cancelled');
      expect(status?.chainTxHash).toBe('0x456');
      expect(status?.safeTxHash).toBe('0x123');
    });

    it('should return cancelled status when tx was not executed, but replaced with another tx with the same nonce', async () => {
      getMantleTransactionMock
        .mockResolvedValueOnce({
          txStatus: 'AWAITING_EXECUTION',
          txHash: '0x456',
          detailedExecutionInfo: {
            nonce: 1
          }
        })
        .mockResolvedValueOnce({
          txHash: '0x567'
        });

      getAllMantleTransactionsMock.mockResolvedValue([
        {
          transaction: {
            id: 'multisig_safeaddress_safeTxHash',
            executionInfo: {
              nonce: 1
            }
          }
        }
      ]);

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 5001 });
      expect(status?.status).toBe('cancelled');
      expect(status?.chainTxHash).toBe('0x567');
      expect(status?.safeTxHash).toBe('0x123');
    });

    it('should return paid status when tx was executed with value', async () => {
      getMantleTransactionMock.mockResolvedValue({
        txStatus: 'SUCCESS',
        txData: {
          value: '1',
          operation: 0
        },
        txHash: '0x456'
      });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 5001 });
      expect(status?.status).toBe('paid');
      expect(status?.chainTxHash).toBe('0x456');
      expect(status?.safeTxHash).toBe('0x123');
    });
  });

  describe('non mantle mainnet and testnet', () => {
    it('should not return status if tx was not found (error was thrown)', async () => {
      getTransactionMock.mockImplementationOnce(() => {
        throw new Error('Not found');
      });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 1 });
      expect(status).toBe(null);
    });

    it('should return processing status when tx was found, but not yet executed', async () => {
      getTransactionMock.mockResolvedValue({
        value: '1',
        isExecuted: false,
        isSuccessful: false,
        transactionHash: '0x456'
      });
      getAllTransactionsMock.mockResolvedValue({ results: [] });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 1 });

      expect(status?.status).toBe('processing');

      getTransactionMock.mockResolvedValue({ value: '1', isExecuted: false, isSuccessful: false });

      const status2 = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 1 });
      expect(status2?.status).toBe('processing');
      expect(status?.chainTxHash).toBe('0x456');
      expect(status?.safeTxHash).toBe('0x123');
    });

    it('should return cancelled status when tx was executed with no value and no data', async () => {
      getTransactionMock.mockResolvedValue({
        value: '0',
        isExecuted: true,
        isSuccessful: true,
        transactionHash: '0x456',
        data: null
      });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 1 });
      expect(status?.status).toBe('cancelled');
      expect(status?.chainTxHash).toBe('0x456');
      expect(status?.safeTxHash).toBe('0x123');
    });

    it('should return cancelled status when tx was not executed, but replaced with another tx with the same nonce', async () => {
      getTransactionMock.mockResolvedValue({
        value: '1',
        isExecuted: false,
        isSuccessful: false,
        transactionHash: '0x456',
        data: null,
        nonce: 1
      });
      getAllTransactionsMock.mockResolvedValue({
        results: [
          {
            nonce: 1,
            transactionHash: '0x789'
          }
        ]
      });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 1 });
      expect(status?.status).toBe('cancelled');
      expect(status?.chainTxHash).toBe('0x789');
      expect(status?.safeTxHash).toBe('0x123');
    });

    it('should return paid status when tx was executed with value', async () => {
      getTransactionMock.mockResolvedValue({
        value: '1',
        isExecuted: true,
        isSuccessful: true,
        transactionHash: '0x456'
      });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 1 });
      expect(status?.status).toBe('paid');
      expect(status?.chainTxHash).toBe('0x456');
      expect(status?.safeTxHash).toBe('0x123');
    });

    it('should return paid status when tx was executed with custom transfer data', async () => {
      getTransactionMock.mockResolvedValue({
        value: '0',
        isExecuted: true,
        isSuccessful: true,
        transactionHash: '0x456',
        data: '0xa9059cbb00000000000000000000000012345678901234567890123456789012345678900000000000'
      });

      const { getSafeTxStatus } = await import('../getSafeTxStatus');

      const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 1 });
      expect(status?.status).toBe('paid');
      expect(status?.chainTxHash).toBe('0x456');
      expect(status?.safeTxHash).toBe('0x123');
    });
  });
});
