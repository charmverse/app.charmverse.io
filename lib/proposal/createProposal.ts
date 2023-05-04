import { prisma } from '@charmverse/core';
import type { Page, ProposalStatus } from '@charmverse/core/dist/prisma';
import { v4 as uuid } from 'uuid';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { createPage } from 'lib/pages/server/createPage';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { InvalidInputError } from 'lib/utilities/errors';

import type { IPageWithPermissions } from '../pages';
import { getPagePath } from '../pages';

type PageProps = Partial<Pick<Page, 'title' | 'content' | 'contentText'>>;

export type CreateProposalInput = {
  pageId?: string;
  pageProps?: PageProps;
  categoryId: string;
  reviewers?: TargetPermissionGroup<'role' | 'user'>[];
  userId: string;
  spaceId: string;
};

export async function createProposal({ userId, spaceId, categoryId, pageProps, reviewers }: CreateProposalInput) {
  if (!categoryId) {
    throw new InvalidInputError('Proposal must be linked to a category');
  }

  const proposalId = uuid();
  const proposalStatus: ProposalStatus = 'draft';

  // Using a transaction to ensure both the proposal and page gets created together
  const [proposal, page, workspaceEvent] = await prisma.$transaction([
    prisma.proposal.create({
      data: {
        // Add page creator as the proposal's first author
        createdBy: userId,
        id: proposalId,
        space: { connect: { id: spaceId } },
        status: proposalStatus,
        category: { connect: { id: categoryId } },
        authors: {
          create: {
            userId
          }
        },
        reviewers: reviewers
          ? {
              createMany: {
                data: reviewers.map((reviewer) => ({
                  userId: reviewer.group === 'user' ? reviewer.id : undefined,
                  roleId: reviewer.group === 'role' ? reviewer.id : undefined
                }))
              }
            }
          : undefined
      },
      include: {
        authors: true,
        reviewers: true,
        category: true
      }
    }),
    createPage({
      data: {
        content: pageProps?.content ?? undefined,
        proposalId,
        contentText: pageProps?.contentText ?? '',
        path: getPagePath(),
        title: pageProps?.title ?? '',
        updatedBy: userId,
        createdBy: userId,
        spaceId,
        id: proposalId,
        type: 'proposal'
      }
    }),
    prisma.workspaceEvent.create({
      data: {
        type: 'proposal_status_change',
        meta: {
          newStatus: proposalStatus
        },
        actorId: userId,
        pageId: proposalId,
        spaceId
      }
    })
  ]);
  trackUserAction('new_proposal_created', { userId, pageId: page.id, resourceId: proposal.id, spaceId });

  return { page: page as IPageWithPermissions, proposal, workspaceEvent };
}
