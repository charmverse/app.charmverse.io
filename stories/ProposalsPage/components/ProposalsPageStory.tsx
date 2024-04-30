import { rest } from 'msw';
import type { ReactNode } from 'react';
import { v4 } from 'uuid';

import { PageSidebarProvider } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { ProposalsBoardProvider } from 'components/proposals/hooks/useProposalsBoard';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';
import { builders as _, jsonDoc } from 'lib/prosemirror/builders';
import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';

import { members, userProfile } from '../../lib/mockData';

export function ProposalsStoryProviders({ children }: { children: ReactNode }) {
  return (
    <ProposalsProvider>
      <ProposalBlocksProvider>
        <ProposalsBoardProvider>
          <PageSidebarProvider>{children}</PageSidebarProvider>
        </ProposalsBoardProvider>
      </ProposalBlocksProvider>
    </ProposalsProvider>
  );
}

export const withProposalProviders = (Story: any) => {
  return (
    <ProposalsStoryProviders>
      <Story />
    </ProposalsStoryProviders>
  );
};

export function ProposalsPageStory() {
  return (
    <ProposalsStoryProviders>
      <ProposalsPage title='Proposals' />
    </ProposalsStoryProviders>
  );
}

// Data and api mocks

export const proposals = [
  createMockProposal({
    authors: [{ proposalId: '', userId: members[0].id }],
    evaluations: [
      {
        reviewers: [
          { evaluationId: '1', id: '1', proposalId: '', roleId: null, userId: userProfile.id, systemRole: null },
          { evaluationId: '1', id: '2', proposalId: '', roleId: null, userId: members[0].id, systemRole: null }
        ]
      }
    ]
  }),
  createMockProposal({
    authors: [{ proposalId: '', userId: members[1].id }],
    evaluations: [
      {
        reviewers: [
          { evaluationId: '1', id: '1', proposalId: '', roleId: null, userId: userProfile.id, systemRole: null }
        ]
      }
    ],
    status: 'published'
  }),
  createMockProposal({
    authors: [{ proposalId: '', userId: members[2].id }],
    evaluations: [
      {
        reviewers: [
          { evaluationId: '1', id: '1', proposalId: '', roleId: null, userId: userProfile.id, systemRole: null }
        ]
      }
    ],
    status: 'published'
  })
].map((p) => ({
  ...p,
  currentStep: {
    title: 'Feedback',
    step: 'feedback',
    result: 'in_progress',
    id: v4(),
    index: 1
  }
}));

export const pages = proposals.map((p, i) =>
  createMockPage({
    proposalId: p.id,
    id: p.id,
    type: 'proposal',
    title: `A simple proposition ${i}`,
    content: jsonDoc(_.p('This is the content'))
  })
);

ProposalsPageStory.parameters = {
  msw: {
    handlers: {
      proposals: rest.get('/api/spaces/:spaceId/proposals', (req, res, ctx) => {
        return res(ctx.json(proposals));
      }),
      getProposalBlocks: rest.get('/api/spaces/:spaceId/proposals/blocks', (req, res, ctx) => {
        return res(ctx.json([]));
      }),
      createProposalBlocks: rest.post('/api/spaces/:spaceId/proposals/blocks', (req, res, ctx) => {
        return res(ctx.json(req.body));
      }),
      pages: rest.get('/api/spaces/:spaceId/pages', (req, res, ctx) => {
        return res(ctx.json(pages));
      })
    }
  }
};
