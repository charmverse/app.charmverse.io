import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { expect, test } from 'e2e/testWithFixtures';

import { randomIntFromInterval } from 'lib/utils/random';

import { loginBrowserUser } from './utils/loginBrowserUser';

test('Create a project and view details', async ({ page }) => {
  const projectData = {
    projectFormName: 'Acme Inc',
    projectFormDescription: 'A description of your project',
    projectFormCategory: 'DeFi',
    projectFormTwitter: 'https://www.twitter.com/acme-inc-twitter',
    projectFormGithub: 'https://www.github.com/acme-inc-github',
    projectFormMirror: 'https://www.mirror.xyz/acme-inc-mirror',
    projectFormWebsites: ['https://www.acme-inc.com'],
    projectFormFarcasterValues: ['https://warpcast.com/acme-inc-warpcast']
  };

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

  await createProject.click();

  await page.waitForURL('**/projects/new');

  const fieldName = page.locator('data-test=project-form-name >> input');
  const fieldDescription = page.locator('data-test=project-form-description  >> textarea').first();
  const fieldCategory = page.locator('data-test=project-form-category  >> input');
  const fieldWebsites = page.locator('data-test=project-form-websites  >> input');
  const fieldFarcasterValues = page.locator('data-test=project-form-farcaster-values  >> input');
  const fieldTwitter = page.locator('data-test=project-form-twitter  >> input');
  const fieldGithub = page.locator('data-test=project-form-github  >> input');
  const fieldMirror = page.locator('data-test=project-form-mirror >> input');

  await fieldName.focus();
  await page.keyboard.type(projectData.projectFormName);

  await fieldDescription.focus();
  await page.keyboard.type(projectData.projectFormDescription);

  await fieldCategory.focus();
  await page.keyboard.type(projectData.projectFormCategory);

  await fieldWebsites.focus();
  await page.keyboard.type(projectData.projectFormWebsites[0]);

  await fieldFarcasterValues.focus();
  await page.keyboard.type(projectData.projectFormFarcasterValues[0]);

  await fieldTwitter.focus();
  await page.keyboard.type(projectData.projectFormTwitter);

  await fieldGithub.focus();
  await page.keyboard.type(projectData.projectFormGithub);

  await fieldMirror.focus();
  await page.keyboard.type(projectData.projectFormMirror);

  const confirmButton = page.locator('data-test=project-form-confirm-values');

  await confirmButton.click();

  const addTeam = page.locator('data-test=project-form-add-team');

  await expect(addTeam).toBeVisible();

  const publishButton = page.locator('data-test=project-form-publish');

  await Promise.all([page.waitForURL('**/p/*/publish'), publishButton.click()]);

  const gitcoinSkipAttestation = page.locator('data-test=project-skip-gitcoin-attestation');

  await gitcoinSkipAttestation.click();

  const projectPath = await prisma.project
    .findFirstOrThrow({
      where: {
        createdBy: userId
      }
    })
    .then((project) => project.path);

  await page.waitForURL(`**/p/${projectPath}`);

  // Check project name
  const projectName = await page.locator('data-test=project-name');
  await expect(projectName).toHaveText(projectData.projectFormName);

  // Check project website
  const projectWebsite = await page.locator('data-test=project-details-website');
  await expect(projectWebsite).toHaveText(projectData.projectFormWebsites[0].replace(/https?:\/\//, ''));

  // Check project Farcaster
  const projectFarcaster = await page.locator('data-test=project-details-farcaster');
  if ((await projectFarcaster.count()) > 0) {
    await expect(projectFarcaster).toHaveText(
      projectData.projectFormFarcasterValues[0].replace(/https?:\/\/warpcast.com\//, '')
    );
  }

  // Check project Twitter
  const projectTwitter = await page.locator('data-test=project-details-twitter');
  if ((await projectTwitter.count()) > 0) {
    await expect(projectTwitter).toHaveText(projectData.projectFormTwitter.replace(/https?:\/\/www.twitter.com\//, ''));
  }

  // Check project GitHub
  const projectGithub = await page.locator('data-test=project-details-github');
  if ((await projectGithub.count()) > 0) {
    await expect(projectGithub).toHaveText(projectData.projectFormGithub.replace(/https?:\/\/www.github.com\//, ''));
  }

  // Check project Mirror
  const projectMirror = await page.locator('data-test=project-details-mirror');
  if ((await projectMirror.count()) > 0) {
    await expect(projectMirror).toHaveText(projectData.projectFormMirror.replace(/https?:\/\/www.mirror.xyz\//, ''));
  }

  // Check project description

  const projectDescription = await page.locator('data-test=project-details-description');
  await expect(projectDescription).toHaveText(projectData.projectFormDescription);
});
