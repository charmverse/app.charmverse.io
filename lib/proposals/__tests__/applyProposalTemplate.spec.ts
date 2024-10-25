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
      templateId: template.id,
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
          actionLabels: {
            pass: 'Happy',
            fail: 'Sad'
          },
          evaluationType: 'pass_fail',
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: user.id }]
        },
        {
          evaluationType: 'rubric',
          rubricCriteria: [
            { title: 'Test Criteria 1', description: 'Description 1', parameters: { type: 'score', min: 0, max: 20 } }
          ],
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: user.id }],
          showAuthorResultsOnRubricFail: true
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
      templateId: template.id,
      actorId: user.id
    });

    const result = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          include: {
            reviewers: true,
            rubricCriteria: {
              orderBy: {
                index: 'asc'
              }
            }
          },
          orderBy: {
            index: 'asc'
          }
        }
      }
    });

    expect(result.evaluations).toHaveLength(template.evaluations.length);

    // Pass/fail settings
    expect(result.evaluations[1]).toMatchObject({
      type: 'pass_fail',
      actionLabels: template.evaluations[1].actionLabels
    });

    // Rubric criteria
    expect(result.evaluations[2]).toMatchObject({
      type: 'rubric',
      reviewers: [
        expect.objectContaining({
          userId: template.evaluations[2].reviewers[0].userId
        })
      ],
      showAuthorResultsOnRubricFail: true,
      rubricCriteria: [
        expect.objectContaining({
          title: template.evaluations[2].rubricCriteria[0].title,
          description: template.evaluations[2].rubricCriteria[0].description,
          parameters: template.evaluations[2].rubricCriteria[0].parameters
        })
      ]
    });

    // Vote settings
    expect(result.evaluations[3]).toMatchObject({
      type: 'vote',
      voteSettings: template.evaluations[3].voteSettings
    });
  });
});
