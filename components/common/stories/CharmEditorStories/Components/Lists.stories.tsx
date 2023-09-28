import { Paper } from '@mui/material';
import { Provider } from 'react-redux';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { mockStateStore } from 'components/common/BoardEditor/focalboard/src/testUtils';
import { _, jsonDoc } from 'testing/prosemirror/builders';

import { renderEditorWithContent } from '../renderEditor';

// CharmEditore uses boards state, so we need to mock it
const store = mockStateStore([], {
  boards: {
    boards: []
  }
});

export default {
  title: 'common/CharmEditor/Components/Lists',
  component: Lists,
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

export function Lists() {
  const content = jsonDoc(
    _.heading({ level: 2 }, 'Bullet list'),
    _.bullet_list(_.list_item(_.p('Bread')), _.list_item(_.p('Milk')), _.list_item(_.p('Vegetables'))),
    _.bullet_list({ indent: 1 }, _.list_item(_.p('Cucumber')), _.list_item(_.p('Pumpkin'))),
    _.bullet_list({ indent: 2 }, _.list_item(_.p('Squash'))),
    _.bullet_list({ indent: 3 }, _.list_item(_.p('Zucchini'))),
    _.heading({ level: 2 }, 'Old Bullet list'),
    _.bulletList(
      _.listItem(_.p('Bread')),
      _.listItem(_.p('Milk')),
      _.listItem(
        _.p('Vegetables'),
        _.bulletList(
          _.listItem(_.p('Cucumber')),
          _.listItem(_.p('Pumpkin'), _.bulletList(_.listItem(_.p('Squash'), _.bulletList(_.listItem(_.p('Zucchini'))))))
        )
      )
    ),
    _.heading({ level: 2 }, 'Ordered list'),
    _.ordered_list(_.list_item(_.p('Bread')), _.list_item(_.p('Milk')), _.list_item(_.p('Vegetables'))),
    _.ordered_list({ indent: 1 }, _.list_item(_.p('Cucumber')), _.list_item(_.p('Pumpkin'))),
    _.ordered_list({ indent: 2 }, _.list_item(_.p('Squash'))),
    _.ordered_list({ indent: 3 }, _.list_item(_.p('Zucchini'))),
    _.heading({ level: 2 }, 'Old Ordered list'),
    _.orderedList(
      _.listItem(_.p('Bread')),
      _.listItem(_.p('Milk')),
      _.listItem(
        _.p('Vegetables'),
        _.orderedList(
          _.listItem(_.p('Cucumber')),
          _.listItem(
            _.p('Pumpkin'),
            _.orderedList(_.listItem(_.p('Squash'), _.orderedList(_.listItem(_.p('Zucchini')))))
          )
        )
      )
    ),
    _.heading({ level: 2 }, 'Todo list'),
    _.bullet_list(
      _.list_item({ todoChecked: true }, _.p('Task 1')),
      _.list_item({ todoChecked: false }, _.p('Task 2'))
    ),
    _.bullet_list({ indent: 1 }, _.list_item({ todoChecked: false }, _.p('Nested task'))),
    _.heading({ level: 2 }, 'Old Todo list'),
    _.bulletList(
      _.listItem({ todoChecked: true }, _.p('Task 1')),
      _.listItem(
        { todoChecked: false },
        _.p('Task 2'),
        _.bulletList(_.listItem({ todoChecked: false }, _.p('Nested task')))
      )
    )
  );
  return renderEditorWithContent({ content, title: 'Lists' });
}
