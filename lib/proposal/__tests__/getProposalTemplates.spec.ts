import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import type { FormFieldInput } from 'components/common/form/interfaces';
import { createForm } from 'lib/form/createForm';

import type { ProposalTemplate } from '../getProposalTemplates';
import { getProposalTemplates } from '../getProposalTemplates';

describe('getProposalTemplates', () => {
  it('should return all templates within a paid space', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id
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
      expect.objectContaining<Partial<ProposalTemplate>>({
        authors: expect.any(Array),
        reviewers: expect.any(Array),
        createdBy: adminUser.id,
        id: expect.any(String)
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

  it('should return private form fields', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });
    const fieldsInput: FormFieldInput[] = [
      {
        id: v4(),
        type: 'short_text',
        name: 'name',
        description: 'description',
        index: 0,
        options: [],
        private: true,
        required: true
      }
    ];
    const formId = await createForm(fieldsInput);

    const template = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      pageType: 'proposal_template'
    });
    await prisma.proposal.update({
      where: {
        id: template.id
      },
      data: {
        formId
      }
    });

    const templates = await getProposalTemplates({
      spaceId: space.id,
      userId: adminUser.id
    });

    expect(templates).toHaveLength(1);
    expect(templates[0].form?.formFields).toHaveLength(1);
    expect(templates[0].form?.formFields![0]).toEqual(expect.objectContaining(fieldsInput[0]));
  });
});
