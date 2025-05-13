import { Paper } from '@mui/material';
import { builders as _, jsonDoc } from '@packages/bangleeditor/builders';
import { Provider } from 'react-redux';

import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { mockStateStore } from 'components/common/DatabaseEditor/testUtils';

import { renderEditorWithContent } from '../renderEditor';

// CharmEditore uses boards state, so we need to mock it
const store = mockStateStore([], {
  boards: {
    boards: []
  }
});

const contentWithColumnsAndTables = {
  type: 'doc',
  content: [
    {
      type: 'columnLayout',
      attrs: { track: [] },
      content: [
        {
          type: 'columnBlock',
          attrs: { size: 170, track: [] },
          content: [
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [
                {
                  text: 'Column 1',
                  type: 'text',
                  marks: [
                    { type: 'bold' },
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T09:50:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    }
                  ]
                },
                {
                  type: 'hardBreak',
                  marks: [
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T09:50:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    }
                  ]
                },
                {
                  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec scelerisque semper sagittis. Quisque at sapien magna. Aenean lobortis, diam vitae posuere efficitur, lacus ante venenatis ex, malesuada viverra nisl massa id felis. Integer at fringilla tortor, accumsan placerat felis. Ut consectetur egestas est, sed auctor nisl dignissim nec.',
                  type: 'text',
                  marks: [
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T09:50:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    },
                    { type: 'text-color', attrs: { color: null, bgColor: null } }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'columnBlock',
          attrs: { track: [] },
          content: [
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [
                {
                  text: 'Column 2',
                  type: 'text',
                  marks: [
                    { type: 'bold' },
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T09:50:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    }
                  ]
                }
              ]
            },
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [
                {
                  text: 'Etiam purus dui, vestibulum sed euismod quis, pretium ac turpis. Pellentesque sit amet egestas quam, ac commodo leo. In auctor malesuada arcu vitae mattis. Cras sit amet metus finibus nulla varius vestibulum. Etiam tincidunt eros sem, eget varius tortor placerat eu. In venenatis interdum metus a rhoncus. Pellentesque ut libero dapibus, efficitur tortor id, rhoncus justo.',
                  type: 'text',
                  marks: [
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T09:50:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'columnBlock',
          attrs: { track: [] },
          content: [
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [
                {
                  text: 'Column 3',
                  type: 'text',
                  marks: [
                    { type: 'bold' },
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T09:50:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    }
                  ]
                }
              ]
            },
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [
                {
                  text: 'Narrow column',
                  type: 'text',
                  marks: [
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T09:50:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    },
                    { type: 'text-color', attrs: { color: null, bgColor: null } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      type: 'columnLayout',
      attrs: { track: [] },
      content: [
        {
          type: 'columnBlock',
          attrs: { size: 374, track: [] },
          content: [
            {
              type: 'heading',
              attrs: { id: null, level: 2, track: [] },
              content: [
                {
                  text: 'Column 1',
                  type: 'text',
                  marks: [
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T10:00:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    }
                  ]
                }
              ]
            },
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [
                {
                  text: 'Aenean rutrum, ligula non faucibus euismod, ipsum lacus aliquet odio, non tempus tortor neque eu leo. Sed sagittis tellus eget arcu porttitor pretium. Praesent semper tempus eros, vel consectetur eros imperdiet sit amet. Nullam vel mi vel erat pellentesque dignissim. Proin luctus magna augue, sed accumsan sapien gravida eu',
                  type: 'text',
                  marks: [
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T10:00:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    },
                    { type: 'text-color', attrs: { color: null, bgColor: null } }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'columnBlock',
          attrs: { track: [] },
          content: [
            {
              type: 'heading',
              attrs: { id: null, level: 2, track: [] },
              content: [
                {
                  text: 'Column 2',
                  type: 'text',
                  marks: [
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T10:00:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    }
                  ]
                }
              ]
            },
            {
              type: 'paragraph',
              attrs: { track: [] },
              content: [
                {
                  text: 'Sed vitae lectus non diam finibus pharetra. Donec consequat enim vitae mi aliquet, in vestibulum elit egestas. Donec nec dignissim enim. Proin suscipit libero nec quam viverra condimentum. Mauris quis ex sed purus iaculis molestie id ac diam.',
                  type: 'text',
                  marks: [
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-08-04T10:00:00.000Z',
                        user: '256638cc-980a-4f03-99be-343bdc1e2a96',
                        approved: true,
                        username: 'm.sadura@outlook.com'
                      }
                    },
                    { type: 'text-color', attrs: { color: null, bgColor: null } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export default {
  title: 'common/CharmEditor/Plugins/Columns',
  component: Columns,
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

export function Columns() {
  return renderEditorWithContent({ content: contentWithColumnsAndTables, title: 'Columns' });
}
