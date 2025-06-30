import type { PageOperations, ProposalEvaluationType, Role, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError } from '@packages/core/errors';
import { AvailablePagePermissions } from '@packages/core/permissions';

import { computeProposalNotePermissions } from '../computeProposalNotePermissions';

const expectedProposalNotePagePermissions: PageOperations[] = ['comment', 'create_poll', 'edit_content', 'read'];

describe('computeProposalNotePermissions', () => {
  let space: Space;
  let admin: User;
  let member: User;
  let memberReviewer: User;
  let memberReviewerByRole: User;
  let reviewerRole: Role;
  let proposalAuthor: User;
  beforeAll(async () => {
    ({ space, user: admin } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
    proposalAuthor = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    memberReviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    memberReviewerByRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reviewerRole = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: admin.id,
      assigneeUserIds: [memberReviewerByRole.id]
    });
  });
  it('should return comment, create_poll, edit_content, read permissions for an admin', async () => {
    const proposal = await testUtilsProposals.generateProposal({ spaceId: space.id, userId: admin.id });

    const notes = await testUtilsProposals.generateProposalNotes({
      proposalPageId: proposal.page.id
    });

    const permissions = await computeProposalNotePermissions({
      resourceId: notes.id,
      userId: admin.id
    });

    expect(permissions).toMatchObject(
      new AvailablePagePermissions({ isReadonlySpace: false }).addPermissions(expectedProposalNotePagePermissions)
        .operationFlags
    );
  });

  it('should return comment, create_poll, edit_content, read permissions for a user who is a reviewer by role or id on a feedback step, rubric step or pass_fail step', async () => {
    const targetStages: ProposalEvaluationType[] = ['feedback', 'pass_fail', 'rubric'];

    for (const stage of targetStages) {
      const proposal = await testUtilsProposals.generateProposal({
        spaceId: space.id,
        userId: admin.id,
        proposalStatus: 'published',
        evaluationInputs: [
          {
            evaluationType: stage,
            permissions: [],
            reviewers: [
              { group: 'user', id: memberReviewer.id },
              { group: 'role', id: reviewerRole.id }
            ]
          }
        ]
      });

      const notes = await testUtilsProposals.generateProposalNotes({
        proposalPageId: proposal.page.id
      });

      const adminPermissions = await computeProposalNotePermissions({
        resourceId: notes.id,
        userId: admin.id
      });

      const memberPermissions = await computeProposalNotePermissions({
        resourceId: notes.id,
        userId: member.id
      });

      const memberReviewerPermissions = await computeProposalNotePermissions({
        resourceId: notes.id,
        userId: memberReviewer.id
      });

      const memberReviewerByRolePermissions = await computeProposalNotePermissions({
        resourceId: notes.id,
        userId: memberReviewerByRole.id
      });

      expect(memberPermissions).toMatchObject(new AvailablePagePermissions({ isReadonlySpace: false }).empty);

      expect(adminPermissions).toMatchObject(
        new AvailablePagePermissions({ isReadonlySpace: false }).addPermissions(expectedProposalNotePagePermissions)
          .operationFlags
      );

      expect(memberReviewerPermissions).toMatchObject(
        new AvailablePagePermissions({ isReadonlySpace: false }).addPermissions(expectedProposalNotePagePermissions)
          .operationFlags
      );

      expect(memberReviewerByRolePermissions).toMatchObject(
        new AvailablePagePermissions({ isReadonlySpace: false }).addPermissions(expectedProposalNotePagePermissions)
          .operationFlags
      );
    }
  });

  it('should return comment, create_poll, edit_content, read permissions for an author who is a reviewer in a pass_fail or rubric step', async () => {
    const validStages: ProposalEvaluationType[] = ['pass_fail', 'rubric'];

    for (const stage of validStages) {
      const proposal = await testUtilsProposals.generateProposal({
        spaceId: space.id,
        userId: admin.id,
        authors: [proposalAuthor.id],
        evaluationInputs: [
          {
            evaluationType: stage,
            permissions: [],
            reviewers: [{ group: 'author' }]
          }
        ]
      });

      const notes = await testUtilsProposals.generateProposalNotes({
        proposalPageId: proposal.page.id
      });

      const authorPermissions = await computeProposalNotePermissions({
        resourceId: notes.id,
        userId: proposalAuthor.id
      });

      expect(authorPermissions).toMatchObject(
        new AvailablePagePermissions({ isReadonlySpace: false }).addPermissions(expectedProposalNotePagePermissions)
          .operationFlags
      );
    }

    const ignoredStages: ProposalEvaluationType[] = ['feedback', 'vote'];

    for (const stage of ignoredStages) {
      const proposal = await testUtilsProposals.generateProposal({
        spaceId: space.id,
        userId: admin.id,
        authors: [proposalAuthor.id],
        evaluationInputs: [
          {
            evaluationType: stage,
            permissions: [],
            reviewers: [{ group: 'author' }]
          }
        ]
      });

      const notes = await testUtilsProposals.generateProposalNotes({
        proposalPageId: proposal.page.id
      });

      const authorPermissions = await computeProposalNotePermissions({
        resourceId: notes.id,
        userId: proposalAuthor.id
      });

      expect(authorPermissions).toMatchObject(new AvailablePagePermissions({ isReadonlySpace: false }).empty);
    }
  });

  it('should ignore reviewership from a vote step', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: admin.id,
      evaluationInputs: [
        {
          evaluationType: 'vote',
          permissions: [],
          reviewers: [
            { group: 'user', id: memberReviewer.id },
            { group: 'role', id: reviewerRole.id }
          ]
        }
      ]
    });

    const notes = await testUtilsProposals.generateProposalNotes({
      proposalPageId: proposal.page.id
    });

    const adminPermissions = await computeProposalNotePermissions({
      resourceId: notes.id,
      userId: admin.id
    });

    const memberPermissions = await computeProposalNotePermissions({
      resourceId: notes.id,
      userId: member.id
    });

    const memberReviewerPermissions = await computeProposalNotePermissions({
      resourceId: notes.id,
      userId: memberReviewer.id
    });

    const memberReviewerByRolePermissions = await computeProposalNotePermissions({
      resourceId: notes.id,
      userId: memberReviewerByRole.id
    });

    expect(memberPermissions).toMatchObject(new AvailablePagePermissions({ isReadonlySpace: false }).empty);

    expect(adminPermissions).toMatchObject(
      new AvailablePagePermissions({ isReadonlySpace: false }).addPermissions(expectedProposalNotePagePermissions)
        .operationFlags
    );

    expect(memberReviewerPermissions).toMatchObject(new AvailablePagePermissions({ isReadonlySpace: false }).empty);

    expect(memberReviewerByRolePermissions).toMatchObject(
      new AvailablePagePermissions({ isReadonlySpace: false }).empty
    );
  });

  it('should always return empty permissions for users outside the space', async () => {
    const proposal = await testUtilsProposals.generateProposal({ spaceId: space.id, userId: admin.id });

    const notes = await testUtilsProposals.generateProposalNotes({
      proposalPageId: proposal.page.id
    });

    const user = await testUtilsUser.generateUser();

    const outsidePermissions = await computeProposalNotePermissions({
      resourceId: notes.id,
      userId: user.id
    });

    const anonPermissions = await computeProposalNotePermissions({
      resourceId: notes.id,
      userId: user.id
    });

    expect(outsidePermissions).toMatchObject(new AvailablePagePermissions({ isReadonlySpace: false }).empty);
    expect(anonPermissions).toMatchObject(new AvailablePagePermissions({ isReadonlySpace: false }).empty);
  });

  it('should throw an error if the page is not of type proposal_notes', async () => {
    const page = await testUtilsProposals.generateProposal({ spaceId: space.id, userId: admin.id });

    await expect(computeProposalNotePermissions({ resourceId: page.id, userId: admin.id })).rejects.toThrow(
      InvalidInputError
    );
  });
  it('should throw an error if the page does not have a parent', async () => {
    const page = await prisma.page.create({
      data: {
        path: 'test',
        title: 'test',
        type: 'proposal_notes',
        updatedBy: admin.id,
        author: { connect: { id: admin.id } },
        contentText: '',
        space: { connect: { id: space.id } }
      }
    });

    await expect(computeProposalNotePermissions({ resourceId: page.id, userId: admin.id })).rejects.toThrow(
      InvalidInputError
    );
  });
});
