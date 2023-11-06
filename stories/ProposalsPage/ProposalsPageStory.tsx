import { rest } from 'msw';

import { ProposalsPageWithProviders } from 'components/proposals/ProposalsPageWithProviders';
import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';
import { builders as _, jsonDoc } from 'testing/prosemirror/builders';

import { members, proposalCategories, userProfile } from '../lib/mockData';

export function ProposalsPageStory() {
  return <ProposalsPageWithProviders title='Proposals' />;
}

// Data and api mocks

export const proposals = [
  createMockProposal({
    authors: [{ proposalId: '', userId: members[0].id }],
    reviewers: [
      { id: '1', proposalId: '', roleId: null, userId: userProfile.id },
      { id: '2', proposalId: '', roleId: null, userId: members[0].id }
    ],
    categoryId: proposalCategories[0].id,
    evaluationType: 'vote',
    status: 'draft'
  }),
  createMockProposal({
    authors: [{ proposalId: '', userId: members[1].id }],
    reviewers: [{ id: '1', proposalId: '', roleId: null, userId: userProfile.id }],
    categoryId: proposalCategories[1].id,
    evaluationType: 'vote',
    status: 'discussion'
  }),
  createMockProposal({
    authors: [{ proposalId: '', userId: members[2].id }],
    reviewers: [{ id: '1', proposalId: '', roleId: null, userId: userProfile.id }],
    categoryId: proposalCategories[2].id,
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
