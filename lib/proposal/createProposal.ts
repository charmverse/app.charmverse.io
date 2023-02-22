import type { Page, PrismaPromise, ProposalStatus } from '@prisma/client';
import { v4 as uuid } from 'uuid';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { createPage } from 'lib/pages/server/createPage';

import type { IPageWithPermissions } from '../pages';
import { getPagePath } from '../pages';

type PageProps = Partial<Pick<Page, 'title' | 'content' | 'contentText'>>;

export type CreateProposalInput = {
  pageId?: string;
  pageProps?: PageProps;
  categoryId: string;
  userId: string;
  spaceId: string;
};

export async function createProposal({ userId, spaceId, categoryId, pageProps, pageId }: CreateProposalInput) {
  const proposalId = pageId ?? uuid();
  const proposalStatus: ProposalStatus = 'draft';

  const existingPage =
    pageId &&
    (await prisma.page.findUnique({
      where: {
        id: pageId
      }
    }));

  function upsertPage(): PrismaPromise<Page> {
    if (existingPage) {
      return prisma.page.update({
        where: {
          id: pageId
        },
        data: {
          parentId: null, // unset parentId if this page was a db card before
          proposalId,
          type: 'proposal',
          updatedAt: new Date(),
          updatedBy: userId
        }
      });
    } else {
      return createPage({
        data: {
          id: proposalId,
          type: 'proposal',
          proposalId,
          path: getPagePath(),
          updatedBy: userId,
          createdBy: userId,
          spaceId,
          content: pageProps?.content ?? { type: 'doc', content: [] },
          contentText: pageProps?.contentText ?? '',
          title: pageProps?.title ?? ''
        }
      });
    }
  }

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
        }
      },
      include: {
        authors: true,
        reviewers: true,
        category: true
      }
    }),
    upsertPage(),
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
