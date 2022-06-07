// mock the db file with a prisma client that we can disconnect from the db after tests are run
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterAll(() => {
  prisma.$disconnect();
});

jest.mock('./db', () => ({
  __esModule: true,
  prisma
}));

jest.mock('lib/blockchain/getENSName', () => ({
  ...jest.requireActual('lib/blockchain/getENSName'),
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return Promise.resolve(null);
  })
}));
