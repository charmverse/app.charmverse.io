jest.mock('lib/blockchain/getENSName', () => {
  return jest.fn().mockImplementation(() => {
    return Promise.resolve(null);
  });
});
