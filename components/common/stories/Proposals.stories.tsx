import { Paper } from '@mui/material';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Provider } from 'react-redux';

import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import { ProposalPage as ProposalPageComponent } from 'components/proposals/components/ProposalDialog/ProposalPage';
import type { ProposalFormInputs } from 'components/proposals/components/ProposalProperties/ProposalProperties';
import type { ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { CurrentSpaceContext } from 'hooks/useCurrentSpace';
import { createMockSpace } from 'testing/mocks/space';

export default {
  title: 'common/Proposals',
  component: ProposalPage
};

const reduxStore = mockStateStore([], {
  boards: {
    boards: []
  }
});

function Context({ children }: { children: ReactNode }) {
  const spaceContext = useRef<ICurrentSpaceContext>({
    isLoading: false,
    refreshCurrentSpace: () => {},
    space: createMockSpace()
  });
  return (
    <CurrentSpaceContext.Provider value={spaceContext.current}>
      <Provider store={reduxStore}>{children}</Provider>
    </CurrentSpaceContext.Provider>
  );
}

export function ProposalPage() {
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
