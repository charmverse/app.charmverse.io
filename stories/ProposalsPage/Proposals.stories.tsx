import { Box } from '@mui/material';
import { rest } from 'msw';
import { withCharmEditorProviders } from 'stories/CharmEditor/renderEditor';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { DocumentPageWithSidebars } from 'components/[pageId]/DocumentPage/DocumentPageWithSidebars';
import { HeaderSpacer } from 'components/common/PageLayout/components/Header/Header';
import { NewProposalPage as ProposalPageComponent } from 'components/proposals/ProposalPage/NewProposalPage';
import type { PopulatedEvaluation } from 'lib/proposal/interface';
import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';
import { builders as _, jsonDoc } from 'testing/prosemirror/builders';

import { members, userProfile } from '../lib/mockData';

import { ProposalsPageStory, withProposalProviders } from './components/ProposalsPageStory';

export default {
  title: 'Proposals/Views',
  component: ProposalPageComponent,
  decorators: [withProposalProviders, withCharmEditorProviders]
};

export function ProposalsPage() {
  return (
    <GlobalContext>
      <ProposalsPageStory />
    </GlobalContext>
  );
}

ProposalsPage.parameters = ProposalsPageStory.parameters;

export function NewProposal() {
  return (
    <GlobalContext>
      <HeaderSpacer />
      <ProposalPageComponent />
    </GlobalContext>
  );
}

export function ProposalInEvaluation() {
  const page = createMockPage({
    title: 'A simple proposition',
    type: 'proposal',
    content: jsonDoc(_.p('This is the content')),
    proposalId: 'a proposal id'
  });

  return (
    <GlobalContext>
      <Box sx={{ overflowY: 'auto' }}>
        <DocumentPageWithSidebars page={page} readOnly={true} savePage={() => {}} />
      </Box>
    </GlobalContext>
  );
}

ProposalInEvaluation.parameters = {
  msw: {
    handlers: {
      proposal: rest.get('/api/proposals/:proposalId', (req, res, ctx) => {
        const rubricCriteria: PopulatedEvaluation['rubricCriteria'] = [
          {
            id: '1',
            index: -1,
            proposalId: '1',
            title: 'Developer Presence',
            description:
              'Makes their point clearly. This is a long description designed to appear on multiple lines :)',
            type: 'range',
            parameters: {
              min: 0,
              max: 2
            },
            evaluationId: '1'
          },
          {
            id: '2',
            index: -1,
            proposalId: '1',
            title: 'Developer Draw',
            description:
              'Makes their point clearly. This is a long description designed to appear on multiple lines :)',
            type: 'range',
            parameters: {
              min: 0,
              max: 10
            },
            evaluationId: '1'
          },
          {
            id: '3',
            index: -1,
            proposalId: '1',
            title: 'Developer Commitment',
            description: `A\nmulti-line\ndescription`,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            },
            evaluationId: '1'
          },
          {
            id: '4',
            index: -1,
            proposalId: '1',
            title: 'Developer activity',
            description: null,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            },
            evaluationId: '1'
          },
          {
            id: '5',
            index: -1,
            proposalId: '1',
            title: 'Community engagement',
            description: null,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            },
            evaluationId: '1'
          },
          {
            id: '6',
            index: -1,
            proposalId: '1',
            title: 'Twitter activity',
            description: null,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            },
            evaluationId: '1'
          },
          {
            id: '7',
            index: -1,
            proposalId: '1',
            title: 'Github activity',
            description: null,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            },
            evaluationId: '1'
          }
        ];
        const rubricAnswers: PopulatedEvaluation['rubricAnswers'] = [
          ...rubricCriteria.map((criteria) => ({
            rubricCriteriaId: criteria.id,
            proposalId: criteria.proposalId,
            criteriaId: criteria.id,
            userId: userProfile.id,
            comment: 'Nice job',
            response: { score: criteria.parameters.max - 1 },
            evaluationId: criteria.evaluationId
          })),
          ...rubricCriteria.map((criteria) => ({
            rubricCriteriaId: criteria.id,
            proposalId: criteria.proposalId,
            criteriaId: criteria.id,
            userId: members[1].id,
            comment: 'Needs work and probably some more details',
            response: { score: criteria.parameters.min + 1 },
            evaluationId: criteria.evaluationId
          }))
        ];
        const proposal = createMockProposal({
          authors: [{ proposalId: '', userId: members[0].id }],
          status: 'published',
          evaluations: [
            {
              index: 0,
              draftRubricAnswers: [],
              result: null,
              id: '11',
              title: 'Rubric evaluation',
              completedAt: null,
              decidedBy: null,
              permissions: [],
              voteSettings: null,
              proposalId: '',
              voteId: null,
              snapshotId: null,
              snapshotExpiry: null,
              type: 'rubric',
              rubricCriteria,
              rubricAnswers,
              reviewers: [
                { evaluationId: '1', id: '1', proposalId: '', roleId: null, userId: userProfile.id, systemRole: null },
                { evaluationId: '1', id: '2', proposalId: '', roleId: null, userId: members[0].id, systemRole: null },
                { evaluationId: '1', id: '3', proposalId: '', roleId: null, userId: members[1].id, systemRole: null }
              ]
            }
          ]
        });
        return res(ctx.json(proposal));
      })
    }
  }
};
