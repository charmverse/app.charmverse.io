import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { randomETHWallet } from 'lib/utils/blockchain';

import { defaultProjectValues } from '../constants';
import { createProject } from '../createProject';

describe('createProject', () => {
  it('should throw error if no project members is provided', async () => {
    const { user } = await testUtilsUser.generateUserAndSpace();
    await expect(
      createProject({
        project: {
          ...defaultProjectValues,
          projectMembers: []
        },
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should create a project with members and connect with existing users or create new users', async () => {
    const { user: projectTeamLead } = await testUtilsUser.generateUserAndSpace();
    const walletAddressUser = await testUtilsUser.generateUser();
    const walletAddressUserAddress = randomETHWallet().address.toLowerCase();
    const verifiedEmailUser = await testUtilsUser.generateUser();
    const googleAccountUser = await testUtilsUser.generateUser();
    const verifiedEmailUserEmail = `${v4()}@gmail.com`;
    const googleAccountUserEmail = `${v4()}@gmail.com`;
    const nonConnectedWalletAddress = randomETHWallet().address.toLowerCase();
    const nonConnectedVerifiedEmail = `${v4()}@gmail.com`;
    const nonConnectedGoogleAccountEmail = `${v4()}@gmail.com`;

    await prisma.user.update({
      where: {
        id: walletAddressUser.id
      },
      data: {
        wallets: {
          create: {
            address: walletAddressUserAddress
          }
        }
      }
    });

    await prisma.user.update({
      where: {
        id: verifiedEmailUser.id
      },
      data: {
        verifiedEmails: {
          create: {
            email: verifiedEmailUserEmail,
            name: 'Test user verified email',
            avatarUrl: 'https://test.com/avatar.png'
          }
        }
      }
    });

    await prisma.user.update({
      where: {
        id: googleAccountUser.id
      },
      data: {
        googleAccounts: {
          create: {
            email: googleAccountUserEmail,
            name: 'Test user google account',
            avatarUrl: 'https://test.com/avatar.png'
          }
        }
      }
    });

    const projectTeamLeadWalletAddress = randomETHWallet().address;

    const createdProjectWithMembers = await createProject({
      project: {
        ...defaultProjectValues,
        blog: 'https://blog.com',
        projectMembers: [
          // Project lead
          {
            ...defaultProjectValues.projectMembers[0],
            walletAddress: projectTeamLeadWalletAddress
          },
          // Wallet address connected with user
          {
            ...defaultProjectValues.projectMembers[0],
            walletAddress: walletAddressUserAddress
          },
          // Wallet address not connected with user
          {
            ...defaultProjectValues.projectMembers[0],
            walletAddress: nonConnectedWalletAddress
          },
          // Google account connected with user
          {
            ...defaultProjectValues.projectMembers[0],
            email: googleAccountUserEmail
          },
          // Google account not connected with user
          {
            ...defaultProjectValues.projectMembers[0],
            email: nonConnectedGoogleAccountEmail
          },
          // Verified email connected with user
          {
            ...defaultProjectValues.projectMembers[0],
            email: verifiedEmailUserEmail
          },
          // Verified email not connected with user
          {
            ...defaultProjectValues.projectMembers[0],
            email: nonConnectedVerifiedEmail
          }
        ]
      },
      userId: projectTeamLead.id
    });

    expect(createdProjectWithMembers.blog).toBe('https://blog.com');
    expect(createdProjectWithMembers.projectMembers[0].teamLead).toBe(true);
    expect(createdProjectWithMembers.projectMembers[0].userId).toBe(projectTeamLead.id);
    expect(createdProjectWithMembers.projectMembers[0].walletAddress).toBe(projectTeamLeadWalletAddress);

    expect(createdProjectWithMembers.projectMembers[1].teamLead).toBe(false);
    expect(createdProjectWithMembers.projectMembers[1].userId).toBe(walletAddressUser.id);
    expect(createdProjectWithMembers.projectMembers[1].walletAddress).toBe(walletAddressUserAddress);

    const newWalletUser = await prisma.user.findFirstOrThrow({
      where: {
        wallets: {
          some: {
            address: nonConnectedWalletAddress
          }
        }
      }
    });

    expect(newWalletUser.claimed).toBe(false);
    expect(newWalletUser.identityType).toBe('Wallet');
    expect(createdProjectWithMembers.projectMembers[2].teamLead).toBe(false);
    expect(createdProjectWithMembers.projectMembers[2].userId).toBe(newWalletUser.id);

    expect(createdProjectWithMembers.projectMembers[3].teamLead).toBe(false);
    expect(createdProjectWithMembers.projectMembers[3].userId).toBe(googleAccountUser.id);
    expect(createdProjectWithMembers.projectMembers[3].email).toBe(googleAccountUserEmail);

    const newGoogleAccountUser = await prisma.user.findFirstOrThrow({
      where: {
        verifiedEmails: {
          some: {
            email: nonConnectedGoogleAccountEmail
          }
        }
      }
    });
    expect(newGoogleAccountUser.claimed).toBe(false);
    expect(newGoogleAccountUser.identityType).toBe('VerifiedEmail');
    expect(createdProjectWithMembers.projectMembers[4].teamLead).toBe(false);
    expect(createdProjectWithMembers.projectMembers[4].userId).toBe(newGoogleAccountUser.id);

    expect(createdProjectWithMembers.projectMembers[5].teamLead).toBe(false);
    expect(createdProjectWithMembers.projectMembers[5].userId).toBe(verifiedEmailUser.id);
    expect(createdProjectWithMembers.projectMembers[5].email).toBe(verifiedEmailUserEmail);

    const newVerifiedEmailUser = await prisma.user.findFirstOrThrow({
      where: {
        verifiedEmails: {
          some: {
            email: nonConnectedVerifiedEmail
          }
        }
      }
    });
    expect(newVerifiedEmailUser.claimed).toBe(false);
    expect(newVerifiedEmailUser.identityType).toBe('VerifiedEmail');
    expect(createdProjectWithMembers.projectMembers[6].teamLead).toBe(false);
    expect(createdProjectWithMembers.projectMembers[6].userId).toBe(newVerifiedEmailUser.id);
  });
});
