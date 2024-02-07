import type { PageMeta } from '@charmverse/core/pages';
import { Paper } from '@mui/material';
import { rest } from 'msw';
import { GlobalContext } from 'stories/lib/GlobalContext';
import { v4 as uuid } from 'uuid';

import CardDetailProperties from 'components/common/BoardEditor/focalboard/src/components/cardDetail/cardDetailProperties';
import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import { CardPropertiesWrapper } from 'components/common/CharmEditor/CardPropertiesWrapper';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { createTableView } from 'lib/focalboard/tableView';
import { createMockBoard, createMockCard } from 'testing/mocks/block';
import { createMockPage } from 'testing/mocks/page';
import { generateSchemasForAllSupportedFieldTypes } from 'testing/publicApi/schemas';

import { spaces } from '../lib/mockData';

export default {
  title: 'Databases/Composites',
  component: CardDetailProperties
};

const firstUserId = uuid();

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
  syncWithPageId: null,
  sourceTemplateId: null
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
const page1 = createMockPage({
  id: card1.id,
  type: 'card',
  title: 'Card 1'
});

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
      [card1.id]: card1
    },
    templates: {}
  }
});

export function CardPropsView() {
  return (
    <GlobalContext reduxStore={reduxStore}>
      <Paper>
        <CardPropertiesWrapper>
          <CardDetailProperties
            board={board}
            readOnly={false}
            views={[view]}
            activeView={view}
            card={card1}
            cards={[card1]}
            pageUpdatedAt={new Date().toISOString()}
            pageUpdatedBy={firstUserId}
          />
        </CardPropertiesWrapper>
      </Paper>
    </GlobalContext>
  );
}

CardPropsView.parameters = {
  msw: {
    handlers: {
      pages: rest.get('/api/spaces/:spaceId/pages', (req, res, ctx) => {
        return res(ctx.json([boardPage, page1]));
      })
    }
  }
};
