import { InsecureOperationError } from '@charmverse/core/errors';
import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid, v4 } from 'uuid';

import type { FormFieldInput } from 'components/common/form/interfaces';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import type { ProposalEvaluationInput } from '../createProposal';
import { createProposal } from '../createProposal';
import type { ProposalWithUsersAndRubric } from '../interface';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('Creates a page and proposal with relevant configuration', () => {
  it('Create a page and proposal accepting page content, reviewers, authors and source template ID as input', async () => {
    const reviewerUser = await generateSpaceUser({
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
      authors: [user.id, extraUser.id]
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
        ],
        rubricAnswers: [],
        rubricCriteria: []
      })
    );
  });

  it('Create proposal template with existing form', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });
    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const pageTitle = 'page title 124';

    const formFields: FormFieldInput[] = [
      {
        id: uuid(),
        type: 'short_text',
        name: 'name',
        description: 'description',
        index: 0,
        options: [],
        private: false,
        required: true
      },
      {
        id: uuid(),
        type: 'long_text',
        name: 'long name',
        description: 'another description',
        index: 1,
        options: [],
        private: true,
        required: true
      }
    ];

    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });

    const proposalTemplateForm = await prisma.form.create({
      data: {
        proposal: {
          connect: {
            id: proposalTemplate.id
          }
        }
      }
    });

    await prisma.formField.createMany({
      data: formFields.map((item) => ({
        ...item,
        description: item.description ?? '',
        formId: proposalTemplateForm.id
      }))
    });

    const { page, proposal } = await createProposal({
      pageProps: {
        contentText: '',
        title: pageTitle,
        type: 'proposal_template'
      },
      userId: user.id,
      spaceId: space.id,
      authors: [user.id, extraUser.id],
      reviewers: [
        {
          group: 'user',
          id: reviewerUser.id
        }
      ],
      formFields: formFields.map((item) => ({
        ...item,
        // creating new IDs for the form fields
        id: v4()
      }))
    });

    const newProposalTemplateForm = await prisma.form.findUniqueOrThrow({
      where: {
        id: proposal.formId as string
      },
      select: {
        id: true
      }
    });

    // New form should be created since we are duplicating a proposal template
    expect(newProposalTemplateForm.id).not.toEqual(proposalTemplateForm.id);

    expect(page).toMatchObject(
      expect.objectContaining({
        title: pageTitle,
        type: 'proposal_template'
      })
    );

    expect(proposal.formId).toBeDefined();
  });

  it('should throw an error if trying to create a proposal with authors or reviewers outside the space', async () => {
    const { user: outsideUser, space: outsideSpace } = await testUtilsUser.generateUserAndSpace();
    const outsideRole = await testUtilsMembers.generateRole({
      createdBy: outsideUser.id,
      spaceId: outsideSpace.id
    });

    // Outside author
    await expect(
      createProposal({
        pageProps: {
          contentText: '',
          title: 'page-title'
        },
        userId: user.id,
        spaceId: space.id,
        authors: [user.id, outsideUser.id],
        reviewers: []
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);

    // Outside reviewer user
    await expect(
      createProposal({
        pageProps: {
          contentText: '',
          title: 'page-title'
        },
        userId: user.id,
        spaceId: space.id,
        authors: [user.id],
        reviewers: [
          {
            group: 'user',
            id: outsideUser.id
          }
        ]
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);

    // Outside reviewer role
    await expect(
      createProposal({
        pageProps: {
          contentText: '',
          title: 'page-title'
        },
        userId: user.id,
        spaceId: space.id,
        authors: [user.id, outsideUser.id],
        reviewers: [
          {
            group: 'role',
            id: outsideRole.id
          }
        ]
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });

  it('should create a proposal from a workflow and copy over its permissions', async () => {
    const evaluationTemplate: WorkflowEvaluationJson[] = [
      {
        title: 'Feedback',
        id: uuid(),
        type: 'feedback',
        permissions: [
          {
            operation: 'view',
            systemRole: 'author'
          },
          {
            operation: 'edit',
            systemRole: 'author'
          },
          {
            operation: 'comment',
            systemRole: 'author'
          },
          {
            operation: 'move',
            systemRole: 'author'
          },
          {
            operation: 'view',
            systemRole: 'space_member'
          },
          {
            operation: 'comment',
            systemRole: 'space_member'
          }
        ]
      },
      {
        id: uuid(),
        type: 'pass_fail',
        title: 'Review',
        permissions: [
          {
            operation: 'view',
            systemRole: 'author'
          },
          {
            operation: 'edit',
            systemRole: 'author'
          },
          {
            operation: 'comment',
            systemRole: 'author'
          },
          {
            operation: 'move',
            systemRole: 'author'
          },
          {
            operation: 'view',
            systemRole: 'current_reviewer'
          },
          {
            operation: 'comment',
            systemRole: 'current_reviewer'
          },
          {
            operation: 'move',
            systemRole: 'current_reviewer'
          },
          {
            operation: 'view',
            systemRole: 'all_reviewers'
          },
          {
            operation: 'comment',
            systemRole: 'all_reviewers'
          },
          {
            operation: 'view',
            systemRole: 'space_member'
          },
          {
            operation: 'comment',
            systemRole: 'space_member'
          }
        ]
      },
      {
        id: '577b1c43-46da-4a00-a3f3-15549610b83e',
        type: 'vote',
        title: 'Community vote',
        permissions: [
          {
            operation: 'view',
            systemRole: 'author'
          },
          {
            operation: 'edit',
            systemRole: 'author'
          },
          {
            operation: 'comment',
            systemRole: 'author'
          },
          {
            operation: 'move',
            systemRole: 'author'
          },
          {
            operation: 'view',
            systemRole: 'current_reviewer'
          },
          {
            operation: 'comment',
            systemRole: 'current_reviewer'
          },
          {
            operation: 'move',
            systemRole: 'current_reviewer'
          },
          {
            operation: 'view',
            systemRole: 'all_reviewers'
          },
          {
            operation: 'comment',
            systemRole: 'all_reviewers'
          },
          {
            operation: 'view',
            systemRole: 'space_member'
          },
          {
            operation: 'comment',
            systemRole: 'space_member'
          }
        ]
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
      evaluations: evaluationTemplate.map((item, index) => ({
        id: item.id,
        rubricCriteria: [],
        title: item.title,
        type: item.type,
        index,
        permissions: undefined,
        reviewers: [{ systemRole: 'space_member' }]
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
  });
});
