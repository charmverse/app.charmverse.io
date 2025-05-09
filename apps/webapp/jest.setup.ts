// mock the db file with a prisma client that we can disconnect from the db after tests are run
// testing git diff
import { prisma } from '@charmverse/core/prisma-client';

afterAll(() => {
  prisma.$disconnect();
});

// Mock external requests globally

jest.mock('@packages/blockchain/getENSName', () => ({
  ...jest.requireActual('@packages/blockchain/getENSName'),
  __esModule: true,
  getENSName: jest.fn().mockImplementation(() => Promise.resolve(null)),
  getENSDetails: jest.fn().mockImplementation(() => Promise.resolve(null)),
  resolveENSName: jest.fn().mockImplementation(() => Promise.resolve(null))
}));

jest.mock('lib/blockchain/provider/alchemy/client', () => ({
  ...jest.requireActual('lib/blockchain/provider/alchemy/client'),
  __esModule: true,
  getNFTs: jest.fn().mockImplementation(() => Promise.resolve([]))
}));
