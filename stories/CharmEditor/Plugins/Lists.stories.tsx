import { Paper } from '@mui/material';
import { Provider } from 'react-redux';

import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { mockStateStore } from 'components/common/DatabaseEditor/testUtils';
import { _, jsonDoc } from 'lib/prosemirror/builders';

import { renderEditorWithContent } from '../renderEditor';

// CharmEditore uses boards state, so we need to mock it
const store = mockStateStore([], {
  boards: {
    boards: []
  }
});

export default {
  title: 'common/CharmEditor/Plugins/Lists',
  component: Lists,
  decorators: [
    (Story: any) => (
      <Provider store={store}>
        <Paper sx={{ p: 4 }}>
          <PageEditorContainer>
            <Story />
          </PageEditorContainer>
        </Paper>
      </Provider>
    )
  ]
};

export function Lists() {
  const content = jsonDoc(
    _.heading({ level: 2 }, 'Bullet list'),
    _.bullet_list(_.list_item(_.p('Bread')), _.list_item(_.p('Milk')), _.list_item(_.p('Vegetables'))),
    _.bullet_list({ indent: 1 }, _.list_item(_.p('Cucumber')), _.list_item(_.p('Pumpkin'))),
    _.bullet_list({ indent: 2 }, _.list_item(_.p('Squash'))),
    _.bullet_list({ indent: 3 }, _.list_item(_.p('Zucchini'))),
    _.heading({ level: 2 }, 'Ordered list'),
    _.ordered_list(_.list_item(_.p('Bread')), _.list_item(_.p('Milk')), _.list_item(_.p('Vegetables'))),
    _.ordered_list({ indent: 1 }, _.list_item(_.p('Cucumber')), _.list_item(_.p('Pumpkin'))),
    _.ordered_list({ indent: 2 }, _.list_item(_.p('Squash'))),
    _.ordered_list({ indent: 3 }, _.list_item(_.p('Zucchini'))),
    _.heading({ level: 2 }, 'Todo list'),
    _.bullet_list(
      _.list_item({ todoChecked: true }, _.p('Task 1')),
      _.list_item({ todoChecked: false }, _.p('Task 2'))
    ),
    _.bullet_list({ indent: 1 }, _.list_item({ todoChecked: false }, _.p('Nested task')))
  );
  return renderEditorWithContent({ content, title: 'Lists' });
}
