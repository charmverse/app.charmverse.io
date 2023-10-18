import { Box, Paper } from '@mui/material';
import { rest } from 'msw';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Provider } from 'react-redux';

import DocumentPage from 'components/[pageId]/DocumentPage/DocumentPage';
import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import type { ProposalPageAndPropertiesInput } from 'components/proposals/components/ProposalDialog/hooks/useProposalDialog';
import { NewProposalPage as ProposalPageComponent } from 'components/proposals/components/ProposalDialog/NewProposalPage';
import type { ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { CurrentSpaceContext } from 'hooks/useCurrentSpace';
import { MembersProvider } from 'hooks/useMembers';
import { PagesProvider } from 'hooks/usePages';
import { UserProvider } from 'hooks/useUser';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';
import { builders as _, jsonDoc } from 'testing/prosemirror/builders';

import { members, proposalCategories, spaces, userProfile } from '../lib/mockData';

import { ProposalsPageStory } from './ProposalsPageStory';

export default {
  title: 'Proposals/Views',
  component: ProposalPageComponent
};

const space = spaces[0];

const reduxStore = mockStateStore([], {
  boards: {
    boards: []
  },
  comments: {
    comments: [],
    loadedCardComments: []
  }
});

function Context({ children }: { children: ReactNode }) {
  // mock the current space since it usually relies on the URL
  const spaceContext = useRef<ICurrentSpaceContext>({
    isLoading: false,
    refreshCurrentSpace: () => {},
    space
  });
  return (
    <UserProvider>
      <CurrentSpaceContext.Provider value={spaceContext.current}>
        <MembersProvider>
          <Provider store={reduxStore}>{children}</Provider>
        </MembersProvider>
      </CurrentSpaceContext.Provider>
    </UserProvider>
  );
}

export function ProposalsPage() {
  return (
    <Context>
      <PagesProvider>
        <Paper>
          <ProposalsPageStory />
        </Paper>
      </PagesProvider>
    </Context>
  );
}

ProposalsPage.parameters = ProposalsPageStory.parameters;

export function NewProposal() {
  const [contentUpdated, setContentUpdated] = useState(false);
  const [formInputs, setFormInputs] = useState<ProposalPageAndPropertiesInput>({
    authors: [],
    categoryId: null,
    content: null,
    contentText: '',
    evaluationType: 'rubric',
    headerImage: null,
    icon: null,
    proposalTemplateId: null,
    reviewers: [],
    rubricCriteria: [
      {
        id: '1',
        title: 'Spelling and grammar',
        description: 'Has correct punctuation',
        type: 'range',
        parameters: {
          min: 0,
          max: 1
        }
      },
      {
        id: '2',
        title: 'Five stars',
        type: 'range',
        parameters: {
          min: 1,
          max: 5
        }
      }
    ],
    title: 'A simple proposition',
    fields: { properties: {} }
  });

  return (
    <Context>
      <Paper>
        <ProposalPageComponent
          formInputs={formInputs}
          setFormInputs={(_formInputs) => {
            setContentUpdated(true);
            setFormInputs((__formInputs) => ({ ...__formInputs, ..._formInputs }));
          }}
          contentUpdated={contentUpdated}
        />
      </Paper>
    </Context>
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
    <Context>
      <Paper>
        <Box sx={{ overflowY: 'auto' }}>
          <DocumentPage page={page} refreshPage={async () => {}} readOnly={true} savePage={() => {}} />
        </Box>
      </Paper>
    </Context>
  );
}

ProposalInEvaluation.parameters = {
  msw: {
    handlers: {
      proposalReviewerPool: rest.get('/api/proposals/reviewer-pool', (req, res, ctx) => {
        return res(ctx.json(null));
      }),
      proposal: rest.get('/api/proposals/:proposalId', (req, res, ctx) => {
        const rubricCriteria: ProposalWithUsersAndRubric['rubricCriteria'] = [
          {
            id: '1',
            proposalId: '1',
            title: 'Developer Presence',
            description:
              'Makes their point clearly. This is a long description designed to appear on multiple lines :)',
            type: 'range',
            parameters: {
              min: 0,
              max: 2
            }
          },
          {
            id: '2',
            proposalId: '1',
            title: 'Developer Draw',
            description:
              'Makes their point clearly. This is a long description designed to appear on multiple lines :)',
            type: 'range',
            parameters: {
              min: 0,
              max: 10
            }
          },
          {
            id: '3',
            proposalId: '1',
            title: 'Developer Commitment',
            description: `A\nmulti-line\ndescription`,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            }
          },
          {
            id: '4',
            proposalId: '1',
            title: 'Developer activity',
            description: null,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            }
          },
          {
            id: '5',
            proposalId: '1',
            title: 'Community engagement',
            description: null,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            }
          },
          {
            id: '6',
            proposalId: '1',
            title: 'Twitter activity',
            description: null,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            }
          },
          {
            id: '7',
            proposalId: '1',
            title: 'Github activity',
            description: null,
            type: 'range',
            parameters: {
              min: 0,
              max: 4
            }
          }
        ];
        const rubricAnswers: ProposalWithUsersAndRubric['rubricAnswers'] = [
          ...rubricCriteria.map((criteria) => ({
            rubricCriteriaId: criteria.id,
            proposalId: criteria.proposalId,
            criteriaId: criteria.id,
            userId: userProfile.id,
            comment: 'Nice job',
            response: { score: criteria.parameters.max - 1 }
          })),
          ...rubricCriteria.map((criteria) => ({
            rubricCriteriaId: criteria.id,
            proposalId: criteria.proposalId,
            criteriaId: criteria.id,
            userId: members[1].id,
            comment: 'Needs work and probably some more details',
            response: { score: criteria.parameters.min + 1 }
          }))
        ];
        const proposal = createMockProposal({
          authors: [{ proposalId: '', userId: members[0].id }],
          reviewers: [
            { id: '1', proposalId: '', roleId: null, userId: userProfile.id },
            { id: '2', proposalId: '', roleId: null, userId: members[0].id },
            { id: '3', proposalId: '', roleId: null, userId: members[1].id }
          ],
          categoryId: proposalCategories[0].id,
          evaluationType: 'rubric',
          status: 'evaluation_active',
          rubricCriteria,
          rubricAnswers
        });
        return res(ctx.json(proposal));
      })
    }
  }
};
