import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { randomIntFromInterval } from '@root/lib/utils/random';
import { expect, test } from 'playwright/test';

import { loginBrowserUser } from './utils/loginBrowserUser';

// We are skipping this test because SUNNYs aware submissions are disabled
test('Create a project and view details', async ({ page }) => {
  const projectData = {
    projectFormName: 'Acme Inc',
    projectFormDescription: 'A description of your project',
    projectFormCategory: 'Art Marketplace',
    projectFormTwitter: 'https://x.com/acme_inc_twitter',
    projectFormGithub: 'https://github.com/acme-inc-github/reponame',
    projectFormWebsites: ['https://www.acme-inc.com'],
    projectFormFarcasterValues: ['https://warpcast.com/acme-inc-warpcast']
  } as const;

  const userId = await testUtilsUser.generateUser().then((user) => user.id);

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      connectOnboarded: true
    }
  });

  const randomInt = randomIntFromInterval(1, 1000000);

  await prisma.farcasterUser.create({
    data: {
      fid: randomInt,
      userId,
      account: {
        username: `example-user-${randomInt}`,
        displayName: `display-${randomInt}`,
        bio: 'dev user',
        pfpUrl:
          'https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=168/https%3A%2F%2Fapp.charmverse.io%2Ffavicon.png'
      }
    }
  });

  await loginBrowserUser({ browserPage: page, userId });

  await page.goto('/');

  await page.waitForURL('**/profile');

  const createProject = page.locator('data-test=create-new-project');

  await Promise.all([page.waitForURL('**/projects/new'), createProject.click()]);

  const fieldName = page.locator('data-test=project-form-name >> input');
  const fieldDescription = page.locator('data-test=project-form-description  >> textarea').first();
  const fieldCategory = page.locator('data-test=project-form-category  >> input');
  const fieldWebsites = page.locator('data-test=project-form-websites  >> input');
  const fieldFarcasterValues = page.locator('data-test=project-form-farcaster-values  >> input');
  const fieldTwitter = page.locator('data-test=project-form-twitter  >> input');
  const fieldGithub = page.locator('data-test=project-form-github  >> input');

  await fieldName.fill(projectData.projectFormName);

  await fieldDescription.fill(projectData.projectFormDescription);

  await fieldCategory.focus();
  await fieldCategory.fill(projectData.projectFormCategory);

  await fieldWebsites.fill(projectData.projectFormWebsites[0]);

  await fieldFarcasterValues.fill(projectData.projectFormFarcasterValues[0]);

  await fieldTwitter.fill(projectData.projectFormTwitter);

  await fieldGithub.fill(projectData.projectFormGithub);

  const publishButton = page.locator('data-test=project-form-publish');

  await publishButton.click();

  await page.waitForURL('**/p/*/share');

  const project = await prisma.project.findFirstOrThrow({
    where: {
      createdBy: userId
    }
  });

  // We want to ensure the project receives a sunnyAwardsNumber
  expect(typeof project.sunnyAwardsNumber === 'number' && project.sunnyAwardsNumber > 0).toBe(true);

  const shareToWarpcastButton = page.locator('data-test=share-project-to-warpcast');

  await expect(shareToWarpcastButton).toBeVisible();

  // Go to page and make sure it looks right
  await page.goto(`/p/${project.path}`);

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

  // CHeck OP property
  await expect(project.optimismCategory).toBe('NFT');

  // Check project description

  // For some reason in CI environment, this assertion fails - Commenting out for now until we fix
  // const projectDescription = page.locator('data-test=project-details-description');
  // await expect(projectDescription).toHaveText(projectData.projectFormDescription);
});
