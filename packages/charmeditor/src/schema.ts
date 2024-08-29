import { buildSchema } from './buildSchema';
import * as bold from './extensions/bold';
import * as bulletList from './extensions/bulletList';
import * as doc from './extensions/doc';
import * as hardBreak from './extensions/hardBreak';
import * as italic from './extensions/italic';
import * as listItem from './extensions/listItem/listItemSpec';
import * as paragraph from './extensions/paragraph';
import * as tabIndent from './extensions/tabIndent';
import * as text from './extensions/text';

export const schema = buildSchema([
  // force the first element to be a bullet_list
  doc.spec({ content: 'bullet_list' }),
  bulletList.spec,
  listItem.spec,
  hardBreak.spec,
  paragraph.spec,
  text.spec,
  bold.spec(),
  italic.spec(),
  tabIndent.spec
]);
