import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import { Paper } from '@mui/material';
import { rest } from 'msw';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Provider } from 'react-redux';

import DocumentPage from 'components/[pageId]/DocumentPage/DocumentPage';
import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import { ProposalPage as ProposalPageComponent } from 'components/proposals/components/ProposalDialog/ProposalPage';
import type { ProposalFormInputs } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import type { ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { CurrentSpaceContext } from 'hooks/useCurrentSpace';
import { MembersProvider } from 'hooks/useMembers';
import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';
import { createMockSpace } from 'testing/mocks/space';
import { builders as _, jsonDoc } from 'testing/prosemirror/builders';

export default {
  title: 'common/Proposals',
  component: ProposalPageComponent
};

const space = createMockSpace();

const reduxStore = mockStateStore([], {
  boards: {
    boards: []
  },
  comments: {
    comments: []
  }
});

function Context({ children }: { children: ReactNode }) {
  const spaceContext = useRef<ICurrentSpaceContext>({
    isLoading: false,
    refreshCurrentSpace: () => {},
    space
  });
  // useEffect(() => {
  //   cache.set(`proposals/${space.id}/categories`, categories);
  // }, []);
  return (
    <CurrentSpaceContext.Provider value={spaceContext.current}>
      <MembersProvider>
        <Provider store={reduxStore}>{children}</Provider>
      </MembersProvider>
    </CurrentSpaceContext.Provider>
  );
}

export function NewProposal() {
  const [contentUpdated, setContentUpdated] = useState(false);
  const [formInputs, setFormInputs] = useState<ProposalFormInputs>({
    authors: [],
    categoryId: null,
    content: null,
    contentText: '',
    evaluationType: 'rubric',
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
    title: 'A simple proposition'
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
          setContentUpdated={setContentUpdated}
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
        <DocumentPage page={page} refreshPage={async () => {}} readOnly={true} savePage={() => {}} />
      </Paper>
    </Context>
  );
}

ProposalInEvaluation.parameters = {
  msw: {
    handlers: {
      proposalFlowFlags: rest.get(`/api/proposals/:pageId/compute-flow-flags`, (req, res, ctx) => {
        const permissions: ProposalFlowPermissionFlags = {
          draft: false,
          discussion: false,
          review: false,
          reviewed: true,
          vote_active: false,
          vote_closed: false,
          evaluation_active: false,
          evaluation_closed: false
        };
        return res(ctx.json(permissions));
      }),
      proposal: rest.get('/api/proposals/:proposalId', (req, res, ctx) => {
        const proposal = createMockProposal({
          evaluationType: 'rubric',
          status: 'evaluation_active',
          rubricCriteria: [
            {
              id: '1',
              proposalId: '1',
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
              proposalId: '1',
              title: 'Five stars',
              description: null,
              type: 'range',
              parameters: {
                min: 1,
                max: 5
              }
            }
          ]
        });
        return res(ctx.json(proposal));
      })
    }
  }
};
