import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { randomETHWallet } from '@packages/utils/blockchain';
import { v4 } from 'uuid';

import { createDefaultProject, defaultProjectMember } from '../constants';
import { createProject } from '../createProject';

describe('createProject', () => {
  it('should throw error if no project members is provided', async () => {
    const { user } = await testUtilsUser.generateUserAndSpace();
    await expect(
      createProject({
        project: createDefaultProject(),
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
        ...createDefaultProject(),
        websites: ['https://blog.com'],
        projectMembers: [
          // Project lead
          defaultProjectMember({
            teamLead: true,
            walletAddress: projectTeamLeadWalletAddress
          }),
          // Wallet address connected with user
          defaultProjectMember({
            walletAddress: walletAddressUserAddress
          }),
          // Wallet address not connected with user
          defaultProjectMember({
            walletAddress: nonConnectedWalletAddress
          }),
          // Google account connected with user
          defaultProjectMember({
            email: googleAccountUserEmail
          }),
          // Google account not connected with user
          defaultProjectMember({
            email: nonConnectedGoogleAccountEmail
          }),
          // Verified email connected with user
          defaultProjectMember({
            email: verifiedEmailUserEmail
          }),
          // Verified email not connected with user
          defaultProjectMember({
            email: nonConnectedVerifiedEmail
          })
        ]
      },
      userId: projectTeamLead.id
    });

    const newGoogleAccountUser = await prisma.user.findFirstOrThrow({
      where: {
        verifiedEmails: {
          some: {
            email: nonConnectedGoogleAccountEmail
          }
        }
      }
    });

    const newWalletUser = await prisma.user.findFirstOrThrow({
      where: {
        wallets: {
          some: {
            address: nonConnectedWalletAddress
          }
        }
      }
    });

    const newVerifiedEmailUser = await prisma.user.findFirstOrThrow({
      where: {
        verifiedEmails: {
          some: {
            email: nonConnectedVerifiedEmail
          }
        }
      }
    });

    expect(createdProjectWithMembers).toEqual(
      expect.objectContaining({
        websites: ['https://blog.com'],
        projectMembers: expect.arrayContaining([
          expect.objectContaining({
            teamLead: true,
            userId: projectTeamLead.id,
            walletAddress: projectTeamLeadWalletAddress
          }),
          expect.objectContaining({
            teamLead: false,
            userId: walletAddressUser.id,
            walletAddress: walletAddressUserAddress
          }),
          expect.objectContaining({
            teamLead: false,
            userId: newWalletUser.id
          }),
          expect.objectContaining({
            teamLead: false,
            userId: googleAccountUser.id,
            email: googleAccountUserEmail
          }),
          expect.objectContaining({
            teamLead: false,
            userId: newGoogleAccountUser.id
          }),
          expect.objectContaining({
            teamLead: false,
            userId: verifiedEmailUser.id,
            email: verifiedEmailUserEmail
          }),
          expect.objectContaining({
            teamLead: false,
            userId: newVerifiedEmailUser.id
          })
        ])
      })
    );

    expect(newWalletUser).toEqual(
      expect.objectContaining({
        claimed: false,
        identityType: 'Wallet'
      })
    );

    expect(newGoogleAccountUser).toEqual(
      expect.objectContaining({
        claimed: false,
        identityType: 'VerifiedEmail'
      })
    );

    expect(newVerifiedEmailUser).toEqual(
      expect.objectContaining({
        claimed: false,
        identityType: 'VerifiedEmail'
      })
    );
  });
});
