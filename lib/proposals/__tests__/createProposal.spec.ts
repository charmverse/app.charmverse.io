import type { ProposalWorkflow, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsPages } from '@charmverse/core/test';
import { generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateForumPost } from '@packages/testing/utils/forums';
import { generateProposalWorkflow } from '@packages/testing/utils/proposals';
import { v4 as uuid } from 'uuid';

import type { ProposalEvaluationInput } from '../createProposal';
import { createProposal } from '../createProposal';
import type { ProposalWithUsersAndRubric } from '../interfaces';
import { getDefaultPermissions } from '../workflows/defaultEvaluation';

let user: User;
let space: Space;
let workflow: ProposalWorkflow;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
  workflow = (await generateProposalWorkflow({ spaceId: space.id })) as ProposalWorkflow;
});

describe('Creates a page and proposal with relevant configuration', () => {
  it('Create a page and proposal accepting page content, reviewers, authors and source template ID as input', async () => {
    await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const pageTitle = 'page title 124';

    const templateId = uuid();

    const { page, proposal } = await createProposal({
      pageProps: {
        contentText: '',
        title: pageTitle,
        sourceTemplateId: templateId
      },
      userId: user.id,
      spaceId: space.id,
      authors: [user.id, extraUser.id],
      evaluations: [],
      workflowId: workflow.id
    });

    expect(page).toMatchObject(
      expect.objectContaining({
        title: pageTitle,
        type: 'proposal',
        sourceTemplateId: templateId
      })
    );

    expect(proposal).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsersAndRubric>>({
        authors: [
          {
            proposalId: proposal?.id,
            userId: user.id
          },
          {
            proposalId: proposal?.id,
            userId: extraUser.id
          }
        ]
      })
    );
  });

  it('should create a proposal from a workflow and copy over its permissions', async () => {
    const evaluationTemplate: WorkflowEvaluationJson[] = [
      {
        title: 'Feedback',
        id: uuid(),
        type: 'feedback',
        permissions: getDefaultPermissions()
      },
      {
        id: uuid(),
        type: 'pass_fail',
        title: 'Review',
        permissions: getDefaultPermissions()
      }
    ];
    const proposalWorkflow = await prisma.proposalWorkflow.create({
      data: {
        index: 0,
        space: { connect: { id: space.id } },
        title: 'Example flow',
        evaluations: evaluationTemplate
      }
    });

    const { proposal } = await createProposal({
      spaceId: space.id,
      userId: user.id,
      workflowId: proposalWorkflow.id,
      authors: [user.id],
      pageProps: { title: 'test' },
      evaluations: evaluationTemplate.map((item, index) => ({
        id: item.id,
        rubricCriteria: [],
        title: item.title,
        type: item.type,
        index,
        permissions: undefined,
        reviewers: [{ systemRole: 'space_member' }],
        appealReviewers: [
          {
            userId: user.id
          }
        ]
      })) as ProposalEvaluationInput[]
    });

    const proposalInDb = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      select: {
        evaluations: {
          orderBy: {
            index: 'asc'
          },
          select: {
            id: true,
            title: true,
            type: true,
            permissions: true
          }
        }
      }
    });

    const proposalAppealReviewersCount = await prisma.proposalAppealReviewer.count({
      where: {
        userId: user.id,
        evaluationId: proposalInDb.evaluations[1].id
      }
    });

    expect(proposalInDb.evaluations).toMatchObject(
      expect.arrayContaining(
        evaluationTemplate.map((item) => ({
          title: item.title,
          type: item.type,
          id: expect.any(String),
          permissions: expect.arrayContaining(item.permissions.map((p) => expect.objectContaining(p)))
        }))
      )
    );

    expect(proposalAppealReviewersCount).toEqual(1);
  });
});

describe('Converting from post and proposal', () => {
  it('Marks the page as converted', async () => {
    const pageTitle = 'page title 124';

    const templateId = uuid();

    const createdPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    const { proposal } = await createProposal({
      pageProps: {
        contentText: '',
        title: pageTitle,
        sourceTemplateId: templateId
      },
      userId: user.id,
      spaceId: space.id,
      authors: [user.id],
      evaluations: [],
      sourcePageId: createdPage.id,
      workflowId: workflow.id
    });

    const converted = await prisma.page.findUniqueOrThrow({
      where: {
        id: createdPage.id
      }
    });
    expect(converted.convertedProposalId).toEqual(proposal.id);
  });

  it('Marks the post as converted', async () => {
    const pageTitle = 'page title 124';

    const templateId = uuid();

    const createdPost = await generateForumPost({
      userId: user.id,
      spaceId: space.id
    });
    const { proposal } = await createProposal({
      pageProps: {
        contentText: '',
        title: pageTitle,
        sourceTemplateId: templateId
      },
      userId: user.id,
      spaceId: space.id,
      authors: [user.id],
      evaluations: [],
      sourcePostId: createdPost.id,
      workflowId: workflow.id
    });

    const converted = await prisma.post.findUniqueOrThrow({
      where: {
        id: createdPost.id
      }
    });
    expect(converted.proposalId).toEqual(proposal.id);
  });
});
