import { Paper } from '@mui/material';
import { rest } from 'msw';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Provider } from 'react-redux';

import DocumentPage from 'components/[pageId]/DocumentPage/DocumentPage';
import TableComponent from 'components/common/BoardEditor/focalboard/src/components/table/table';
import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import { ProposalsPageStory } from 'components/common/stories/ProposalsPage/ProposalsPageStory';
import type { ProposalPageAndPropertiesInput } from 'components/proposals/components/ProposalDialog/hooks/useProposalDialog';
import { NewProposalPage as ProposalPageComponent } from 'components/proposals/components/ProposalDialog/NewProposalPage';
import type { ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { CurrentSpaceContext } from 'hooks/useCurrentSpace';
import { MembersProvider } from 'hooks/useMembers';
import { PagesProvider } from 'hooks/usePages';
import { UserProvider } from 'hooks/useUser';
import { createBoard } from 'lib/focalboard/board';
import { createTableView } from 'lib/focalboard/tableView';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import { createMockBoard, createMockCard } from 'testing/mocks/block';
import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';
import { builders as _, jsonDoc } from 'testing/prosemirror/builders';

import { members, proposalCategories, spaces, userProfile } from '../../../../.storybook/lib/mockData';

export default {
  title: 'common/Databases',
  component: TableComponent
};

const space = spaces[0];

const board = createMockBoard();

const view = createTableView({ board });

const card1 = createMockCard(board);
const card2 = createMockCard(board);

const page1 = createMockPage({
  id: card1.id,
  type: 'card',
  title: 'Card 1'
});

const page2 = createMockPage({
  id: card2.id,
  type: 'card',
  title: 'Card 2'
});

const reduxStore = mockStateStore([], {
  boards: {
    boards: {
      [board.id]: board
    }
  },
  views: {
    current: undefined,
    views: {},
    loadedBoardViews: {}
  },
  cards: {
    current: '',
    cards: {
      [card1.id]: card1
    },
    templates: {}
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

function voidFunction() {
  return Promise.resolve();
}

export function Table() {
  return (
    <Context>
      <PagesProvider>
        <Paper>
          <TableComponent
            activeView={view}
            addCard={voidFunction}
            cardPages={[
              { card: card1, page: page1 },
              { card: card2, page: page2 }
            ]}
            showCard={voidFunction}
            visibleGroups={[]}
            board={board}
            readOnly={false}
            views={[view]}
            cardIdToFocusOnRender=''
            onCardClicked={voidFunction}
            readOnlySourceData={false}
            selectedCardIds={[page1.id]}
          />
        </Paper>
      </PagesProvider>
    </Context>
  );
}

Table.parameters = {
  msw: {
    handlers: {
      proposal: rest.get('/api/spaces/:spaceId', (req, res, ctx) => {
        return res(ctx.json([page1]));
      })
    }
  }
};
