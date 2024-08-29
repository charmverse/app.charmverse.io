import { buildSchema } from './buildSchema';
import { bulletList } from './specs/bulletList';
import { listItem } from './specs/listItem';
import { tabIndentSpec } from './specs/tabIndent';

export const schema = buildSchema([bulletList, listItem, tabIndentSpec]);
