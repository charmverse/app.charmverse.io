import { rest } from 'msw';

import { ProposalsPageWithProviders } from 'components/proposals/ProposalsPageWithProviders';
import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';
import { builders as _, jsonDoc } from 'testing/prosemirror/builders';

import { members, userProfile } from '../lib/mockData';

export function ProposalsPageStory() {
  return <ProposalsPageWithProviders title='Proposals' />;
}

// Data and api mocks

export const proposals = [
  createMockProposal({
    authors: [{ proposalId: '', userId: members[0].id }],
    reviewers: [
      { evaluationId: null, id: '1', proposalId: '', roleId: null, userId: userProfile.id, systemRole: null },
      { evaluationId: null, id: '2', proposalId: '', roleId: null, userId: members[0].id, systemRole: null }
    ],
    evaluationType: 'vote',
    status: 'draft'
  }),
  createMockProposal({
    authors: [{ proposalId: '', userId: members[1].id }],
    reviewers: [
      { evaluationId: null, id: '1', proposalId: '', roleId: null, userId: userProfile.id, systemRole: null }
    ],
    evaluationType: 'vote',
    status: 'discussion'
  }),
  createMockProposal({
    authors: [{ proposalId: '', userId: members[2].id }],
    reviewers: [
      { evaluationId: null, id: '1', proposalId: '', roleId: null, userId: userProfile.id, systemRole: null }
    ],
    evaluationType: 'rubric',
    status: 'review'
  })
];

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
