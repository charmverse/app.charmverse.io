import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';

import { generateProposalV2 } from 'testing/utils/proposals';

import { applyProposalTemplate } from '../applyProposalTemplate';

describe('applyProposalTemplate', () => {
  it('should apply top-level fields', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await generateProposalV2({
      spaceId: space.id,
      userId: user.id
    });

    const template = await generateProposalV2({
      spaceId: space.id,
      userId: user.id,
      pageType: 'proposal_template',
      content: {
        title: 'Template',
        description: 'Template description'
      },
      selectedCredentialTemplates: ['foobar']
    });

    await applyProposalTemplate({
      proposalId: proposal.id,
      id: template.id,
      actorId: user.id
    });

    const result = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        page: true
      }
    });

    expect(result.page?.content).toStrictEqual(template.page.content);
    expect(result.page?.sourceTemplateId).toStrictEqual(template.id);
    expect(result.selectedCredentialTemplates).toStrictEqual(template.selectedCredentialTemplates);
    expect(result.workflowId).toStrictEqual(template.workflowId);
  });

  it('should apply evaluation steps and settings', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await generateProposalV2({
      spaceId: space.id,
      userId: user.id
    });

    const template = await generateProposalV2({
      spaceId: space.id,
      userId: user.id,
      pageType: 'proposal_template',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          permissions: [],
          reviewers: [{ group: 'user', id: user.id }]
        },
        {
          evaluationType: 'pass_fail',
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: user.id }]
        },
        {
          evaluationType: 'rubric',
          rubricCriteria: [
            { title: 'Criteria 1', description: 'Description 1', parameters: { type: 'score', min: 0, max: 20 } }
          ],
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: user.id }]
        },
        {
          evaluationType: 'vote',
          voteSettings: {
            durationDays: 12,
            threshold: 90,
            type: 'SingleChoice',
            options: ['Yes', 'No'],
            maxChoices: 1,
            strategy: 'regular'
          },
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: user.id }]
        }
      ]
    });

    await applyProposalTemplate({
      proposalId: proposal.id,
      id: template.id,
      actorId: user.id
    });

    const result = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          include: {
            rubricCriteria: true
          }
        }
      }
    });

    expect(result.evaluations).toHaveLength(template.evaluations.length);
  });
});
