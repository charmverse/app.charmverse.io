import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { randomETHWallet } from '@packages/utils/blockchain';
import { v4 } from 'uuid';

import { createDefaultProject, defaultProjectMember } from '../constants';
import { createProject } from '../createProject';
import { updateProjectAndMembers } from '../updateProjectAndMembers';

describe('updateProjectAndMembers', () => {
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

    const walletAddressUser2 = await testUtilsUser.generateUser();
    const walletAddressUser2Address = randomETHWallet().address.toLowerCase();

    await prisma.user.update({
      where: {
        id: walletAddressUser2.id
      },
      data: {
        wallets: {
          create: {
            address: walletAddressUser2Address
          }
        }
      }
    });

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

    const createdProject = await createProject({
      userId: projectTeamLead.id,
      project: {
        ...createDefaultProject(),
        name: 'Test project',
        projectMembers: [
          defaultProjectMember({
            teamLead: true,
            name: 'Team Lead',
            email: projectTeamLeadEmail,
            userId: projectTeamLead.id,
            walletAddress: projectTeamLeadAddress
          }),
          // Update user with wallet address
          defaultProjectMember({
            email: '',
            name: 'Wallet address user',
            walletAddress: walletAddressUserAddress,
            userId: walletAddressUser.id
          }),
          // Remove project user without any user connected
          defaultProjectMember({
            email: '',
            name: 'Random Project user',
            walletAddress: ''
          }),
          // Remove project user with user connected
          defaultProjectMember({
            email: verifiedEmailUserEmail,
            name: 'Verified Email Project user',
            walletAddress: '',
            userId: verifiedEmailUser.id
          }),
          // Connect user id with a project member without any wallet address or email
          defaultProjectMember({
            email: '',
            name: 'Random Project user 2',
            walletAddress: ''
          })
        ]
      }
    });

    const updatedProjectWithMembers = await updateProjectAndMembers({
      projectId: createdProject.id,
      userId: projectTeamLead.id,
      payload: {
        ...createDefaultProject(),
        websites: ['https://blog.com'],
        projectMembers: [
          // Making sure team lead doesn't get connected with a different user
          {
            ...createdProject.projectMembers[0],
            walletAddress: walletAddressUserAddress
          },
          // Update existing project user with wallet address connected
          {
            ...createdProject.projectMembers[1],
            walletAddress: updatedWalletAddressUserAddress
          },
          // Connect new user with google account
          defaultProjectMember({
            email: googleAccountUserEmail
          }),
          // Add new user with wallet address
          defaultProjectMember({
            name: 'New Wallet Project Member',
            walletAddress: newWalletUserAddress,
            email: ''
          }),
          // Add new user with google account
          defaultProjectMember({
            name: 'New Google Account Project Member',
            email: newGoogleAccountUserEmail
          }),
          // Add new user with verified email
          defaultProjectMember({
            name: 'New Verified Email Project Member',
            email: newVerifiedEmailUserEmail
          }),
          // Remove project user without any user connected
          {
            ...createdProject.projectMembers[2],
            walletAddress: walletAddressUser2Address
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
        websites: ['https://blog.com'],
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
          }),
          expect.objectContaining({
            teamLead: false,
            userId: walletAddressUser2.id,
            walletAddress: walletAddressUser2Address
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
