import { Paper } from '@mui/material';
import { Provider } from 'react-redux';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import { builders as _, jsonDoc } from 'testing/prosemirror/builders';

import { renderEditorWithContent } from '../renderEditor';

// CharmEditore uses boards state, so we need to mock it
const store = mockStateStore([], {
  boards: {
    boards: []
  }
});

export default {
  title: 'common/CharmEditor/Plugins/Table',
  component: Table,
  decorators: [
    (Story: any) => (
      <Provider store={store}>
        <Paper sx={{ p: 4 }}>
          <Container>
            <Story />
          </Container>
        </Paper>
      </Provider>
    )
  ]
};

export function Table() {
  const content = jsonDoc(
    _.table(
      _.table_row(_.table_header(_.p('Header 1')), _.table_header(_.p('Header 2'))),
      _.table_row(_.table_cell(_.p('Cell 1')), _.table_cell(_.p('Cell 2')))
    )
  );
  return renderEditorWithContent({ content, title: 'Table' });
}
