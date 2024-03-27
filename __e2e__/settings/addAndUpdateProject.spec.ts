import { prisma, type User } from '@charmverse/core/prisma-client';
import { test as base, expect } from '@playwright/test';
import { ProjectSettings } from '__e2e__/po/settings/projectSettings.po';
import { v4 } from 'uuid';

import { baseUrl } from 'config/constants';
import { randomETHWallet } from 'lib/utils/blockchain';

import { generateUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  projectSettings: ProjectSettings;
};

const test = base.extend<Fixtures>({
  projectSettings: ({ page }, use) => use(new ProjectSettings(page))
});

test.describe.serial('Create and edit project from user settings', () => {
  let spaceUser: User;
  test('Create a project from user settings', async ({ page, projectSettings }) => {
    const { user } = await generateUserAndSpace({
      spaceDomain: `cvt-charmverse-${v4()}`,
      isAdmin: true,
      onboarded: true
    });

    spaceUser = user;
    await login({ page, userId: user.id });

    await page.goto(baseUrl as string);

    await projectSettings.openSettingsModal();

    await projectSettings.goToTab('projects');

    await projectSettings.addProjectButton.click();
    await projectSettings.fillProjectField({ fieldName: 'name', content: 'Test Project' });
    await projectSettings.fillProjectField({ fieldName: 'projectMembers[0].name', content: 'Project Member 1 Name' });
    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: 'invalid-wallet-address' });
    await expect(projectSettings.saveNewProjectButton).toBeDisabled();

    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: randomETHWallet().address });
    await projectSettings.saveNewProjectButton.click();
  });

  test('Edit a project from user settings', async ({ page, projectSettings }) => {
    const project = await prisma.project.findFirstOrThrow({
      where: {
        createdBy: spaceUser.id
      },
      select: {
        id: true
      }
    });

    const projectId = project.id;
    await login({ page, userId: spaceUser.id });
    await page.goto(baseUrl as string);
    await projectSettings.openSettingsModal();
    await projectSettings.goToTab('projects');

    await projectSettings.clickProject({ projectId });

    expect(await projectSettings.getProjectField({ fieldName: 'name' }).inputValue()).toBe('Test Project');
    expect(await projectSettings.getProjectField({ fieldName: 'projectMembers[0].name' }).inputValue()).toBe(
      'Project Member 1 Name'
    );

    await projectSettings.fillProjectField({ fieldName: 'name', content: 'Updated Test Project' });
    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: 'invalid-wallet-address' });
    await expect(projectSettings.saveProjectButton).toBeDisabled();

    await projectSettings.fillProjectField({ fieldName: 'walletAddress', content: randomETHWallet().address });
    await projectSettings.saveProjectButton.click();
  });
});
