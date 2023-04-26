describe('getGnosisTransactionQueueUrl', () => {
  let getTransactionMock: jest.Mock;

  beforeAll(() => {
    getTransactionMock = jest.fn();

    jest.mock('../gnosis.ts', () => ({
      getGnosisService: () => ({
        getTransaction: getTransactionMock
      })
    }));
  });

  it('should not return status if tx was not found (error was thrown)', async () => {
    getTransactionMock.mockImplementationOnce(() => {
      throw new Error('Not found');
    });

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

    const status = await getSafeTxStatus({ txHash: '0x123', chainId: 1 });
    expect(status).toBe(null);
  });

  it('should return processing status when tx was found, but not yet executed', async () => {
    getTransactionMock.mockResolvedValue({ value: '1', isExecuted: false, isSuccessful: false });

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

    const status = await getSafeTxStatus({ txHash: '0x123', chainId: 1 });
    expect(status).toBe('processing');

    getTransactionMock.mockResolvedValue({ value: '1', isExecuted: true, isSuccessful: false });

    const status2 = await getSafeTxStatus({ txHash: '0x123', chainId: 1 });
    expect(status2).toBe('processing');
  });

  it('should return processing status when tx was found, but not yet executed', async () => {
    getTransactionMock.mockResolvedValue({ value: '1', isExecuted: false, isSuccessful: false });

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

    const status = await getSafeTxStatus({ txHash: '0x123', chainId: 1 });
    expect(status).toBe('processing');

    getTransactionMock.mockResolvedValue({ value: '1', isExecuted: true, isSuccessful: false });

    const status2 = await getSafeTxStatus({ txHash: '0x123', chainId: 1 });
    expect(status2).toBe('processing');
  });

  it('should return cancelled status when tx was executed with no value', async () => {
    getTransactionMock.mockResolvedValue({ value: '0', isExecuted: true, isSuccessful: true });

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

    const status = await getSafeTxStatus({ txHash: '0x123', chainId: 1 });
    expect(status).toBe('cancelled');
  });

  it('should return paid status when tx was executed with value', async () => {
    getTransactionMock.mockResolvedValue({ value: '1', isExecuted: true, isSuccessful: true });

    const { getSafeTxStatus } = await import('lib/gnosis/getSafeTxStatus');

    const status = await getSafeTxStatus({ txHash: '0x123', chainId: 1 });
    expect(status).toBe('paid');
  });
});
