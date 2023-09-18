import type { PageMeta } from '@charmverse/core/pages';
import { Paper } from '@mui/material';
import { rest } from 'msw';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { v4 as uuid } from 'uuid';

import CenterPanel from 'components/common/BoardEditor/focalboard/src/components/centerPanel';
import { initialDatabaseLoad } from 'components/common/BoardEditor/focalboard/src/store/databaseBlocksLoad';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import type { ICurrentSpaceContext } from 'hooks/useCurrentSpace';
import { CurrentSpaceContext } from 'hooks/useCurrentSpace';
import { MembersProvider } from 'hooks/useMembers';
import { PagesProvider } from 'hooks/usePages';
import { UserProvider } from 'hooks/useUser';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { createTableView } from 'lib/focalboard/tableView';
import { createMockBoard, createMockCard } from 'testing/mocks/block';
import { createMockPage } from 'testing/mocks/page';
import { generateSchemasForAllSupportedFieldTypes } from 'testing/publicApi/schemas';

import { spaces } from '../../../../.storybook/lib/mockData';

export default {
  title: 'common/Databases',
  component: CenterPanel
};

const firstUserId = uuid();
const secondUserId = uuid();

const space = spaces[0];

const board = createMockBoard();

const schema = generateSchemasForAllSupportedFieldTypes();

board.fields.cardProperties = Object.values(schema) as IPropertyTemplate[];

const boardPage: PageMeta = {
  id: board.id,
  boardId: board.id,
  bountyId: null,
  cardId: null,
  createdAt: new Date(),
  createdBy: uuid(),
  deletedAt: null,
  deletedBy: null,
  galleryImage: null,
  hasContent: false,
  headerImage: null,
  icon: null,
  index: 0,
  parentId: null,
  path: 'example-path',
  proposalId: null,
  spaceId: uuid(),
  title: 'Demo board',
  type: 'board',
  updatedAt: new Date(),
  updatedBy: uuid(),
  syncWithPageId: null
};

const view = createTableView({ board });

const card1 = createMockCard(board);

card1.fields.properties = {
  [schema.text.id]: 'First',
  [schema.checkbox.id]: 'true',
  [schema.date.id]: '{"from":"1695067400713"}',
  [schema.email.id]: 'test1@example.com',
  [schema.multiSelect.id]: [schema.multiSelect.options[0].id, schema.multiSelect.options[1].id],
  [schema.number.id]: 7223,
  [schema.person.id]: firstUserId,
  [schema.phone.id]: '+1 (234) 7223 234',
  [schema.select.id]: schema.select.options[0].id,
  [schema.url.id]: 'https://www.google.com'
};

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
      [card1.id]: card1,
      [card2.id]: card2
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
        <PagesProvider>
          <MembersProvider>
            <Provider store={reduxStore}>{children}</Provider>
          </MembersProvider>
        </PagesProvider>
      </CurrentSpaceContext.Provider>
    </UserProvider>
  );
}

function voidFunction() {
  return Promise.resolve();
}

export function DatabaseTableView() {
  // const dispatch = useAppDispatch();

  // useEffect(() => {
  //   dispatch(initialDatabaseLoad({ pageId: board.id }));
  // }, []);

  return (
    <Context>
      <Paper>
        <CenterPanel
          board={board}
          currentRootPageId={board.id}
          setPage={voidFunction}
          showCard={voidFunction}
          showView={voidFunction}
          readOnly={false}
          readOnlySourceData={false}
          views={[view]}
          activeView={view}
          page={boardPage}
        />
      </Paper>
    </Context>
  );
}

DatabaseTableView.parameters = {
  msw: {
    handlers: {
      pages: rest.get('/api/spaces/:spaceId/pages', (req, res, ctx) => {
        return res(ctx.json([boardPage, page1, page2]));
      }),
      blocks: rest.get('/api/blocks/:pageId/subtree', (req, res, ctx) => {
        return res(ctx.json([board, card1, card2]));
      }),
      views: rest.get('/api/blocks/:pageId/views', (req, res, ctx) => {
        return res(ctx.json([view]));
      })
    }
  }
};
