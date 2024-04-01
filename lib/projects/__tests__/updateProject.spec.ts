import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { randomETHWallet } from 'lib/utils/blockchain';

import { defaultProjectValues } from '../constants';
import { updateProject } from '../updateProject';

describe('updateProject', () => {
  it('should update a project with members and connect with new users', async () => {
    const { user: projectTeamLead } = await testUtilsUser.generateUserAndSpace();
    const projectTeamLeadEmail = `${v4()}@gmail.com`;
    const projectTeamLeadAddress = randomETHWallet().address.toLowerCase();

    const walletAddressUser = await testUtilsUser.generateUser();
    const walletAddressUserAddress = randomETHWallet().address.toLowerCase();
    const updatedWalletAddressUserAddress = randomETHWallet().address.toLowerCase();

    const verifiedEmailUser = await testUtilsUser.generateUser();
    const googleAccountUser = await testUtilsUser.generateUser();
    const verifiedEmailUserEmail = `${v4()}@gmail.com`;
    const googleAccountUserEmail = `${v4()}@gmail.com`;

    const newWalletUserAddress = randomETHWallet().address.toLowerCase();
    const newGoogleAccountUserEmail = `${v4()}@gmail.com`;
    const newVerifiedEmailUserEmail = `${v4()}@gmail.com`;

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

    const createdProject = await prisma.project.create({
      data: {
        name: 'Test project',
        updatedBy: projectTeamLead.id,
        projectMembers: {
          createMany: {
            data: [
              {
                name: 'Team Lead',
                email: projectTeamLeadEmail,
                teamLead: true,
                userId: projectTeamLead.id,
                updatedBy: projectTeamLead.id,
                walletAddress: projectTeamLeadAddress
              },
              // Update user with wallet address
              {
                email: '',
                name: 'Wallet address user',
                updatedBy: projectTeamLead.id,
                walletAddress: walletAddressUserAddress,
                userId: walletAddressUser.id
              },
              // Remove project user without any user connected
              {
                email: '',
                name: 'Random Project user',
                updatedBy: projectTeamLead.id,
                walletAddress: ''
              },
              // Remove project user with user connected
              {
                email: verifiedEmailUserEmail,
                name: 'Verified Email Project user',
                updatedBy: projectTeamLead.id,
                walletAddress: '',
                userId: verifiedEmailUser.id
              }
            ]
          }
        },
        walletAddress: '',
        createdBy: projectTeamLead.id
      },
      include: {
        projectMembers: true
      }
    });

    const updatedProjectWithMembers = await updateProject({
      projectId: createdProject.id,
      userId: projectTeamLead.id,
      payload: {
        ...defaultProjectValues,
        blog: 'https://blog.com',
        projectMembers: [
          // Making sure team lead doesn't get connected with a different user
          {
            ...defaultProjectValues.projectMembers[0],
            id: createdProject.projectMembers[0].id,
            walletAddress: walletAddressUserAddress
          },
          // Update existing project user with wallet address connected
          {
            ...defaultProjectValues.projectMembers[0],
            walletAddress: updatedWalletAddressUserAddress,
            id: createdProject.projectMembers[1].id
          },
          // Connect new user with google account
          {
            ...defaultProjectValues.projectMembers[0],
            email: googleAccountUserEmail
          },
          // Add new user with wallet address
          {
            ...defaultProjectValues.projectMembers[0],
            name: 'New Wallet Project Member',
            walletAddress: newWalletUserAddress,
            email: ''
          },
          // Add new user with google account
          {
            ...defaultProjectValues.projectMembers[0],
            name: 'New Google Account Project Member',
            email: newGoogleAccountUserEmail
          },
          // Add new user with verified email
          {
            ...defaultProjectValues.projectMembers[0],
            name: 'New Verified Email Project Member',
            email: newVerifiedEmailUserEmail
          }
        ]
      }
    });

    // A new user will be created and added to project member
    const newWalletUser = await prisma.user.findFirstOrThrow({
      where: {
        wallets: {
          some: {
            address: newWalletUserAddress
          }
        }
      }
    });

    const newVerifiedEmailUser = await prisma.user.findFirstOrThrow({
      where: {
        verifiedEmails: {
          some: {
            email: newVerifiedEmailUserEmail
          }
        }
      }
    });

    const newGoogleAccountUser = await prisma.user.findFirstOrThrow({
      where: {
        verifiedEmails: {
          some: {
            email: newGoogleAccountUserEmail
          }
        }
      }
    });

    expect(updatedProjectWithMembers).toEqual(
      expect.objectContaining({
        blog: 'https://blog.com',
        projectMembers: expect.arrayContaining([
          expect.objectContaining({
            teamLead: true,
            userId: projectTeamLead.id,
            walletAddress: walletAddressUserAddress
          }),
          expect.objectContaining({
            teamLead: false,
            userId: walletAddressUser.id,
            walletAddress: updatedWalletAddressUserAddress
          }),
          expect.objectContaining({
            teamLead: false,
            userId: googleAccountUser.id,
            email: googleAccountUserEmail
          }),
          expect.objectContaining({
            teamLead: false,
            userId: newWalletUser.id,
            walletAddress: newWalletUserAddress
          }),
          expect.objectContaining({
            teamLead: false,
            userId: newGoogleAccountUser.id,
            email: newGoogleAccountUserEmail
          }),
          expect.objectContaining({
            teamLead: false,
            userId: newVerifiedEmailUser.id,
            email: newVerifiedEmailUserEmail
          })
        ])
      })
    );

    // Check that certain members do not exist
    expect(updatedProjectWithMembers.projectMembers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Random Project user'
        }),
        expect.objectContaining({
          email: verifiedEmailUserEmail
        })
      ])
    );
  });
});
