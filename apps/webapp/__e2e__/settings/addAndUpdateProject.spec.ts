import { prisma, type User } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/config/constants';
import { generateSpaceUser } from '@packages/testing/setupDatabase';
import { randomETHWallet } from '@packages/utils/blockchain';
import { expect } from '@playwright/test';
import { ProjectSettings } from '__e2e__/po/settings/projectSettings.po';
import { v4 } from 'uuid';

import { test } from '../testWithFixtures';
import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

test.describe.serial('Create and edit project from user settings', () => {
  let spaceUser: User;
  let projectId: string;
  const verifiedEmail = `${v4()}@charmverse.com`;
  let verifiedEmailUser: User;

  test('Create a project from user settings', async ({ page, projectSettings }) => {
    const { user, space } = await generateUserAndSpace({
      spaceDomain: `cvt-charmverse-${v4()}`,
      isAdmin: true,
      onboarded: true
    });

    const [spaceUserWithWallet, spaceUserWithVerifiedEmail] = await Promise.all([
      generateSpaceUser({
        spaceId: space.id,
        onboarded: true
      }),
      generateSpaceUser({
        spaceId: space.id,
        onboarded: true
      })
    ]);

    verifiedEmailUser = spaceUserWithVerifiedEmail;

    await prisma.verifiedEmail.create({
      data: {
        userId: spaceUserWithVerifiedEmail.id,
        email: verifiedEmail,
        avatarUrl: '',
        name: 'Test User'
      }
    });

    const spaceUserWallet = await prisma.userWallet.findFirstOrThrow({
      where: {
        userId: spaceUserWithWallet.id
      }
    });

    spaceUser = user;
    await login({ page, userId: user.id });

    await page.goto(baseUrl as string);

    await projectSettings.openSettingsModal();

    await projectSettings.goToTab('projects');

    await projectSettings.addProjectButton.click();
    await projectSettings.fillProjectField({ fieldName: 'name', content: 'Test Project' });
    await projectSettings.fillProjectField({
      fieldName: 'projectMembers[0].name',
      content: 'Project Member Team Lead'
    });
    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: 'invalid-wallet-address' });
    await expect(projectSettings.saveNewProjectButton).toBeDisabled();

    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: randomETHWallet().address });

    await projectSettings.addProjectMemberButton.click();
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[1].name', content: 'Project Member 2' });
    await projectSettings.fillProjectField({
      fieldName: 'projectMembers[1].walletAddress',
      content: spaceUserWallet.address
    });

    await projectSettings.addProjectMemberButton.click();
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[2].name', content: 'Project Member 3' });
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[2].email', content: verifiedEmail });

    const responsePromise = projectSettings.page.waitForResponse((response) => {
      return response.request().method() === 'POST' && /\/api\/projects/.test(response.url());
    });
    await projectSettings.saveNewProjectButton.click();
    await responsePromise;

    const project = await prisma.project.findFirstOrThrow({
      where: {
        createdBy: spaceUser.id
      }
    });

    projectId = project.id;

    const projectMemberWithWalletAddress = await prisma.projectMember.findFirstOrThrow({
      where: {
        walletAddress: spaceUserWallet.address,
        userId: spaceUserWithWallet.id
      }
    });
    expect(projectMemberWithWalletAddress).toBeDefined();

    await login({ page, userId: spaceUserWithWallet.id });
    await page.goto(baseUrl as string);
    await projectSettings.openSettingsModal();
    await projectSettings.goToTab('projects');

    expect(await projectSettings.getProjectTitle({ projectId }).textContent()).toBe('Test Project');

    await login({ page, userId: spaceUserWithVerifiedEmail.id });
    await page.goto(baseUrl as string);
    await projectSettings.openSettingsModal();
    await projectSettings.goToTab('projects');

    expect(await projectSettings.getProjectTitle({ projectId }).textContent()).toBe('Test Project');

    const projectMemberWithVerifiedEmail = await prisma.projectMember.findFirstOrThrow({
      where: {
        email: verifiedEmail,
        userId: spaceUserWithVerifiedEmail.id
      }
    });
    expect(projectMemberWithVerifiedEmail).toBeDefined();
  });

  test('Edit a project from user settings', async ({ page, projectSettings }) => {
    await login({ page, userId: spaceUser.id });
    await page.goto(baseUrl as string);
    await projectSettings.openSettingsModal();
    await projectSettings.goToTab('projects');

    await projectSettings.clickProject({ projectId });

    await projectSettings.fillProjectField({ fieldName: 'name', content: 'Updated Test Project' });
    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: 'invalid-wallet-address' });
    await expect(projectSettings.saveProjectButton).toBeDisabled();

    const updatedWalletAddress = randomETHWallet().address;
    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: updatedWalletAddress });
    await projectSettings.fillProjectField({
      fieldName: 'projectMembers[0].name',
      content: 'Updated Project Member Team Lead'
    });
    const responsePromise = projectSettings.page.waitForResponse((response) => {
      return response.request().method() === 'PUT' && /\/api\/projects/.test(response.url());
    });
    await projectSettings.saveProjectButton.click();
    await responsePromise;

    const updatedProject = await prisma.project.findFirstOrThrow({
      where: {
        id: projectId
      },
      select: {
        name: true,
        walletAddress: true,
        projectMembers: {
          select: {
            name: true
          }
        }
      }
    });

    expect(updatedProject.name).toBe('Updated Test Project');
    expect(updatedProject.walletAddress).toBe(updatedWalletAddress.toLowerCase());
    expect(updatedProject.projectMembers[0].name).toBe(`Updated Project Member Team Lead`);
  });

  test('Delete a project member from user settings', async ({ page, projectSettings }) => {
    await login({ page, userId: spaceUser.id });
    await page.goto(baseUrl as string);
    await projectSettings.openSettingsModal();
    await projectSettings.goToTab('projects');

    await projectSettings.clickProject({ projectId });
    await projectSettings.deleteProjectMemberButton.nth(1).click();
    const responsePromise = projectSettings.page.waitForResponse((response) => {
      return response.request().method() === 'PUT' && /\/api\/projects/.test(response.url());
    });
    await projectSettings.saveProjectButton.click();
    await responsePromise;

    const updatedProjectWithMembers = await prisma.project.findFirstOrThrow({
      where: {
        id: projectId
      },
      select: {
        projectMembers: {
          select: {
            userId: true
          }
        }
      }
    });

    expect(updatedProjectWithMembers.projectMembers).toHaveLength(2);
    expect(updatedProjectWithMembers.projectMembers.map((member) => member.userId)).not.toContain(verifiedEmailUser.id);

    await login({ page, userId: verifiedEmailUser.id });
    await page.goto(baseUrl as string);
    await projectSettings.openSettingsModal();
    await projectSettings.goToTab('projects');

    expect(await projectSettings.page.locator(`data-test=project-title-${projectId}`).count()).toBe(0);
  });
});
