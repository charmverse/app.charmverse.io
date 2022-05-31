jest.mock('lib/blockchain/getENSName', () => ({
  ...jest.requireActual('lib/blockchain/getENSName'),
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return Promise.resolve(null);
  })
}));
