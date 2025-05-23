import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateProposalWorkflow } from '@packages/lib/testing/proposals';
import { baseUrl } from '@packages/testing/mockApiCall';
import { expect } from '__e2e__/testWithFixtures';
import { test } from '__e2e__/utils/test';

import { generateUser, generateUserAndSpace, loginBrowserUser, logoutBrowserUser } from '../utils/mocks';

test.skip('Create a proposal from a linked proposal template /member', async ({ page, proposalPage, documentPage }) => {
  const { user: admin, space } = await generateUserAndSpace({ isAdmin: true });

  const member = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

  await prisma.spaceRole.update({
    where: {
      spaceUser: {
        userId: member.id,
        spaceId: space.id
      }
    },
    data: {
      onboarded: true
    }
  });

  const workflow = await generateProposalWorkflow({ spaceId: space.id });

  const template = await testUtilsProposals
    .generateProposal({
      spaceId: space.id,
      userId: admin.id,
      workflowId: workflow.id
    })
    .then((p) => prisma.page.update({ where: { id: p.id }, data: { type: 'proposal_template' } }));

  const pageReferencingTemplate = await testUtilsPages.generatePage({
    createdBy: admin.id,
    spaceId: space.id,
    title: 'Join us!',
    content: {
      type: 'doc',
      content: [
        {
          type: 'linkedPage',
          attrs: {
            id: template.id,
            path: template.path,
            type: 'proposal_template',
            track: []
          }
        },
        { type: 'paragraph', attrs: { track: [] } }
      ]
    },
    pagePermissions: [{ assignee: { group: 'space', id: space.id }, permissionLevel: 'full_access' }]
  });

  // Log in the browser admin

  await loginBrowserUser({ browserPage: page, userId: member.id });

  await documentPage.goToPage({ domain: space.domain, path: pageReferencingTemplate.path });

  await documentPage.getLinkedPage(template.id).click();

  await proposalPage.waitForNewProposalPage();
});

test('Create a proposal from a linked proposal template / user from outside space', async ({
  page,
  proposalPage,
  documentPage
}) => {
  const { user: admin, space } = await generateUserAndSpace({
    memberSpacePermissions: ['createProposals']
  });

  await prisma.space.update({
    where: {
      id: space.id
    },
    data: {
      publicProposalTemplates: true
    }
  });

  const workflow = await generateProposalWorkflow({ spaceId: space.id });

  const template = await testUtilsProposals
    .generateProposal({
      spaceId: space.id,
      userId: admin.id,
      workflowId: workflow.id
    })
    .then((p) => prisma.page.update({ where: { id: p.id }, data: { type: 'proposal_template' } }));

  const pageReferencingTemplate = await testUtilsPages.generatePage({
    createdBy: admin.id,
    spaceId: space.id,
    title: 'Join us!',
    type: 'page',
    content: {
      type: 'doc',
      content: [
        {
          type: 'linkedPage',
          attrs: {
            id: template.id,
            path: template.path,
            type: 'proposal_template',
            track: []
          }
        },
        { type: 'paragraph', attrs: { track: [] } }
      ]
    },
    pagePermissions: [
      { assignee: { group: 'space', id: space.id }, permissionLevel: 'full_access' },
      { assignee: { group: 'public' }, permissionLevel: 'view' }
    ]
  });

  const { user: differentSpaceUser } = await generateUserAndSpace();

  await loginBrowserUser({ browserPage: page, userId: differentSpaceUser.id });

  await documentPage.goToPage({ domain: space.domain, path: pageReferencingTemplate.path });

  await documentPage.getLinkedPage(template.id).click();

  await proposalPage.waitForNewProposalPage();
});

test('Try to create a proposal from a linked proposal template / user from outside space / public templates disabled', async ({
  page,
  proposalPage,
  documentPage
}) => {
  const { user: admin, space } = await generateUserAndSpace();

  await prisma.space.update({
    where: {
      id: space.id
    },
    data: {
      publicProposalTemplates: false
    }
  });

  const workflow = await generateProposalWorkflow({ spaceId: space.id });

  const template = await testUtilsProposals
    .generateProposal({
      spaceId: space.id,
      userId: admin.id,
      workflowId: workflow.id
    })
    .then((p) => prisma.page.update({ where: { id: p.id }, data: { type: 'proposal_template' } }));

  const pageReferencingTemplate = await testUtilsPages.generatePage({
    createdBy: admin.id,
    spaceId: space.id,
    title: 'Join us!',
    type: 'page',
    content: {
      type: 'doc',
      content: [
        {
          type: 'linkedPage',
          attrs: {
            id: template.id,
            path: template.path,
            type: 'proposal_template',
            track: []
          }
        },
        { type: 'paragraph', attrs: { track: [] } }
      ]
    },
    pagePermissions: [
      { assignee: { group: 'space', id: space.id }, permissionLevel: 'full_access' },
      { assignee: { group: 'public' }, permissionLevel: 'view' }
    ]
  });

  const { user: differentSpaceUser } = await generateUserAndSpace();

  await loginBrowserUser({ browserPage: page, userId: differentSpaceUser.id });

  await documentPage.goToPage({ domain: space.domain, path: pageReferencingTemplate.path });

  // User won't have the proposal template showing
  const pageLink = documentPage.getLinkedPage(template.id);
  await expect(documentPage.getLinkedPage(template.id)).toHaveText('No access');
  await pageLink.click();

  await page.waitForURL(`${baseUrl}/join?domain=${space.domain}`);
});

test('Try to create a proposal from a linked proposal template / new user', async ({
  page,
  documentPage,
  proposalPage
}) => {
  const { user: admin, space } = await generateUserAndSpace({ memberSpacePermissions: ['createProposals'] });

  await prisma.space.update({
    where: {
      id: space.id
    },
    data: {
      publicProposalTemplates: true
    }
  });

  const workflow = await generateProposalWorkflow({ spaceId: space.id });

  const template = await testUtilsProposals
    .generateProposal({
      spaceId: space.id,
      userId: admin.id,
      workflowId: workflow.id
    })
    .then((p) => prisma.page.update({ where: { id: p.id }, data: { type: 'proposal_template' } }));

  const pageReferencingTemplate = await testUtilsPages.generatePage({
    createdBy: admin.id,
    spaceId: space.id,
    title: 'Join us!',
    type: 'page',
    content: {
      type: 'doc',
      content: [
        {
          type: 'linkedPage',
          attrs: {
            id: template.id,
            path: template.path,
            type: 'proposal_template',
            track: []
          }
        },
        { type: 'paragraph', attrs: { track: [] } }
      ]
    },
    pagePermissions: [
      { assignee: { group: 'space', id: space.id }, permissionLevel: 'full_access' },
      { assignee: { group: 'public' }, permissionLevel: 'view' }
    ]
  });

  await logoutBrowserUser({ browserPage: page });

  await documentPage.goToPage({ domain: space.domain, path: pageReferencingTemplate.path });

  const pageLink = documentPage.getLinkedPage(template.id);
  await expect(documentPage.getLinkedPage(template.id)).toHaveText(template.title);
  await pageLink.click();

  const newUser = await generateUser({});

  await page.waitForURL(`${baseUrl}/**`);

  await loginBrowserUser({ browserPage: page, userId: newUser.id });

  await page.reload();

  await proposalPage.waitForNewProposalPage();
});
