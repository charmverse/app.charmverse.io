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
          }
        ]
      }
    });

    expect(updatedProjectWithMembers.blog).toBe('https://blog.com');

    expect(updatedProjectWithMembers.projectMembers[0].teamLead).toBe(true);
    expect(updatedProjectWithMembers.projectMembers[0].userId).toBe(projectTeamLead.id);
    expect(updatedProjectWithMembers.projectMembers[0].walletAddress).toBe(walletAddressUserAddress);

    // Existing project user with wallet address should be updated
    expect(updatedProjectWithMembers.projectMembers[1].teamLead).toBe(false);
    expect(updatedProjectWithMembers.projectMembers[1].userId).toBe(walletAddressUser.id);
    expect(updatedProjectWithMembers.projectMembers[1].walletAddress).toBe(updatedWalletAddressUserAddress);

    // Random project user should be removed
    expect(
      updatedProjectWithMembers.projectMembers.find((member) => member.name === 'Random Project user')
    ).toBeUndefined();
    // Verified email project user should be removed
    expect(
      updatedProjectWithMembers.projectMembers.find((member) => member.email === verifiedEmailUserEmail)
    ).toBeUndefined();

    // New user with google account should be connected
    expect(updatedProjectWithMembers.projectMembers[2].teamLead).toBe(false);
    expect(updatedProjectWithMembers.projectMembers[2].userId).toBe(googleAccountUser.id);
    expect(updatedProjectWithMembers.projectMembers[2].email).toBe(googleAccountUserEmail);

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

    expect(newWalletUser.claimed).toBe(false);
    expect(updatedProjectWithMembers.projectMembers[3].teamLead).toBe(false);
    expect(updatedProjectWithMembers.projectMembers[3].userId).toBe(newWalletUser.id);
    expect(updatedProjectWithMembers.projectMembers[3].walletAddress).toBe(newWalletUserAddress);
  });
});
