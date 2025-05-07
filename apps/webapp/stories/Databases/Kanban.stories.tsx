import type { PageMeta } from '@charmverse/core/pages';
import { createMockBoard, createMockCard } from '@packages/testing/mocks/block';
import { createMockPage } from '@packages/testing/mocks/page';
import { generateSchemasForAllSupportedFieldTypes } from '@packages/testing/publicApi/schemas';
import { http, HttpResponse } from 'msw';
import type { MockStoreEnhanced } from 'redux-mock-store';
import { GlobalContext } from 'stories/lib/GlobalContext';
import { v4 as uuid } from 'uuid';

import Kanban from 'components/common/DatabaseEditor/components/kanban/kanban';
import type { RootState } from 'components/common/DatabaseEditor/store';
import { mockStateStore } from 'components/common/DatabaseEditor/testUtils';
import type { IPropertyTemplate } from '@packages/databases/board';
import { createTableView } from '@packages/databases/tableView';

import { spaces } from '../lib/mockData';

export default {
  title: 'Databases/Composites',
  component: Kanban
};

const firstUserId = uuid();
const secondUserId = uuid();

const space = spaces[0];

const board = createMockBoard();

const schema = generateSchemasForAllSupportedFieldTypes();

board.fields.cardProperties = Object.values(schema) as IPropertyTemplate[];

const boardPage: PageMeta = {
  lensPostLink: null,
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
  syncWithPageId: null,
  sourceTemplateId: null
};

const card1 = createMockCard(board);

card1.fields.properties = {
  [schema.text.id]: 'First',
  [schema.checkbox.id]: 'true',
  [schema.date.id]: '{"from":1694001600000}',
  [schema.email.id]: 'test1@example.com',
  [schema.multiSelect.id]: [schema.multiSelect.options[0].id, schema.multiSelect.options[1].id],
  [schema.number.id]: 7223,
  [schema.person.id]: firstUserId,
  [schema.phone.id]: '+1 (234) 7223 234',
  [schema.select.id]: schema.select.options[0].id,
  [schema.url.id]: 'https://www.google.com'
};

const card2 = createMockCard(board);

card2.fields.properties = {
  [schema.text.id]: 'Second',
  [schema.checkbox.id]: 'false',
  [schema.date.id]: '{"from":1694501600000}',
  [schema.email.id]: 'test2@example.com',
  [schema.multiSelect.id]: [schema.multiSelect.options[1].id, schema.multiSelect.options[2].id],
  [schema.number.id]: 8345,
  [schema.person.id]: secondUserId,
  [schema.phone.id]: '+1 (345) 8345 345',
  [schema.select.id]: schema.select.options[1].id,
  [schema.url.id]: 'https://www.example.com'
};

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
const view = createTableView({ board });

view.fields.groupById = schema.select.id;
view.fields.cardOrder = [card1.id, card2.id];
view.fields.viewType = 'board';
view.fields.visibleOptionIds = schema.select.options.map((opt) => opt.id);
view.fields.visiblePropertyIds = [schema.select.id];

const reduxStore = mockStateStore([], {
  boards: {
    boards: {
      [board.id]: board
    }
  },
  views: {
    current: undefined,
    views: {
      [view.id]: view
    },
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
}) as MockStoreEnhanced<Pick<RootState, 'boards' | 'views' | 'cards'>>;

function voidFunction() {
  return Promise.resolve();
}

export function DatabaseKanbanView() {
  return (
    <GlobalContext reduxStore={reduxStore}>
      <div className='focalboard-body'>
        <Kanban
          board={board}
          showCard={voidFunction}
          readOnly={false}
          cards={[card1, card2]}
          hiddenGroups={[]}
          activeView={view}
          groupByProperty={schema.select}
          addCard={voidFunction}
          onCardClicked={voidFunction}
          selectedCardIds={[]}
          visibleGroups={[
            { id: card1.id, cards: [card1], option: schema.select.options[0] },
            { id: card2.id, cards: [card2], option: schema.select.options[1] }
          ]}
        />
      </div>
    </GlobalContext>
  );
}

DatabaseKanbanView.parameters = {
  msw: {
    handlers: {
      pages: http.get('/api/spaces/:spaceId/pages', () => {
        return HttpResponse.json([boardPage, page1, page2]);
      }),
      getBlock: http.get('/api/blocks/:pageId', ({ params }) => {
        return HttpResponse.json(reduxStore.getState().cards.cards[params.pageId as string]);
      }),
      updateBlocks: http.put('/api/blocks', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json(body);
      }),
      views: http.get('/api/blocks/:pageId/views', () => {
        return HttpResponse.json([view]);
      })
    }
  }
};
