describe('getGnosisTransactionQueueUrl', () => {
  let getTransactionMock: jest.Mock;
  let getAllTransactionsMock: jest.Mock;

  beforeAll(() => {
    getTransactionMock = jest.fn();
    getAllTransactionsMock = jest.fn();

    jest.mock('../gnosis.ts', () => ({
      getGnosisService: () => ({
        getTransaction: getTransactionMock,
        getAllTransactions: getAllTransactionsMock
      })
    }));
  });

  it('should not return status if tx was not found (error was thrown)', async () => {
    getTransactionMock.mockImplementationOnce(() => {
      throw new Error('Not found');
    });

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

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

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

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

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

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

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

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

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

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

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

    const status = await getSafeTxStatus({ safeTxHash: '0x123', chainId: 1 });
    expect(status?.status).toBe('paid');
    expect(status?.chainTxHash).toBe('0x456');
    expect(status?.safeTxHash).toBe('0x123');
  });
});

export {};
