import { buildSchema } from './buildSchema';
import { bulletList } from './extensions/bulletList';
import { listItem } from './extensions/listItem/listItemSpec';
import { spec as tabIndentSpec } from './extensions/tabIndent';

export const schema = buildSchema([bulletList, listItem, tabIndentSpec]);
