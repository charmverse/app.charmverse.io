import { prisma } from '@charmverse/core/prisma-client';
import fetchMock from 'fetch-mock-jest';

import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateUser } from 'testing/utils/users';

import { createConnectProject } from '../createConnectProject';

const mockSandbox = fetchMock.sandbox();

jest.mock('undici', () => {
  return { fetch: (...args: any[]) => mockSandbox(...args) };
});

afterAll(async () => {
  fetchMock.restore();
  await prisma.farcasterUser.deleteMany();
});

describe('createConnectProject', () => {
  it('should create a project with project members', async () => {
    const { user } = await generateUserAndSpace({
      isAdmin: true
    });

    const farcasterConnectedUser = await generateUser();

    await prisma.farcasterUser.create({
      data: {
        account: {},
        fid: 2,
        userId: farcasterConnectedUser.id
      }
    });

    const nonFarcasterConnectedUserWallet = randomETHWalletAddress().toLowerCase();
    const nonFarcasterConnectedUser = await generateUser();

    await prisma.userWallet.create({
      data: {
        userId: nonFarcasterConnectedUser.id,
        address: nonFarcasterConnectedUserWallet
      }
    });

    mockSandbox.get('https://searchcaster.xyz/api/profiles?fid=3', [
      {
        connectedAddresses: [nonFarcasterConnectedUserWallet]
      }
    ]);

    mockSandbox.get('https://searchcaster.xyz/api/profiles?fid=4', [
      {
        connectedAddresses: [randomETHWalletAddress().toLowerCase()],
        body: {
          username: 'user-4',
          displayName: 'User 4',
          bio: 'User 4 bio',
          avatarUrl: 'https://example.com/pfp.jpg'
        }
      }
    ]);

    const createdProject = await createConnectProject({
      input: {
        name: 'Project',
        projectMembers: [
          {
            farcasterId: 1,
            name: 'User 1'
          },
          {
            farcasterId: 2,
            name: 'User 2'
          },
          {
            farcasterId: 3,
            name: 'User 3'
          },
          {
            farcasterId: 4,
            name: 'User 4'
          }
        ]
      },
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
