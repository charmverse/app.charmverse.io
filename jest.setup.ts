// mock the db file with a prisma client that we can disconnect from the db after tests are run
// testing git diff
import { prisma } from '@charmverse/core/prisma-client';

afterAll(() => {
  prisma.$disconnect();
});

// Mock external requests globally

jest.mock('lib/blockchain/getENSName', () => ({
  ...jest.requireActual('lib/blockchain/getENSName'),
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve(null))
}));

jest.mock('lib/blockchain/provider/alchemy', () => ({
  ...jest.requireActual('lib/blockchain/provider/alchemy'),
  __esModule: true,
  getNFTs: jest.fn().mockImplementation(() => Promise.resolve([]))
}));
