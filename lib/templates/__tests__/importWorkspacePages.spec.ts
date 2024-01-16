/* eslint-disable camelcase */
import fs from 'node:fs/promises';

import type {
  WorkflowEvaluationJson,
  ProposalWorkflowTyped,
  PermissionJson
} from '@charmverse/core/dist/cjs/proposals';
import type { PageWithPermissions } from '@charmverse/core/pages';
import type {
  Page,
  Proposal,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalReviewer,
  ProposalRubricCriteria,
  ProposalSystemRole,
  Role,
  Space,
  User
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { prismaToBlock } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import { createPage, generateBoard, generateUserAndSpace } from 'testing/setupDatabase';

import type { WorkspacePagesExport } from '../exportWorkspacePages';
import { exportWorkspacePages, exportWorkspacePagesToDisk } from '../exportWorkspacePages';
import { importWorkspacePages } from '../importWorkspacePages';

jest.mock('node:fs/promises');

let space: Space;
let user: User;
let root_1: PageWithPermissions;
let page_1_1: PageWithPermissions;
let page_1_1_1: PageWithPermissions;
let boardPage: Page;
let cardPages: Page[];
let totalSourcePages = 0;
let totalSourceBlocks = 0;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
  user = generated.user;

  root_1 = await createPage({
    parentId: null,
    title: 'Root 1',
    index: 1,
    createdBy: user.id,
    spaceId: space.id,
    content: { content: '' }
  });

  page_1_1 = await createPage({
    parentId: root_1.id,
    index: 1,
    title: 'Page 1.1',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_1_1 = await createPage({
    parentId: page_1_1.id,
    index: 1,
    title: 'Page 1.1.1',
    createdBy: user.id,
    spaceId: space.id
  });

  boardPage = await generateBoard({
    spaceId: space.id,
    createdBy: user.id,
    cardCount: 2
  });

  cardPages = await prisma.page.findMany({
    where: {
      parentId: boardPage.id,
      type: 'card'
    }
  });

  totalSourcePages = await prisma.page.count({
    where: {
      spaceId: space.id
    }
  });

  totalSourceBlocks = await prisma.block.count({
    where: {
      spaceId: space.id
    }
  });
});

describe('importWorkspacePages', () => {
  it('should import data from the export function into the target workspace', async () => {
    const { space: targetSpace } = await generateUserAndSpace();

    const data = await exportWorkspacePages({
      sourceSpaceIdOrDomain: space.domain
    });

    await importWorkspacePages({
      targetSpaceIdOrDomain: targetSpace.domain,
      exportData: data
    });

    const pages = await prisma.page.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    const blocks = await prisma.block.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    const boardBlock = prismaToBlock(blocks.find((b) => b.type === 'board')!) as Board;
    const viewBlocks = blocks.filter((b) => b.type === 'view');

    expect(boardBlock.fields.viewIds.sort()).toStrictEqual(viewBlocks.map((b) => b.id).sort());
    expect(pages.length).toBe(totalSourcePages);
    expect(blocks.length).toBe(totalSourceBlocks);
  });

  it('should return a hashmap of the source page ids and the page ids for their new versions', async () => {
    const { space: targetSpace } = await generateUserAndSpace();

    const data = await exportWorkspacePages({
      sourceSpaceIdOrDomain: space.domain
    });

    const importResult = await importWorkspacePages({
      targetSpaceIdOrDomain: targetSpace.domain,
      exportData: data
    });

    expect(importResult.oldNewRecordIdHashMap).toMatchObject({
      [root_1.id]: expect.any(String),
      [page_1_1.id]: expect.any(String),
      [page_1_1_1.id]: expect.any(String),
      [boardPage.id]: expect.any(String),
      [cardPages[0].id]: expect.any(String),
      [cardPages[1].id]: expect.any(String)
    });
  });

  it('should accept a filename as the source data input', async () => {
    const { space: targetSpace } = await generateUserAndSpace();

    const exportName = `test-${v4()}.json`;

    const { data, path } = await exportWorkspacePagesToDisk({
      sourceSpaceIdOrDomain: space.domain,
      exportName
    });

    const stringifiedData = JSON.stringify(data, null, 2);
    jest.spyOn(fs, 'readFile').mockImplementation(() => Promise.resolve(stringifiedData));

    await importWorkspacePages({
      targetSpaceIdOrDomain: targetSpace.domain,
      exportName
    });

    const pages = await prisma.page.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    const blocks = await prisma.block.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    expect(fs.readFile).toHaveBeenCalledWith(path, 'utf-8');
    expect(pages.length).toBe(totalSourcePages);
    expect(blocks.length).toBe(totalSourceBlocks);
    expect(pages.every((p) => p.autoGenerated)).toBe(true);
  });
});
describe('importWorkspacePages - proposal content', () => {
  let sourceSpace: Space;
  let sourceSpaceUser: User;
  let sourceSpaceRole: Role;
  let sourceWorkflow: ProposalWorkflowTyped;
  let sourceProposal: Proposal & {
    evaluations: (ProposalEvaluation & {
      reviewers: ProposalReviewer[];
      permissions: ProposalEvaluationPermission[];
      rubricCriteria: ProposalRubricCriteria[];
    })[];
  };

  let rolePermission: PermissionJson;
  let userPermission: PermissionJson;
  let systemPermission: PermissionJson;

  let importData: WorkspacePagesExport;

  beforeAll(async () => {
    ({ space: sourceSpace, user: sourceSpaceUser } = await testUtilsUser.generateUserAndSpace());

    sourceSpaceRole = await testUtilsMembers.generateRole({
      createdBy: sourceSpaceUser.id,
      spaceId: sourceSpace.id
    });

    rolePermission = {
      operation: 'comment',
      roleId: sourceSpaceRole.id
    };

    userPermission = {
      operation: 'edit',
      userId: sourceSpaceUser.id
    };

    systemPermission = {
      operation: 'view',
      systemRole: 'current_reviewer'
    };

    sourceWorkflow = (await prisma.proposalWorkflow.create({
      data: {
        index: 1,
        title: 'Feedback',
        space: { connect: { id: sourceSpace.id } },
        evaluations: [
          {
            id: v4(),
            title: 'Feedback',
            type: 'feedback',
            permissions: []
          } as WorkflowEvaluationJson,
          {
            id: v4(),
            title: 'Acceptance Criteria',
            type: 'rubric',
            permissions: [rolePermission, userPermission, systemPermission]
          } as WorkflowEvaluationJson
        ]
      }
    })) as ProposalWorkflowTyped;

    sourceProposal = await testUtilsProposals
      .generateProposal({
        spaceId: sourceSpace.id,
        userId: sourceSpaceUser.id,
        evaluationInputs: [
          {
            title: 'Feedback',
            evaluationType: 'feedback',
            permissions: [],
            reviewers: []
          },
          {
            title: 'Rubric',
            permissions: [
              {
                assignee: { group: 'role', id: rolePermission.roleId as string },
                operation: rolePermission.operation as any
              },
              {
                assignee: { group: 'user', id: userPermission.userId as string },
                operation: userPermission.operation as any
              },
              {
                assignee: { group: systemPermission.systemRole as ProposalSystemRole },
                operation: systemPermission.operation as any
              }
            ],
            evaluationType: 'feedback',
            reviewers: [{ group: 'role', id: sourceSpaceRole.id }],
            rubricCriteria: [{ title: 'Example rubric', description: 'Describe the proposal vibe', parameters: {} }]
          }
        ]
      })
      .then((_proposal) =>
        prisma.proposal.update({
          where: { id: _proposal.id },
          data: { workflow: { connect: { id: sourceWorkflow.id } } },
          include: {
            evaluations: {
              include: {
                reviewers: true,
                rubricCriteria: true,
                permissions: true
              },
              orderBy: {
                index: 'asc'
              }
            }
          }
        })
      );

    // Using the actual export function ensures import / export work together
    importData = await exportWorkspacePages({
      sourceSpaceIdOrDomain: sourceSpace.domain
    });
  });

  it('should port over all the proposal configuration when importing within the same space', async () => {
    await importWorkspacePages({
      exportData: {
        pages: importData.pages
      },
      targetSpaceIdOrDomain: sourceSpace.id
    });

    const proposals = await prisma.proposal.findMany({
      where: {
        spaceId: sourceSpace.id
      },
      include: {
        evaluations: {
          include: {
            permissions: true,
            rubricCriteria: true,
            reviewers: true
          },
          orderBy: {
            index: 'asc'
          }
        }
      }
    });

    expect(proposals).toHaveLength(2);

    const copiedProposal = proposals.find((p) => p.id !== sourceProposal.id)!;

    const copiedFirstEvaluation = copiedProposal.evaluations[0];
    const copiedSecondEvaluation = copiedProposal.evaluations[1];

    expect(copiedProposal).toMatchObject<typeof sourceProposal>({
      ...sourceProposal,
      id: expect.not.stringContaining(sourceProposal.id),
      fields: {},
      evaluations: [
        {
          ...sourceProposal.evaluations[0],
          id: copiedFirstEvaluation.id,
          title: 'Feedback',
          type: 'feedback',
          proposalId: copiedProposal.id,
          permissions: [],
          reviewers: [],
          rubricCriteria: []
        },
        {
          ...sourceProposal.evaluations[1],
          id: copiedSecondEvaluation.id,
          proposalId: copiedProposal.id,
          permissions: [
            {
              ...sourceProposal.evaluations[1].permissions[0],
              evaluationId: copiedSecondEvaluation.id,
              id: expect.any(String)
            },
            {
              ...sourceProposal.evaluations[1].permissions[1],
              evaluationId: copiedSecondEvaluation.id,
              id: expect.any(String)
            },
            {
              ...sourceProposal.evaluations[1].permissions[2],
              evaluationId: copiedSecondEvaluation.id,
              id: expect.any(String)
            }
          ],
          reviewers: [
            {
              ...sourceProposal.evaluations[1].reviewers[0],
              proposalId: copiedProposal.id,
              evaluationId: copiedSecondEvaluation.id,
              id: expect.any(String)
            }
          ],
          rubricCriteria: [
            {
              ...sourceProposal.evaluations[1].rubricCriteria[0],
              evaluationId: copiedSecondEvaluation.id,
              proposalId: copiedProposal.id,
              id: expect.any(String)
            }
          ]
        }
      ]
    });
  });

  it('should port over the proposal configuration when importing to a different space, but it should eliminate any individual user permissions, and map over role permissions', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    await importWorkspacePages({
      exportData: {
        pages: importData.pages
      },
      targetSpaceIdOrDomain: sourceSpace.id,
      importingToDifferentSpace: true
    });

    const proposals = await prisma.proposal.findMany({
      where: {
        spaceId: targetSpace.id
      },
      include: {
        evaluations: {
          include: {
            permissions: true,
            rubricCriteria: true,
            reviewers: true
          },
          orderBy: {
            index: 'asc'
          }
        }
      }
    });

    expect(proposals).toHaveLength(1);

    const copiedProposal = proposals.find((p) => p.id !== sourceProposal.id)!;

    const copiedFirstEvaluation = copiedProposal.evaluations[0];
    const copiedSecondEvaluation = copiedProposal.evaluations[1];

    expect(copiedProposal).toMatchObject<typeof sourceProposal>({
      ...sourceProposal,
      id: expect.not.stringContaining(sourceProposal.id),
      evaluations: [
        {
          ...sourceProposal.evaluations[0],
          id: copiedSecondEvaluation.id,
          proposalId: copiedProposal.id,
          permissions: [
            {
              ...sourceProposal.evaluations[0].permissions[0],
              evaluationId: copiedFirstEvaluation.id,
              id: expect.any(String)
            },
            {
              ...sourceProposal.evaluations[0].permissions[1],
              evaluationId: copiedFirstEvaluation.id,
              id: expect.any(String)
            },
            {
              ...sourceProposal.evaluations[0].permissions[2],
              evaluationId: copiedFirstEvaluation.id,
              id: expect.any(String)
            }
          ],
          reviewers: [
            {
              ...sourceProposal.evaluations[0].reviewers[0],
              evaluationId: copiedFirstEvaluation.id,
              id: expect.any(String)
            }
          ],
          rubricCriteria: []
        },
        {
          ...sourceProposal.evaluations[1],
          id: copiedSecondEvaluation.id,
          permissions: [
            {
              ...sourceProposal.evaluations[1].permissions[0],
              evaluationId: copiedSecondEvaluation.id,
              id: expect.any(String)
            },
            {
              ...sourceProposal.evaluations[1].permissions[1],
              evaluationId: copiedSecondEvaluation.id,
              id: expect.any(String)
            },
            {
              ...sourceProposal.evaluations[1].permissions[2],
              evaluationId: copiedSecondEvaluation.id,
              id: expect.any(String)
            }
          ],
          reviewers: [
            {
              ...sourceProposal.evaluations[1].reviewers[0],
              id: expect.any(String)
            }
          ],
          rubricCriteria: [
            {
              ...sourceProposal.evaluations[1].rubricCriteria[0],
              id: expect.any(String)
            }
          ]
        }
      ]
    });
  });
});
