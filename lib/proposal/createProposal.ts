import type { ProposalStatus, Page, PrismaPromise, Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { createPage } from 'lib/pages/server/createPage';

import type { IPageWithPermissions } from '../pages';
import { getPagePath } from '../pages';

import { generateSyncProposalPermissions } from './syncProposalPermissions';

type ProposalPageInput = Partial<Pick<Page, 'content' | 'contentText' | 'id' | 'title'>>;

type ProposalInput = { reviewers?: { roleId?: string; userId?: string }[]; categoryId: string };

export type CreateProposalInput = {
  pageProps: ProposalPageInput;
  proposalProps: ProposalInput;
  userId: string;
  spaceId: string;
};

export async function createProposal({ pageProps, proposalProps, userId, spaceId }: CreateProposalInput) {
  const { id: pageId } = pageProps;

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
          content: pageProps.content ?? { type: 'doc', content: [] },
          contentText: pageProps.contentText ?? '',
          title: pageProps.title ?? ''
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
        category: { connect: { id: proposalProps.categoryId } },
        authors: {
          create: {
            userId
          }
        },
        ...(proposalProps?.reviewers
          ? {
              reviewers: {
                createMany: {
                  data: proposalProps.reviewers
                }
              }
            }
          : {})
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

  const [deleteArgs, createArgs] = await generateSyncProposalPermissions({ proposalId, isNewProposal: true });

  await prisma.$transaction([
    prisma.pagePermission.deleteMany(deleteArgs),
    ...createArgs.map((args) => prisma.pagePermission.create(args))
  ]);

  trackUserAction('new_proposal_created', { userId, pageId: page.id, resourceId: proposal.id, spaceId });

  return { page: page as IPageWithPermissions, proposal, workspaceEvent };
}
