import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { ExpectedAnError } from '@packages/testing/errors';
import { DataNotFoundError, InvalidInputError, UndesirableOperationError } from '@packages/utils/errors';
import { v4 } from 'uuid';

import { unarchiveWorkflowTemplate } from '../unarchiveWorkflowTemplate';

let user: User;
let space: Space;

beforeAll(async () => {
  ({ user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
});

describe('unarchiveWorkflowTemplate', () => {
  it('should unarchive a workflow template successfully', async () => {
    const workflow = await prisma.proposalWorkflow.create({
      data: {
        spaceId: space.id,
        archived: true,
        title: 'Test workflow',
        index: 0
      }
    });

    const unarchived = await unarchiveWorkflowTemplate({
      workflowId: workflow.id,
      spaceId: space.id
    });

    expect(unarchived.archived).toBe(false);

    const workflowInDb = await prisma.proposalWorkflow.findUnique({
      where: {
        id: workflow.id
      }
    });

    expect(workflowInDb?.archived).toBe(false);
  });

  it('should fail if the workflow template does not exist', async () => {
    try {
      await unarchiveWorkflowTemplate({
        workflowId: v4(),
        spaceId: space.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the workflow template is not archived', async () => {
    const workflow = await prisma.proposalWorkflow.create({
      data: {
        spaceId: space.id,
        archived: false,
        title: 'Test workflow',
        index: 0
      }
    });

    try {
      await unarchiveWorkflowTemplate({
        workflowId: workflow.id,
        spaceId: space.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if the workflow template does not belong to the space', async () => {
    const workflow = await prisma.proposalWorkflow.create({
      data: {
        spaceId: space.id,
        archived: true,
        title: 'Test workflow',
        index: 0
      }
    });

    try {
      await unarchiveWorkflowTemplate({
        workflowId: workflow.id,
        spaceId: v4()
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if unarchiving would exceed the space tier limit', async () => {
    // First create workflows up to the limit
    const maxWorkflows = 3; // Assuming free tier limit
    await Promise.all(
      Array(maxWorkflows)
        .fill(null)
        .map(() =>
          prisma.proposalWorkflow.create({
            data: {
              spaceId: space.id,
              archived: false,
              title: 'Test workflow',
              index: 0
            }
          })
        )
    );

    // Create an archived workflow
    const archivedWorkflow = await prisma.proposalWorkflow.create({
      data: {
        spaceId: space.id,
        archived: true,
        title: 'Test workflow',
        index: 0
      }
    });

    try {
      await unarchiveWorkflowTemplate({
        workflowId: archivedWorkflow.id,
        spaceId: space.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      if (err instanceof Error) {
        expect(err).toBeInstanceOf(UndesirableOperationError);
        expect(err.message).toContain('maximum number of workflows');
      }
    }
  });
});
