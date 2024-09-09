import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { randomIntFromInterval } from '@root/lib/utils/random';
import { expect, test } from 'playwright/test';

import { loginBrowserUser } from './utils/loginBrowserUser';

test('View project details', async ({ page }) => {
  const projectData = {
    projectFormName: 'Acme Inc',
    projectFormDescription: 'A description of your project',
    projectFormCategory: 'Art Marketplace',
    projectFormTwitter: 'https://twitter.com/acme_inc_twitter',
    projectFormGithub: 'https://github.com/acme-inc-github/reponame',
    projectFormWebsites: ['https://www.acme-inc.com'],
    projectFormFarcasterValues: ['https://warpcast.com/acme-inc-warpcast']
  };

  const userId = await testUtilsUser.generateUser().then((user) => user.id);
  const randomInt = randomIntFromInterval(1, 1000000);

  // Create the entire project via Prisma
  const project = await prisma.project.create({
    data: {
      name: projectData.projectFormName,
      description: projectData.projectFormDescription,
      category: projectData.projectFormCategory,
      path: `acme-inc-${randomInt}`,
      createdBy: userId,
      sunnyAwardsNumber: randomInt, // Assuming you are assigning a sunnyAwardsNumber here
      updatedBy: userId,
      websites: projectData.projectFormWebsites,
      farcasterValues: projectData.projectFormFarcasterValues,
      twitter: projectData.projectFormTwitter,
      github: projectData.projectFormGithub
    }
  });

  // Login and navigate to the project page
  await loginBrowserUser({ browserPage: page, userId });
  await page.goto(`/p/${project.path}`);

  // Assertions after navigating to project page

  // Check project name
  const projectName = page.locator('data-test=project-name');
  await expect(projectName).toHaveText(projectData.projectFormName);

  // Check project website
  const projectWebsite = page.locator('data-test=project-website');
  await expect(projectWebsite).toBeVisible();

  // Check project Farcaster
  const projectFarcaster = page.locator('data-test=project-farcaster');
  await expect(projectFarcaster).toBeVisible();

  // Check project Twitter
  const projectTwitter = page.locator('data-test=project-twitter');
  await expect(projectTwitter).toBeVisible();

  // Check project GitHub
  const projectGithub = page.locator('data-test=project-github');
  await expect(projectGithub).toBeVisible();
});
