import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import type { ProposalTemplateMeta } from '../getProposalTemplates';
import { getProposalTemplates } from '../getProposalTemplates';

describe('getProposalTemplates', () => {
  it('should return all templates within a paid space', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'published'
    });

    // should be excluded as it is draft
    await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'draft'
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const templates = await getProposalTemplates({
      spaceId: space.id,
      userId: spaceMember.id
    });

    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject(
      expect.objectContaining<Partial<ProposalTemplateMeta>>({
        pageId: expect.any(String),
        title: expect.any(String)
      })
    );
  });

  it('should return an empty list for people outside the space since they cannot create proposals', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    const usableProposalTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id
    });
    const templates = await getProposalTemplates({
      spaceId: space.id,
      userId: undefined
    });

    expect(templates).toHaveLength(0);
  });

  it('should not return a deleted template', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      deletedAt: new Date()
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const templates = await getProposalTemplates({
      spaceId: space.id,
      userId: spaceMember.id
    });

    expect(templates).toHaveLength(0);
  });
});
