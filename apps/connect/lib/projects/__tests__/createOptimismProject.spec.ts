import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsRandom, testUtilsUser } from '@charmverse/core/test';
import { createProject } from '@connect-shared/lib/projects/createProject';
import fetchMock from 'fetch-mock-jest';

const mockSandbox = fetchMock.sandbox();

jest.mock('undici', () => {
  // @ts-ignore
  return { fetch: (...args) => mockSandbox(...args) };
});

afterAll(async () => {
  fetchMock.restore();
  await prisma.farcasterUser.deleteMany();
});

describe('createProject', () => {
  it('should create a project with project members', async () => {
    const { user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const farcasterConnectedUser = await testUtilsUser.generateUser();

    await prisma.farcasterUser.create({
      data: {
        account: {},
        fid: 2,
        userId: farcasterConnectedUser.id
      }
    });

    const nonFarcasterConnectedUserWallet = testUtilsRandom.randomETHWalletAddress().toLowerCase();
    const nonFarcasterConnectedUser = await testUtilsUser.generateUser();

    await prisma.userWallet.create({
      data: {
        userId: nonFarcasterConnectedUser.id,
        address: nonFarcasterConnectedUserWallet
      }
    });

    mockSandbox.get('https://api.neynar.com/v2/farcaster/user/bulk?fids[]=3', {
      users: [
        {
          custody_address: nonFarcasterConnectedUserWallet,
          verified_addresses: {
            eth_addresses: [nonFarcasterConnectedUserWallet]
          }
        }
      ]
    });

    const walletAddress = testUtilsRandom.randomETHWalletAddress();

    mockSandbox.get('https://api.neynar.com/v2/farcaster/user/bulk?fids[]=4', {
      users: [
        {
          custody_address: walletAddress,
          verified_addresses: {
            eth_addresses: [walletAddress]
          },
          username: 'user-4',
          display_name: 'User 4',
          profile: {
            bio: {
              text: 'User 4 bio'
            }
          },
          pfp_url: 'https://example.com/pfp.jpg'
        }
      ]
    });

    const createdProject = await createProject({
      input: {
        name: 'Project',
        description: 'Project description',
        optimismCategory: 'CeFi',
        projectMembers: [
          {
            farcasterId: 1
          },
          {
            farcasterId: 2
          },
          {
            farcasterId: 3
          },
          {
            farcasterId: 4
          }
        ]
      },
      source: 'connect',
      userId: user.id
    });

    const project = await prisma.project.findUnique({
      where: {
        id: createdProject.id
      },
      select: {
        name: true,
        projectMembers: {
          select: {
            userId: true,
            name: true,
            farcasterId: true,
            teamLead: true
          }
        }
      }
    });

    const farcasterUserFid3 = await prisma.farcasterUser.findFirst({
      where: {
        fid: 3,
        userId: nonFarcasterConnectedUser.id
      }
    });

    const farcasterUserFid4 = await prisma.farcasterUser.findFirst({
      where: {
        fid: 4
      }
    });

    expect(farcasterUserFid3).toBeDefined();
    expect(farcasterUserFid4).toBeDefined();

    expect(project).toMatchObject({
      name: 'Project',
      projectMembers: [
        {
          teamLead: true,
          userId: user.id,
          name: 'User 1',
          farcasterId: 1
        },
        {
          teamLead: false,
          userId: farcasterConnectedUser.id,
          name: 'User 2',
          farcasterId: 2
        },
        {
          teamLead: false,
          userId: nonFarcasterConnectedUser.id,
          name: 'User 3',
          farcasterId: 3
        },
        {
          teamLead: false,
          userId: expect.any(String),
          name: 'User 4',
          farcasterId: 4
        }
      ]
    });
  });
});
